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
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https:",
      "frame-ancestors 'none'",
    ].join("; ")
  );
  if (req.secure || req.headers["x-forwarded-proto"] === "https") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
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

function isPrivateIp(ip: string): boolean {
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

// ─── IP GEO CHECK (Africa-only for admin) ────────────────────────────────────
async function getIpCountry(ip: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=countryCode,status`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const data = await res.json() as { status: string; countryCode?: string };
    if (data.status === "success" && data.countryCode) return data.countryCode;
    return null;
  } catch {
    return null;
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
  } catch (err) {
    console.error("[security] unblockIp error:", err);
  }
}

// ─── IP BLOCK MIDDLEWARE ──────────────────────────────────────────────────────
export function ipBlockMiddleware(req: Request, res: Response, next: NextFunction) {
  const ip = getClientIp(req);
  if (isIpBlocked(ip)) {
    return res.status(403).json({ message: "Accès refusé. Votre adresse IP est bloquée." });
  }
  next();
}

// ─── AFRICA-ONLY MIDDLEWARE (pour routes admin) ───────────────────────────────
export function africaOnlyAdmin(req: Request, res: Response, next: NextFunction) {
  const ip = getClientIp(req);
  if (isPrivateIp(ip)) return next();

  getIpCountry(ip).then((countryCode) => {
    if (!countryCode) return next();
    if (!AFRICAN_COUNTRY_CODES.has(countryCode)) {
      logSecurityEvent({
        type: "non_africa_admin_access",
        details: `IP ${ip} (${countryCode}) a tenté d'accéder à la route admin`,
        ipAddress: ip,
        userAgent: req.headers["user-agent"],
      }).catch(() => {});
      return res.status(403).json({
        message: "Accès refusé. Accès admin limité à l'Afrique.",
        code: "GEO_BLOCKED",
      });
    }
    next();
  }).catch(() => next());
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
// Called on server startup so every deploy forces all users to reconnect.
// Uses a short retry loop because the session table may not exist yet
// (connect-pg-simple creates it lazily on first request).
export async function invalidateAllSessionsOnStartup(): Promise<void> {
  if (!pool) return;

  const attemptDelete = async (): Promise<boolean> => {
    try {
      const client = await pool!.connect();
      // Check if the table exists first
      const check = await client.query(
        `SELECT to_regclass('public.session') AS tbl`
      );
      const exists = check.rows[0]?.tbl !== null;
      if (!exists) {
        client.release();
        return false; // table not ready yet
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

  // Try immediately; if the table isn't there yet, retry a few times
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

// Initialize cache on startup
loadBlockedIps().catch(() => {});
setInterval(() => loadBlockedIps().catch(() => {}), CACHE_TTL);
