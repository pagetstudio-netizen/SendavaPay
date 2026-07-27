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
const GEO_BYPASS_PATHS = new Set([
  "/api/health",
  "/api/health/",
  "/pay",
]);

const UPTIME_MONITOR_AGENTS = [
  "uptimerobot", "pingdom", "statuscake", "freshping", "hetrixtools",
  "better uptime", "updown.io", "hyperping", "pulsetic", "monitis",
];

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

// ─── POSTGRESQL QUERY HELPERS ────────────────────────────────────────────────
// Convert ? placeholders to $1, $2, ... for PostgreSQL
function toPg(sql: string): string {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

async function dbQuery(sql: string, params: any[] = []): Promise<any[]> {
  if (!pool) return [];
  try {
    const result = await pool.query(toPg(sql), params);
    return result.rows;
  } catch {
    return [];
  }
}

async function dbExecute(sql: string, params: any[] = []): Promise<number> {
  if (!pool) return 0;
  try {
    const result = await pool.query(toPg(sql), params);
    return result.rowCount ?? 0;
  } catch {
    return 0;
  }
}

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
  for (const [key, val] of ipInfoCache) {
    if (now - val.checkedAt > IP_CACHE_TTL) ipInfoCache.delete(key);
  }
  for (const [key, val] of rateLimitStore) {
    if (now > val.blockedUntil && now - val.windowStart > 24 * 60 * 60 * 1000) {
      rateLimitStore.delete(key);
    }
  }
}, 15 * 60 * 1000);

// ─── SECONDARY VPN CHECK via proxycheck.io ────────────────────────────────────
async function checkProxyCheckIo(ip: string): Promise<boolean> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch(`https://proxycheck.io/v2/${ip}?vpn=1&asn=1`, { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) return false;
    const data = await res.json() as Record<string, any>;
    const entry = data[ip];
    if (!entry) return false;
    return entry.proxy === "yes" || entry.type === "VPN" || entry.type === "TOR";
  } catch {
    return false;
  }
}

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

    let isProxy = !!data.proxy;
    const isHosting = !!data.hosting;
    const isAfrica = data.countryCode ? AFRICAN_COUNTRY_CODES.has(data.countryCode) : false;

    if (!isProxy && !isHosting) {
      isProxy = await checkProxyCheckIo(ip);
    }

    const info: IpInfo = {
      countryCode: data.countryCode || null,
      isProxy,
      isHosting,
      isAfrica,
      checkedAt: Date.now(),
    };
    ipInfoCache.set(ip, info);
    return info;
  } catch {
    return null;
  }
}

// ─── COUNTRY CHECK ────────────────────────────────────────────────────────────
export async function getIpCountry(ip: string): Promise<{ countryCode: string | null; isVpn: boolean } | null> {
  if (isPrivateIp(ip)) return { countryCode: "TG", isVpn: false };
  const info = await getIpInfo(ip);
  if (!info) return null;
  return {
    countryCode: info.countryCode,
    isVpn: info.isProxy || info.isHosting,
  };
}

// ─── BOT USER-AGENT DETECTION ─────────────────────────────────────────────────
const BOT_UA_PATTERNS = [
  /^curl\//i, /^wget\//i, /^python-requests\//i, /^python\//i,
  /^axios\//i, /^node-fetch\//i, /^got\//i, /^undici\//i,
  /^okhttp\//i, /^java\//i, /^go-http-client\//i, /^libwww-perl\//i,
  /^lwp-trivial\//i, /^scrapy\//i, /^httpie\//i,
  /masscan/i, /zgrab/i, /nikto/i, /sqlmap/i, /nmap/i,
  /nuclei/i, /dirbuster/i, /burpsuite/i,
];

export function suspiciousUaMiddleware(req: Request, res: Response, next: NextFunction) {
  if (process.env.NODE_ENV !== "production") return next();
  const ua = req.headers["user-agent"] || "";
  if (!ua.trim()) {
    console.warn(`[security] Requête sans User-Agent bloquée — IP: ${getClientIp(req)} PATH: ${req.path}`);
    return res.status(403).json({ message: "Accès refusé." });
  }
  if (BOT_UA_PATTERNS.some(p => p.test(ua))) {
    console.warn(`[security] Bot UA bloqué — IP: ${getClientIp(req)} UA: ${ua.slice(0, 80)}`);
    return res.status(403).json({ message: "Accès refusé." });
  }
  next();
}

// ─── CROSS-ACCOUNT BRUTE FORCE DETECTION PER IP ───────────────────────────────
export async function checkCrossAccountBruteForce(ip: string): Promise<boolean> {
  if (!pool || !ip || ip === "::1" || ip.startsWith("127.")) return false;
  try {
    const rows = await dbQuery(
      `SELECT COUNT(DISTINCT email_or_phone) AS cnt
       FROM login_attempts
       WHERE ip_address = ? AND success = false AND created_at > NOW() - INTERVAL '30 minutes'`,
      [ip]
    );
    const cnt = parseInt(rows[0]?.cnt ?? "0");
    return cnt >= 3;
  } catch {
    return false;
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

// ─── SPECIFIC RATE LIMITERS ───────────────────────────────────────────────────
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
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=()");
  res.removeHeader("X-Powered-By");
  res.setHeader("Server", "sendavapay");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Resource-Policy", "same-site");
  res.setHeader("Cross-Origin-Embedder-Policy", "unsafe-none");
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
  if (req.secure || req.headers["x-forwarded-proto"] === "https") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  }
  next();
}

// ─── GLOBAL API RATE LIMITER ──────────────────────────────────────────────────
export const globalApiRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  blockDurationMs: 5 * 60 * 1000,
  message: "Trop de requêtes. Réessayez dans quelques minutes.",
});

// ─── ADMIN ACTION LOGGER ──────────────────────────────────────────────────────
export function adminActionLogger(req: Request, _res: Response, next: NextFunction): void {
  if (req.method !== "GET" && req.method !== "HEAD" && req.method !== "OPTIONS") {
    const userId = req.session?.userId ?? "anonymous";
    const ip     = getClientIp(req);
    console.log(`[admin-audit] ${req.method} ${req.path} — user=${userId} ip=${ip}`);
    if (pool) {
      dbExecute(
        `INSERT INTO security_events (user_id, type, details, ip_address) VALUES (?, ?, ?, ?)`,
        [
          typeof userId === "number" ? userId : null,
          "admin_action",
          `${req.method} ${req.path}`,
          ip,
        ]
      ).catch(() => {});
    }
  }
  next();
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
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

// ─── ALLOWED IPs CACHE (whitelist) ────────────────────────────────────────────
let allowedIpCache: Set<string> = new Set();
let allowedCacheLoadedAt = 0;
const ALLOWED_CACHE_TTL = 60 * 1000;

async function loadAllowedIps(): Promise<void> {
  if (!pool) return;
  try {
    await dbExecute(`
      CREATE TABLE IF NOT EXISTS allowed_ips (
        id SERIAL PRIMARY KEY,
        ip_address VARCHAR(45) NOT NULL UNIQUE,
        label VARCHAR(255),
        added_by INTEGER,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    const rows = await dbQuery(`SELECT ip_address FROM allowed_ips`);
    allowedIpCache = new Set(rows.map((r: any) => r.ip_address));
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
    await dbExecute(
      `INSERT INTO allowed_ips (ip_address, label, added_by)
       VALUES (?, ?, ?)
       ON CONFLICT (ip_address) DO UPDATE SET label=EXCLUDED.label, added_by=EXCLUDED.added_by`,
      [ip, label || null, addedBy ?? null]
    );
    allowedIpCache.add(ip);
    await unblockIp(ip);
  } catch (err) {
    console.error("[security] allowIp error:", err);
  }
}

export async function removeAllowedIp(ip: string): Promise<void> {
  if (!pool) return;
  try {
    await dbExecute(`DELETE FROM allowed_ips WHERE ip_address = ?`, [ip]);
    allowedIpCache.delete(ip);
  } catch (err) {
    console.error("[security] removeAllowedIp error:", err);
  }
}

// ─── BLOCK DURATION CONSTANTS ─────────────────────────────────────────────────
export const BLOCK_DURATION = {
  DEFAULT_MS:    2  * 60 * 60 * 1000,
  BRUTE_FORCE_MS: 1  * 60 * 60 * 1000,
  ADMIN_GEO_MS:   6  * 60 * 60 * 1000,
  MANUAL_MS:     24  * 60 * 60 * 1000,
  EXTENSION_MS:   6  * 60 * 60 * 1000,
  MAX_MS:   7 * 24  * 60 * 60 * 1000,
};

// ─── BLOCKED IPs CACHE ────────────────────────────────────────────────────────
let blockedIpCache: Set<string> = new Set();
let cacheLoadedAt = 0;
const CACHE_TTL = 60 * 1000;

async function loadBlockedIps(): Promise<void> {
  if (!pool) return;
  try {
    const rows = await dbQuery(
      `SELECT ip_address FROM blocked_ips WHERE expires_at > NOW()`
    );
    blockedIpCache = new Set(rows.map((r: any) => r.ip_address));
    cacheLoadedAt = Date.now();
  } catch {
    // DB not ready yet
  }
}

async function purgeExpiredBlocks(): Promise<void> {
  if (!pool) return;
  try {
    const count = await dbExecute(`DELETE FROM blocked_ips WHERE expires_at <= NOW()`);
    if (count > 0) console.log(`[security] ${count} IP(s) expirée(s) supprimée(s) automatiquement.`);
  } catch { /* silent */ }
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

export async function blockIp(
  ip: string,
  reason: string,
  blockedBy?: number,
  expiresAtOrDuration?: Date | number
): Promise<void> {
  if (!pool) return;
  try {
    let expiresAt: Date;

    if (expiresAtOrDuration instanceof Date) {
      expiresAt = expiresAtOrDuration;
    } else {
      const durationMs = typeof expiresAtOrDuration === "number"
        ? expiresAtOrDuration
        : BLOCK_DURATION.DEFAULT_MS;
      expiresAt = new Date(Date.now() + durationMs);
    }

    const maxExpiry = new Date(Date.now() + BLOCK_DURATION.MAX_MS);
    if (expiresAt > maxExpiry) expiresAt = maxExpiry;

    // Si déjà bloqué, on garde la durée la plus longue (pas de raccourcissement)
    await dbExecute(
      `INSERT INTO blocked_ips (ip_address, reason, blocked_by, expires_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT (ip_address) DO UPDATE SET
         reason=EXCLUDED.reason, blocked_by=EXCLUDED.blocked_by,
         expires_at=GREATEST(blocked_ips.expires_at, EXCLUDED.expires_at)`,
      [ip, reason, blockedBy ?? null, expiresAt]
    );
    blockedIpCache.add(ip);
    ipInfoCache.delete(ip);
  } catch (err) {
    console.error("[security] blockIp error:", err);
  }
}

async function extendIpBlock(ip: string): Promise<void> {
  if (!pool) return;
  try {
    const maxExpiry = new Date(Date.now() + BLOCK_DURATION.MAX_MS);
    await dbExecute(
      `UPDATE blocked_ips
       SET expires_at = LEAST(
         GREATEST(expires_at, NOW()) + INTERVAL '6 hours',
         ?
       )
       WHERE ip_address = ?`,
      [maxExpiry, ip]
    );
  } catch { /* silent */ }
}

export async function unblockIp(ip: string): Promise<void> {
  if (!pool) return;
  try {
    await dbExecute(`DELETE FROM blocked_ips WHERE ip_address = ?`, [ip]);
    blockedIpCache.delete(ip);
    ipInfoCache.delete(ip);
  } catch (err) {
    console.error("[security] unblockIp error:", err);
  }
}

const IP_BLOCK_BYPASS_PREFIXES = ["/api/sdk", "/api/v1", "/api/webhook", "/pay", "/api/partner-page"];

// ─── IP BLOCK MIDDLEWARE ──────────────────────────────────────────────────────
export function ipBlockMiddleware(req: Request, res: Response, next: NextFunction) {
  if (process.env.NODE_ENV !== "production") return next();

  if (IP_BLOCK_BYPASS_PREFIXES.some(p => req.path === p || req.path.startsWith(p + "/"))) return next();

  const ua = (req.headers["user-agent"] || "").toLowerCase();
  if (SEARCH_ENGINE_BOTS.some(bot => ua.includes(bot))) return next();

  const ip = getClientIp(req);
  if (isIpAllowed(ip)) return next();
  if (isIpBlocked(ip)) {
    extendIpBlock(ip).catch(() => {});
    return res.status(403).json({ message: "Accès refusé." });
  }
  next();
}

// ─── GLOBAL GEO + VPN BLOCK MIDDLEWARE ───────────────────────────────────────
const GEO_BYPASS_PREFIXES = [
  "/pay",
  "/api/webhook",
  "/api/verify-",
  "/api/sdk",
  "/api/v1",
  "/api/partner-page",
];

export function geoAndVpnBlockMiddleware(req: Request, res: Response, next: NextFunction) {
  if (process.env.NODE_ENV !== "production") return next();

  if (GEO_BYPASS_PATHS.has(req.path)) return next();
  if (GEO_BYPASS_PREFIXES.some(prefix => req.path.startsWith(prefix + "/") || req.path === prefix)) return next();

  const ua = (req.headers["user-agent"] || "").toLowerCase();
  if (UPTIME_MONITOR_AGENTS.some(agent => ua.includes(agent))) return next();
  if (SEARCH_ENGINE_BOTS.some(bot => ua.includes(bot))) return next();

  const ip = getClientIp(req);

  if (isPrivateIp(ip)) return next();
  if (isIpAllowed(ip)) return next();
  if (isIpBlocked(ip)) return next();

  getIpInfo(ip)
    .then(async (info) => {
      if (!info) return next();

      const isVpn = info.isProxy || info.isHosting;

      if (!info.isAfrica || isVpn) {
        const reason = isVpn
          ? `VPN/Proxy détecté automatiquement (${info.countryCode || "inconnu"})`
          : `Pays non-africain: ${info.countryCode || "inconnu"}`;

        const blockDur = isVpn ? BLOCK_DURATION.DEFAULT_MS * 2 : BLOCK_DURATION.DEFAULT_MS;
        await blockIp(ip, reason, undefined, blockDur);

        await logSecurityEvent({
          type: isVpn ? "vpn_blocked" : "geo_blocked",
          details: reason,
          ipAddress: ip,
          userAgent: req.headers["user-agent"],
        }).catch(() => {});

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

// ─── AFRICA-ONLY MIDDLEWARE (legacy) ─────────────────────────────────────────
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
    await dbExecute(
      `INSERT INTO security_events (user_id, type, details, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?)`,
      [
        data.userId ?? null,
        data.type,
        data.details ?? null,
        data.ipAddress ?? null,
        Array.isArray(data.userAgent) ? data.userAgent[0] : (data.userAgent ?? null),
      ]
    );
  } catch {
    // silent
  }
}

// ─── LOGIN ATTEMPTS TRACKER ───────────────────────────────────────────────────
export async function recordLoginAttempt(emailOrPhone: string, ip: string, success: boolean): Promise<void> {
  if (!pool) return;
  try {
    await dbExecute(
      `INSERT INTO login_attempts (email_or_phone, ip_address, success) VALUES (?, ?, ?)`,
      [emailOrPhone, ip, success ? 1 : 0]
    );
  } catch {
    // silent
  }
}

export async function countRecentFailedAttempts(emailOrPhone: string, windowMs = 15 * 60 * 1000): Promise<number> {
  if (!pool) return 0;
  try {
    const cutoff = new Date(Date.now() - windowMs).toISOString().slice(0, 19).replace("T", " ");
    const rows = await dbQuery(
      `SELECT COUNT(*) as cnt FROM login_attempts
       WHERE email_or_phone = ? AND success = false AND created_at > ?`,
      [emailOrPhone, cutoff]
    );
    return parseInt(rows[0]?.cnt ?? "0");
  } catch {
    return 0;
  }
}

export async function isNewIpForIdentifier(identifier: string, ip: string): Promise<boolean> {
  if (!pool || !ip || ip === "::1" || ip.startsWith("127.")) return false;
  try {
    const rows = await dbQuery(
      `SELECT 1 FROM login_attempts WHERE email_or_phone = ? AND ip_address = ? AND success = true LIMIT 1`,
      [identifier, ip]
    );
    return rows.length === 0;
  } catch {
    return false;
  }
}

// ─── SESSION INVALIDATION (admin) ─────────────────────────────────────────────
export async function invalidateAllOtherAdminSessions(userId: number, currentSid: string): Promise<void> {
  if (!pool) return;
  try {
    await dbExecute(
      `DELETE FROM sessions WHERE (sess->>'userId')::integer = ? AND sid != ?`,
      [userId, currentSid]
    );
  } catch (err) {
    console.error("[security] invalidateAllOtherAdminSessions error:", err);
  }
}

// ─── INVALIDATE ALL SESSIONS ON STARTUP ───────────────────────────────────────
export async function invalidateAllSessionsOnStartup(): Promise<void> {
  if (!pool) return;

  const attemptDelete = async (): Promise<boolean> => {
    try {
      // Check if session table exists (PostgreSQL way)
      const rows = await dbQuery(
        `SELECT table_name FROM information_schema.tables
         WHERE table_schema = current_schema() AND table_name = 'sessions'`
      );
      if (rows.length === 0) return false;

      const count = await dbExecute(`DELETE FROM sessions`);
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
setInterval(() => purgeExpiredBlocks().catch(() => {}), 60 * 60 * 1000);

// ─── SOURCE FILE SHIELD ───────────────────────────────────────────────────────
const SENSITIVE_PATH_PATTERNS: RegExp[] = [
  /^\/server\//i,
  /^\/shared\//i,
  /^\/client\//i,
  /^\/script\//i,
  /^\/node_modules\//i,
  /^\/\./i,
  /^\/(package(-lock)?\.json|drizzle\.config\.[^/]+|tsconfig[^/]*\.json|vite\.config\.[^/]+|tailwind\.config\.[^/]+|postcss\.config\.[^/]+|ecosystem\.config\.[^/]+|build\.[^/]+)$/i,
  /\.ts$/i,
  /\.(php|py)$/i,
];

export function blockSensitivePaths(req: Request, res: Response, next: NextFunction): void {
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
