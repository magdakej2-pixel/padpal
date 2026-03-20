// ============================================
// PadPal — Shared Rate Limiter + Input Validation
// ============================================

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

/**
 * In-memory rate limiter (per key, default 30 req/min).
 * Returns true if the request should be BLOCKED.
 */
export function isRateLimited(
  key: string,
  limit = 30,
  windowMs = 60000
): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  entry.count++;
  return entry.count > limit;
}

/**
 * Get a rate-limit key from request headers.
 */
export function getRateLimitKey(req: Request, prefix: string): string {
  const headers = req.headers;
  const ip =
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown";
  return `${prefix}:${ip}`;
}

/**
 * Sanitize a user-provided string: trim, limit length, strip control characters.
 */
export function sanitizeString(
  input: unknown,
  maxLength = 500
): string {
  if (typeof input !== "string") return "";
  return input
    .trim()
    .slice(0, maxLength)
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
}

/**
 * Validate an email format (basic regex).
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validate a UUID v4 format.
 */
export function isValidUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}
