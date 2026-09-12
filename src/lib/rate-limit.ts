import { createHash } from "node:crypto";
import { Redis } from "@upstash/redis";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Rate limiting cố định cửa sổ (fixed window) với 2 backend:
 *
 * 1. Upstash Redis (khi có UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN)
 *    — 1 roundtrip HTTP duy nhất qua script EVAL nguyên tử (INCR + PEXPIRE +
 *    PTTL). Scale multi-instance sạch vì mọi instance chia sẻ cùng bộ đếm,
 *    không phụ thuộc database chính.
 *
 * 2. Fallback bảng Postgres RateLimitBucket (mặc định local/dev) — giữ đúng
 *    logic cũ: INSERT .. ON CONFLICT DO UPDATE trong 1 câu query.
 *
 * Cả hai trả về cùng shape nên caller (login, API public, password reset…)
 * không cần biết đang chạy backend nào. Lỗi backend được ném lên trên như
 * trước đây (fail-closed, nhất quán với xử lý AUTH_SERVICE_UNAVAILABLE).
 */

export function rateLimitKey(scope: string, value: string): string {
  return `${scope}:${createHash("sha256").update(value).digest("hex")}`;
}

export type RateLimitDecision = {
  allowed: boolean;
  key: string;
  retryAfterSeconds: number;
};

/** Đếm nguyên tử: INCR, lần đầu đặt TTL, đọc PTTL còn lại của cửa sổ. */
const WINDOW_LUA = `
local count = redis.call('INCR', KEYS[1])
if count == 1 then
  redis.call('PEXPIRE', KEYS[1], ARGV[1])
end
return {count, redis.call('PTTL', KEYS[1])}
`;

// Cache client theo cặp (url, token) — đọc env mỗi lần gọi để script test có
// thể bật/tắt backend bằng biến môi trường mà không cần hook module.
let redisCache: { url: string; token: string; client: Redis } | null = null;

function getUpstashRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;
  if (redisCache?.url === url && redisCache?.token === token) {
    return redisCache.client;
  }
  const client = new Redis({ url, token });
  redisCache = { url, token, client };
  return client;
}

async function consumeRateLimitRedis(
  client: Redis,
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitDecision> {
  // Upstash trả bảng Lua về dạng mảng; số có thể là chuỗi → ép Number().
  const result: unknown = await client.eval(WINDOW_LUA, [key], [String(windowMs)]);
  const parts = Array.isArray(result) ? result : [result];
  const count = Number(parts[0]);
  let ttlMs = Number(parts[1]);

  // TTL mất (-1) hoặc đã hết (0): khôi phục TTL để bucket không sống mãi.
  if (!Number.isFinite(count) || !Number.isFinite(ttlMs) || ttlMs <= 0) {
    await client.pexpire(key, windowMs);
    ttlMs = windowMs;
  }
  return {
    allowed: count <= limit,
    key,
    retryAfterSeconds: Math.max(1, Math.ceil(ttlMs / 1000)),
  };
}

async function consumeRateLimitPostgres(
  key: string,
  limit: number,
  windowMs: number,
  now: Date
): Promise<RateLimitDecision> {
  const windowStart = now;
  const expiresAt = new Date(now.getTime() + windowMs);
  // TIMEZONE-SAFETY: cột naive-UTC so với timestamptz phải ép cùng múi giờ
  // (xem booking-expire.ts). Không ép → session TZ +07 đọc bucket "đã hết
  // hạn từ 7 tiếng trước" → reset count mỗi request → rate limit vô hiệu.
  const nowNutc = Prisma.sql`(${now} AT TIME ZONE 'UTC')`;
  const rows = await prisma.$queryRaw<{ count: number; expiresAt: Date }[]>(
    Prisma.sql`
      INSERT INTO "RateLimitBucket" ("key", "count", "windowStart", "expiresAt")
      VALUES (${key}, 1, ${windowStart}, ${expiresAt})
      ON CONFLICT ("key") DO UPDATE
      SET
        "count" = CASE
          WHEN "RateLimitBucket"."expiresAt" <= ${nowNutc} THEN 1
          ELSE "RateLimitBucket"."count" + 1
        END,
        "windowStart" = CASE
          WHEN "RateLimitBucket"."expiresAt" <= ${nowNutc} THEN ${windowStart}
          ELSE "RateLimitBucket"."windowStart"
        END,
        "expiresAt" = CASE
          WHEN "RateLimitBucket"."expiresAt" <= ${nowNutc} THEN ${expiresAt}
          ELSE "RateLimitBucket"."expiresAt"
        END
      RETURNING "count", "expiresAt"
    `
  );

  const row = rows[0];
  const retryAfterSeconds = Math.max(1, Math.ceil((row.expiresAt.getTime() - now.getTime()) / 1000));
  return { allowed: row.count <= limit, key, retryAfterSeconds };
}

export async function consumeRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now = new Date()
): Promise<RateLimitDecision> {
  if (!Number.isInteger(limit) || limit < 1 || !Number.isInteger(windowMs) || windowMs < 1000) {
    throw new Error("Invalid rate limit configuration");
  }

  const redis = getUpstashRedis();
  if (redis) {
    return consumeRateLimitRedis(redis, key, limit, windowMs);
  }
  return consumeRateLimitPostgres(key, limit, windowMs, now);
}

export function getRequestIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    // Use the rightmost value — trusted reverse proxies append the real client IP
    // at the end. The leftmost values can be spoofed by the client.
    const parts = forwarded.split(",");
    return parts[parts.length - 1].trim();
  }
  return headers.get("x-real-ip")?.trim() || "unknown";
}
