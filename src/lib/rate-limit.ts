import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export function rateLimitKey(scope: string, value: string): string {
  return `${scope}:${createHash("sha256").update(value).digest("hex")}`;
}

export async function consumeRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now = new Date()
): Promise<{ allowed: boolean; key: string; retryAfterSeconds: number }> {
  if (!Number.isInteger(limit) || limit < 1 || !Number.isInteger(windowMs) || windowMs < 1000) {
    throw new Error("Invalid rate limit configuration");
  }

  const windowStart = now;
  const expiresAt = new Date(now.getTime() + windowMs);
  const rows = await prisma.$queryRaw<{ count: number; expiresAt: Date }[]>(
    Prisma.sql`
      INSERT INTO "RateLimitBucket" ("key", "count", "windowStart", "expiresAt")
      VALUES (${key}, 1, ${windowStart}, ${expiresAt})
      ON CONFLICT ("key") DO UPDATE
      SET
        "count" = CASE
          WHEN "RateLimitBucket"."expiresAt" <= ${now} THEN 1
          ELSE "RateLimitBucket"."count" + 1
        END,
        "windowStart" = CASE
          WHEN "RateLimitBucket"."expiresAt" <= ${now} THEN ${windowStart}
          ELSE "RateLimitBucket"."windowStart"
        END,
        "expiresAt" = CASE
          WHEN "RateLimitBucket"."expiresAt" <= ${now} THEN ${expiresAt}
          ELSE "RateLimitBucket"."expiresAt"
        END
      RETURNING "count", "expiresAt"
    `
  );

  const row = rows[0];
  const retryAfterSeconds = Math.max(1, Math.ceil((row.expiresAt.getTime() - now.getTime()) / 1000));
  return { allowed: row.count <= limit, key, retryAfterSeconds };
}

export function getRequestIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}
