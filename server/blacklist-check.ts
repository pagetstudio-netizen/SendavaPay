import { pool } from "./db";

let cache: Set<string> = new Set();
let lastRefresh = 0;
const CACHE_TTL = 3 * 60 * 1000;

export async function refreshBlacklistCache(): Promise<void> {
  if (!pool) return;
  try {
    const client = await pool.connect();
    try {
      const res = await client.query("SELECT phone_number FROM phone_blacklist");
      cache = new Set(res.rows.map((r: any) => normalizePhone(r.phone_number)));
      lastRefresh = Date.now();
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("[blacklist] Cache refresh error:", err);
  }
}

function normalizePhone(phone: string): string {
  return phone.replace(/\s+/g, "").toLowerCase();
}

export async function isPhoneBlacklisted(phone: string): Promise<boolean> {
  if (!phone) return false;
  if (Date.now() - lastRefresh > CACHE_TTL) {
    await refreshBlacklistCache();
  }
  return cache.has(normalizePhone(phone));
}

export function invalidateBlacklistCache(): void {
  lastRefresh = 0;
}

// ─── In-memory OTP store for unblock confirmations ───────────────────────────

interface UnblockOtpEntry {
  code: string;
  expiresAt: Date;
  adminId: number;
  phoneNumber: string;
}

const unblockOtps = new Map<number, UnblockOtpEntry>();

export function setUnblockOtp(blacklistId: number, code: string, adminId: number, phoneNumber: string): void {
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
  unblockOtps.set(blacklistId, { code, expiresAt, adminId, phoneNumber });
}

export function verifyUnblockOtp(blacklistId: number, code: string, adminId: number): boolean {
  const entry = unblockOtps.get(blacklistId);
  if (!entry) return false;
  if (new Date() > entry.expiresAt) {
    unblockOtps.delete(blacklistId);
    return false;
  }
  if (entry.adminId !== adminId) return false;
  if (entry.code !== code) return false;
  unblockOtps.delete(blacklistId);
  return true;
}

export function clearUnblockOtp(blacklistId: number): void {
  unblockOtps.delete(blacklistId);
}

setInterval(() => {
  const now = new Date();
  for (const [id, entry] of unblockOtps.entries()) {
    if (now > entry.expiresAt) unblockOtps.delete(id);
  }
}, 5 * 60 * 1000);
