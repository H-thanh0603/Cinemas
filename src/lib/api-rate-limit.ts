import { consumeRateLimit, getRequestIp, rateLimitKey } from "@/lib/rate-limit";

export type RateLimitResult = { allowed: true } | { allowed: false; retryAfterSeconds: number };

/**
 * Giới hạn API public theo IP. Trả false (kèm Retry-After) khi vượt limit.
 * Dùng cho các endpoint dễ bị spam (SSE seats, seats list).
 */
export async function checkApiRateLimit(
  headers: Headers,
  scope: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const ip = getRequestIp(headers);
  const key = rateLimitKey(`api:${scope}`, ip === "unknown" ? "global" : ip);
  const result = await consumeRateLimit(key, limit, windowMs);
  if (!result.allowed) {
    return { allowed: false, retryAfterSeconds: result.retryAfterSeconds };
  }
  return { allowed: true };
}
