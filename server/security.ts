import type { Request, Response, NextFunction } from "express";
import { pool } from "./db";

// ─── AFRICAN COUNTRY CODES ────────────────────────────────────────────────────
const AFRICAN_COUNTRY_CODES = new Set([
  "DZ","AO","BJ","BW","BF","BI","CM","CV","CF","TD","KM","CG","CD","CI",
  "DJ","EG","GQ","ER","SZ","ET","GA","GM","GH","GN","GW","KE","LS","LR",
  "LY","MG","MW","ML","MR","MU","YT","MA","MZ","NA","NE","NG","RE","RW",
  "SH","ST","SN","SC","SL","SO","ZA","SS","SD","TZ","TG","TN","UG","EH",
  "ZM","ZW"
]);

// Paths that bypass geo/VPN check
// (Telegram servers, health check, uptime monitors, payment gateway webhooks)
const GEO_BYPASS_PATHS = new Set([
  // Health & monitoring
  "/api/health",
  "/api/health/",
  // Telegram
  "/api/webhook/telegram",
  // Payment gateway webhooks — leurs serveurs sont des datacenters hors-Afrique
  "/api/webhook/paydunya",
  "/api/webhook/paydunya-disburse",
  "/api/webhook/soleaspay",
  "/api/webhook/maishapay",
  "/api/webhook/omnipay",
  "/api/webhook/mbiyopay",
  "/api/webhook/paxity",
  "/api/webhook/leekpay",
  // Public payment pages (clients externes)
  "/pay",
]);

// User-agents used by uptime monitoring services
const UPTIME_MONITOR_AGENTS = [
  "uptimerobot", "pingdom", "statuscake", "freshping", "hetrixtools",
  "better uptime", "updown.io", "hyperping", "pulsetic", "monitis",
];

// Search engine crawlers — must never be blocked (critical for SEO indexing)
const SEARCH_ENGINE_BOTS = [
  "googlebot", "google-inspectiontool", "google-structured-data-testing-tool",
  "google-safety", "googlelc", "adsbot-google", "mediapartners-google",
  "bingbot", "msnbot", "bingpreview",
  "yandexbot", "yandeximages", "yandexvideo",
  "duckduckbot",
  "baiduspider",
  "facebot", "facebookexternalhit",
  "twitterbot",
  "linkedinbot",
  "slackbot",
  "whatsapp",
  "applebot",
  "semrushbot", "ahrefsbot", "mj12bot", "dotbot",
];

// ─── IP INFO CACHE ────────────────────────────────────────────────────────────
interface IpInfo {
  countryCode: string | null;
  isProxy: boolean;
  isHosting: boolean;
  isAfrica: boolean;
  checkedAt: number;
}

const ipInfoCache = new Map<string, IpInfo>();
const IP_CACHE_TTL = 60 * 60 * 1000; // 1 hour

// Nettoyage périodique des Maps pour éviter les fuites mémoire
setInterval(() => {
  const now = Date.now();
  // Supprimer les entrées IP expirées
  for (const [key, val] of ipInfoCache) {
    if (now - val.checkedAt > IP_CACHE_TTL) ipInfoCache.delete(key);
  }
  // Supprimer les entrées rate-limit expirées (fenêtre fermée ET plus bloquée)
  for (const [key, val] of rateLimitStore) {
    if (now > val.blockedUntil && now - val.windowStart > 24 * 60 * 60 * 1000) {
      rateLimitStore.delete(key);
    }
  }
}, 15 * 60 * 1000); // toutes les 15 minutes

async function getIpInfo(ip: string): Promise<IpInfo | null> {
  const cached = ipInfoCache.get(ip);
  if (cached && Date.now() - cached.checkedAt < IP_CACHE_TTL) return cached;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,countryCode,proxy,hosting`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);
    if (!res.ok) return null;
    const data = await res.json() as {
      status: string;
      countryCode?: string;
      proxy?: boolean;
      hosting?: boolean;
    };
    if (data.status !== "success") return null;
    const info: IpInfo = {
      countryCode: data.countryCode || null,
      isProxy: !!data.proxy,
      isHosting: !!data.hosting,
      isAfrica: data.countryCode ? AFRICAN_COUNTRY_CODES.has(data.countryCode) : false,
      checkedAt: Date.now(),
    };
    ipInfoCache.set(ip, info);
    return info;
  } catch {
    return null;
  }
}

// ─── IN-MEMORY RATE LIMITER ───────────────────────────────────────────────────
interface RateLimitEntry { count: number; windowStart: number; blocked: boolean; blockedUntil: number }
const rateLimitStore = new Map<string, RateLimitEntry>();

function getRateLimitKey(req: Request, prefix: string): string {
  const ip = getClientIp(req);
  return `${prefix}:${ip}`;
}

export function rateLimit(options: {
  windowMs: number;
  max: number;
  blockDurationMs?: number;
  message?: string;
}) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = getRateLimitKey(req, req.path);
    const now = Date.now();
    const blockDuration = options.blockDurationMs ?? options.windowMs * 2;

    let entry = rateLimitStore.get(key);

    if (!entry || now - entry.windowStart > options.windowMs) {
      entry = { count: 1, windowStart: now, blocked: false, blockedUntil: 0 };
      rateLimitStore.set(key, entry);
      return next();
    }

    if (entry.blocked && now < entry.blockedUntil) {
      const retryAfter = Math.ceil((entry.blockedUntil - now) / 1000);
      res.setHeader("Retry-After", retryAfter);
      return res.status(429).json({
        message: options.message ?? "Trop de requêtes. Réessayez plus tard.",
        retryAfterSeconds: retryAfter,
      });
    }

    entry.count++;
    if (entry.count > options.max) {
      entry.blocked = true;
      entry.blockedUntil = now + blockDuration;
      const retryAfter = Math.ceil(blockDuration / 1000);
      res.setHeader("Retry-After", retryAfter);
      return res.status(429).json({
        message: options.message ?? "Trop de requêtes. Réessayez plus tard.",
        retryAfterSeconds: retryAfter,
      });
    }

    rateLimitStore.set(key, entry);
    next();
  };
}

// ─── SPECIFIC RATE LIMITERS ──────────────────────────────────────────────────
export const loginRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  blockDurationMs: 15 * 60 * 1000,
  message: "Trop de tentatives de connexion. Compte temporairement verrouillé (15 min).",
});

export const withdrawRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  blockDurationMs: 10 * 60 * 1000,
  message: "Trop de demandes de retrait. Réessayez dans 10 minutes.",
});

export const registerRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  blockDurationMs: 30 * 60 * 1000,
  message: "Trop d'inscriptions depuis cette adresse. Réessayez dans 30 minutes.",
});

export const otpRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  blockDurationMs: 30 * 60 * 1000,
  message: "Trop de tentatives OTP. Compte verrouillé 30 minutes.",
});

export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: "Trop de requêtes API.",
});

// ─── SECURITY HEADERS ─────────────────────────────────────────────────────────
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // Prevent MIME-type sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");
  // Forbid framing (clickjacking protection)
  res.setHeader("X-Frame-Options", "DENY");
  // Legacy XSS filter
  res.setHeader("X-XSS-Protection", "1; mode=block");
  // No referrer leakage cross-origin
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  // Disable unnecessary browser features
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=()");
  // Never expose server technology
  res.removeHeader("X-Powered-By");
  res.setHeader("Server", "sendavapay");
  // Hide internal paths from cross-origin requesters
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Resource-Policy", "same-site");
  res.setHeader("Cross-Origin-Embedder-Policy", "unsafe-none");
  // Content Security Policy
  res.setHeader(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' https:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join("; ")
  );
  // HSTS — force HTTPS for 1 year
  if (req.secure || req.headers["x-forwarded-proto"] === "https") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  }
  next();
}

// ─── GLOBAL API RATE LIMITER ──────────────────────────────────────────────────
// Broad DDoS/abuse protection: 200 req/min per IP across all /api/* routes.
export const globalApiRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  blockDurationMs: 5 * 60 * 1000,
  message: "Trop de requêtes. Réessayez dans quelques minutes.",
});

// ─── ADMIN ACTION LOGGER ──────────────────────────────────────────────────────
// Logs every mutating request on /api/admin/* to the console and DB.
export function adminActionLogger(req: Request, _res: Response, next: NextFunction): void {
  if (req.method !== "GET" && req.method !== "HEAD" && req.method !== "OPTIONS") {
    const userId = req.session?.userId ?? "anonymous";
    const ip     = getClientIp(req);
    console.log(`[admin-audit] ${req.method} ${req.path} — user=${userId} ip=${ip}`);
    // Async DB log — never blocks the request
    if (pool) {
      pool.connect().then(client => {
        client.query(
          `INSERT INTO security_events (user_id, type, details, ip_address)
           VALUES ($1, $2, $3, $4)`,
          [
            typeof userId === "number" ? userId : null,
            "admin_action",
            `${req.method} ${req.path}`,
            ip,
          ]
        ).catch(() => {}).finally(() => client.release());
      }).catch(() => {});
    }
  }
  next();
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
export function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    return ips.split(",")[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || "0.0.0.0";
}

export function isPrivateIp(ip: string): boolean {
  return (
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    ip.startsWith("172.") ||
    ip === "0.0.0.0" ||
    ip.startsWith("::ffff:127.") ||
    ip.startsWith("::ffff:10.") ||
    ip.startsWith("::ffff:192.168.")
  );
}

// ─── ALLOWED IPs CACHE (whitelist) ───────────────────────────────────────────
let allowedIpCache: Set<string> = new Set();
let allowedCacheLoadedAt = 0;
const ALLOWED_CACHE_TTL = 60 * 1000;

async function loadAllowedIps(): Promise<void> {
  if (!pool) return;
  try {
    const client = await pool.connect();
    await client.query(`
      CREATE TABLE IF NOT EXISTS allowed_ips (
        id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        ip_address TEXT NOT NULL UNIQUE,
        label TEXT,
        added_by INTEGER,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    const result = await client.query(`SELECT ip_address FROM allowed_ips`);
    client.release();
    allowedIpCache = new Set(result.rows.map((r: any) => r.ip_address));
    allowedCacheLoadedAt = Date.now();
  } catch {
    // DB not ready yet
  }
}

export async function reloadAllowedIps(): Promise<void> {
  await loadAllowedIps();
}

export function isIpAllowed(ip: string): boolean {
  if (Date.now() - allowedCacheLoadedAt > ALLOWED_CACHE_TTL) {
    loadAllowedIps().catch(() => {});
  }
  return allowedIpCache.has(ip);
}

export async function allowIp(ip: string, label: string, addedBy?: number): Promise<void> {
  if (!pool) return;
  try {
    const client = await pool.connect();
    await client.query(
      `INSERT INTO allowed_ips (ip_address, label, added_by)
       VALUES ($1, $2, $3)
       ON CONFLICT (ip_address) DO UPDATE SET label=$2, added_by=$3`,
      [ip, label || null, addedBy ?? null]
    );
    client.release();
    allowedIpCache.add(ip);
    // Si l'IP était bloquée, on la débloque automatiquement
    await unblockIp(ip);
  } catch (err) {
    console.error("[security] allowIp error:", err);
  }
}

export async function removeAllowedIp(ip: string): Promise<void> {
  if (!pool) return;
  try {
    const client = await pool.connect();
    await client.query(`DELETE FROM allowed_ips WHERE ip_address = $1`, [ip]);
    client.release();
    allowedIpCache.delete(ip);
  } catch (err) {
    console.error("[security] removeAllowedIp error:", err);
  }
}

// ─── BLOCKED IPs CACHE ────────────────────────────────────────────────────────
let blockedIpCache: Set<string> = new Set();
let cacheLoadedAt = 0;
const CACHE_TTL = 60 * 1000;

async function loadBlockedIps(): Promise<void> {
  if (!pool) return;
  try {
    const client = await pool.connect();
    const result = await client.query(
      `SELECT ip_address FROM blocked_ips WHERE (expires_at IS NULL OR expires_at > NOW())`
    );
    client.release();
    blockedIpCache = new Set(result.rows.map((r: any) => r.ip_address));
    cacheLoadedAt = Date.now();
  } catch {
    // DB not ready yet
  }
}

export async function reloadBlockedIps(): Promise<void> {
  await loadBlockedIps();
}

export function isIpBlocked(ip: string): boolean {
  if (Date.now() - cacheLoadedAt > CACHE_TTL) {
    loadBlockedIps().catch(() => {});
  }
  return blockedIpCache.has(ip);
}

export async function blockIp(ip: string, reason: string, blockedBy?: number, expiresAt?: Date): Promise<void> {
  if (!pool) return;
  try {
    const client = await pool.connect();
    await client.query(
      `INSERT INTO blocked_ips (ip_address, reason, blocked_by, expires_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (ip_address) DO UPDATE SET reason=$2, blocked_by=$3, expires_at=$4`,
      [ip, reason, blockedBy ?? null, expiresAt ?? null]
    );
    client.release();
    blockedIpCache.add(ip);
    // Remove from geo cache so it doesn't bypass block check
    ipInfoCache.delete(ip);
  } catch (err) {
    console.error("[security] blockIp error:", err);
  }
}

export async function unblockIp(ip: string): Promise<void> {
  if (!pool) return;
  try {
    const client = await pool.connect();
    await client.query(`DELETE FROM blocked_ips WHERE ip_address = $1`, [ip]);
    client.release();
    blockedIpCache.delete(ip);
    ipInfoCache.delete(ip);
  } catch (err) {
    console.error("[security] unblockIp error:", err);
  }
}

// Paths/prefixes that must bypass the IP block check (API routes authenticated by key)
const IP_BLOCK_BYPASS_PREFIXES = ["/api/sdk", "/api/v1", "/api/webhook", "/pay", "/api/partner-page"];

// ─── IP BLOCK MIDDLEWARE ──────────────────────────────────────────────────────
export function ipBlockMiddleware(req: Request, res: Response, next: NextFunction) {
  // In development mode, skip IP blocking entirely
  if (process.env.NODE_ENV !== "production") return next();

  // API routes authenticated by key — never block by IP (datacenter/VPS IPs are legitimate)
  if (IP_BLOCK_BYPASS_PREFIXES.some(p => req.path === p || req.path.startsWith(p + "/"))) return next();

  // Search engine crawlers — never block even if their IP was previously auto-blocked
  const ua = (req.headers["user-agent"] || "").toLowerCase();
  if (SEARCH_ENGINE_BOTS.some(bot => ua.includes(bot))) return next();

  const ip = getClientIp(req);
  // Liste blanche : jamais bloquée
  if (isIpAllowed(ip)) return next();
  if (isIpBlocked(ip)) {
    return res.status(403).json({ message: "Accès refusé." });
  }
  next();
}

// ─── GLOBAL GEO + VPN BLOCK MIDDLEWARE ───────────────────────────────────────
// Blocks all IPs from outside Africa AND all VPN/proxy/hosting IPs.
// Auto-blocks them permanently in the DB and sends a Telegram alert.
// Prefixes that bypass geo/VPN check (e.g. /pay matches /pay/abc123)
// /api/sdk  — routes marchands SDK (auth par clé API, IP datacenter légitimes)
// /api/v1   — API marchands via merchant-api.ts (auth par clé API)
// /api/partner-page — pages publiques partenaires (accès monde entier)
const GEO_BYPASS_PREFIXES = ["/pay", "/api/sdk", "/api/v1", "/api/partner-page"];

export function geoAndVpnBlockMiddleware(req: Request, res: Response, next: NextFunction) {
  // In development mode, skip geo/VPN blocking entirely (Replit proxy IPs are US datacenters)
  if (process.env.NODE_ENV !== "production") return next();

  // Skip exact bypass paths
  if (GEO_BYPASS_PATHS.has(req.path)) return next();

  // Skip prefix-matched paths (e.g. /pay/code123)
  if (GEO_BYPASS_PREFIXES.some(prefix => req.path.startsWith(prefix + "/") || req.path === prefix)) return next();

  // Skip known uptime monitoring services
  const ua = (req.headers["user-agent"] || "").toLowerCase();
  if (UPTIME_MONITOR_AGENTS.some(agent => ua.includes(agent))) return next();

  // Skip search engine crawlers — never block (critical for SEO indexing)
  if (SEARCH_ENGINE_BOTS.some(bot => ua.includes(bot))) return next();

  const ip = getClientIp(req);

  // Always allow private/local IPs
  if (isPrivateIp(ip)) return next();

  // Liste blanche — jamais bloquée, même si hors-Afrique ou hébergeur
  if (isIpAllowed(ip)) return next();

  // Already blocked — let the ipBlockMiddleware handle it
  if (isIpBlocked(ip)) return next();

  getIpInfo(ip)
    .then(async (info) => {
      if (!info) {
        // Cannot determine — allow to avoid false positives
        return next();
      }

      const isVpn = info.isProxy || info.isHosting;

      if (!info.isAfrica || isVpn) {
        const reason = isVpn
          ? `VPN/Proxy détecté automatiquement (${info.countryCode || "inconnu"})`
          : `Pays non-africain: ${info.countryCode || "inconnu"}`;

        // Auto-block permanently in DB
        await blockIp(ip, reason);

        // Log security event
        await logSecurityEvent({
          type: isVpn ? "vpn_blocked" : "geo_blocked",
          details: reason,
          ipAddress: ip,
          userAgent: req.headers["user-agent"],
        }).catch(() => {});

        // Real-time Telegram alert with block button (fire-and-forget)
        try {
          const { notifyGeoBlocked } = await import("./telegram");
          notifyGeoBlocked({
            ip,
            countryCode: info.countryCode || "inconnu",
            isVpn,
            path: req.path,
          });
        } catch {}

        return res.status(403).json({ message: "Accès refusé." });
      }

      next();
    })
    .catch(() => next());
}

// ─── AFRICA-ONLY MIDDLEWARE (pour routes admin — legacy, remplacé par geoAndVpnBlockMiddleware) ─
export function africaOnlyAdmin(req: Request, res: Response, next: NextFunction) {
  next(); // handled globally now
}

// ─── SECURITY EVENT LOGGER ────────────────────────────────────────────────────
export async function logSecurityEvent(data: {
  userId?: number;
  type: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string | string[];
}): Promise<void> {
  if (!pool) return;
  try {
    const client = await pool.connect();
    await client.query(
      `INSERT INTO security_events (user_id, type, details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        data.userId ?? null,
        data.type,
        data.details ?? null,
        data.ipAddress ?? null,
        Array.isArray(data.userAgent) ? data.userAgent[0] : (data.userAgent ?? null),
      ]
    );
    client.release();
  } catch {
    // silent
  }
}

// ─── LOGIN ATTEMPTS TRACKER ───────────────────────────────────────────────────
export async function recordLoginAttempt(emailOrPhone: string, ip: string, success: boolean): Promise<void> {
  if (!pool) return;
  try {
    const client = await pool.connect();
    await client.query(
      `INSERT INTO login_attempts (email_or_phone, ip_address, success) VALUES ($1, $2, $3)`,
      [emailOrPhone, ip, success]
    );
    client.release();
  } catch {
    // silent
  }
}

export async function countRecentFailedAttempts(emailOrPhone: string, windowMs = 15 * 60 * 1000): Promise<number> {
  if (!pool) return 0;
  try {
    const client = await pool.connect();
    const cutoff = new Date(Date.now() - windowMs).toISOString();
    const result = await client.query(
      `SELECT COUNT(*) as cnt FROM login_attempts
       WHERE email_or_phone = $1 AND success = false AND created_at > $2`,
      [emailOrPhone, cutoff]
    );
    client.release();
    return parseInt(result.rows[0]?.cnt ?? "0");
  } catch {
    return 0;
  }
}

// ─── SESSION INVALIDATION (admin) ─────────────────────────────────────────────
export async function invalidateAllOtherAdminSessions(userId: number, currentSid: string): Promise<void> {
  if (!pool) return;
  try {
    const client = await pool.connect();
    await client.query(
      `DELETE FROM session WHERE (sess::jsonb->>'userId')::integer = $1 AND sid != $2`,
      [userId, currentSid]
    );
    client.release();
  } catch (err) {
    console.error("[security] invalidateAllOtherAdminSessions error:", err);
  }
}

// ─── INVALIDATE ALL SESSIONS ON STARTUP ───────────────────────────────────────
export async function invalidateAllSessionsOnStartup(): Promise<void> {
  if (!pool) return;

  const attemptDelete = async (): Promise<boolean> => {
    try {
      const client = await pool!.connect();
      const check = await client.query(
        `SELECT to_regclass('public.session') AS tbl`
      );
      const exists = check.rows[0]?.tbl !== null;
      if (!exists) {
        client.release();
        return false;
      }
      const result = await client.query(`DELETE FROM session`);
      client.release();
      const count = result.rowCount ?? 0;
      console.log(
        `[security] ${count} session(s) invalidée(s) au démarrage — tous les utilisateurs doivent se reconnecter.`
      );
      return true;
    } catch {
      return false;
    }
  };

  if (await attemptDelete()) return;

  let attempts = 0;
  const maxAttempts = 10;
  const interval = setInterval(async () => {
    attempts++;
    if (await attemptDelete() || attempts >= maxAttempts) {
      clearInterval(interval);
    }
  }, 2000);
}

// Initialize caches on startup
loadBlockedIps().catch(() => {});
setInterval(() => loadBlockedIps().catch(() => {}), CACHE_TTL);
loadAllowedIps().catch(() => {});
setInterval(() => loadAllowedIps().catch(() => {}), ALLOWED_CACHE_TTL);

// ─── SOURCE FILE SHIELD ───────────────────────────────────────────────────────
// Blocks any HTTP request that targets source code, config files, or dotfiles.
// This is a defense-in-depth measure: even if the web server (Nginx/Plesk) is
// misconfigured and routes these paths to Node, Express will return 403.
const SENSITIVE_PATH_PATTERNS: RegExp[] = [
  // Source directories
  /^\/server\//i,
  /^\/shared\//i,
  /^\/client\//i,
  /^\/script\//i,
  /^\/node_modules\//i,
  // Dotfiles (.replit, .env, .git, etc.)
  /^\/\./i,
  // Root-level config / build / lock files (any extension)
  /^\/(package(-lock)?\.json|drizzle\.config\.[^/]+|tsconfig[^/]*\.json|vite\.config\.[^/]+|tailwind\.config\.[^/]+|postcss\.config\.[^/]+|ecosystem\.config\.[^/]+|build\.[^/]+)$/i,
  // Any TypeScript source file served directly
  /\.ts$/i,
  // PHP / Python SDK sources
  /\.(php|py)$/i,
];

export function blockSensitivePaths(req: Request, res: Response, next: NextFunction): void {
  // In development, Vite serves .ts/.tsx source files directly — don't block them
  if (process.env.NODE_ENV !== "production") return next();

  const url = req.path || req.url;
  for (const pattern of SENSITIVE_PATH_PATTERNS) {
    if (pattern.test(url)) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }
  }
  next();
}
