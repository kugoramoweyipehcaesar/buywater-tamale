/**
 * Lightweight security helpers for BuyWater
 * - Rate limiting (in-memory; resets on server restart)
 * - Input sanitization
 * - Safe error messages
 */

const buckets = new Map();

/**
 * Simple sliding-window rate limit.
 * @returns {{ ok: true } | { ok: false, retryAfterSec: number }}
 */
export function rateLimit(key, { limit = 10, windowMs = 15 * 60 * 1000 } = {}) {
  const now = Date.now();
  let entry = buckets.get(key);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + windowMs };
    buckets.set(key, entry);
  }
  entry.count += 1;
  if (entry.count > limit) {
    return {
      ok: false,
      retryAfterSec: Math.ceil((entry.resetAt - now) / 1000),
    };
  }
  return { ok: true };
}

/** Normalize and validate email */
export function normalizeEmail(raw) {
  const email = String(raw || "")
    .toLowerCase()
    .trim()
    .slice(0, 254);
  // Basic RFC-like check (not perfect, blocks obvious junk)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  if (email.includes("..") || email.startsWith(".") || email.endsWith("."))
    return null;
  return email;
}

/** Strip control characters / trim long strings */
export function sanitizeText(raw, max = 500) {
  return String(raw || "")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim()
    .slice(0, max);
}

/** Password rules */
export function validatePassword(password) {
  const p = String(password || "");
  if (p.length < 6) return "Password must be at least 6 characters";
  if (p.length > 128) return "Password is too long";
  return null;
}

/** Client IP from request headers (best-effort behind proxies) */
export function clientIp(request) {
  const xf = request.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0].trim().slice(0, 64);
  return request.headers.get("x-real-ip") || "unknown";
}
