/**
 * Self-check rate limiting với CẢ HAI backend (chạy không cần HTTP server):
 *   npx tsx scripts/test-rate-limit.ts
 *
 * 1. Fallback Postgres (RateLimitBucket) — luôn chạy khi chưa cấu hình Upstash.
 * 2. Upstash Redis — mock endpoint REST của Upstash bằng fetch stub để kiểm
 *    tra đúng mapping INCR/PEXPIRE/PTTL mà không cần tài khoản Upstash thật.
 *    Khi có UPSTASH_REDIS_REST_URL/TOKEN trỏ tới Upstash thật, cùng code path
 *    này chạy nguyên bản qua mạng.
 */
import assert from "node:assert/strict";
import { prisma } from "../src/lib/prisma";
import { consumeRateLimit } from "../src/lib/rate-limit";

async function testPostgresBackend() {
  const key = `test:${Date.now()}:${Math.random()}`;

  const first = await consumeRateLimit(key, 2, 60_000);
  const second = await consumeRateLimit(key, 2, 60_000);
  const third = await consumeRateLimit(key, 2, 60_000);

  assert.ok(first.allowed && second.allowed, "hai request đầu phải được phép");
  assert.ok(!third.allowed, "request thứ ba trong cửa sổ phải bị chặn");
  assert.ok(third.retryAfterSeconds >= 1 && third.retryAfterSeconds <= 60);

  // Hết cửa sổ → đếm về 1 (dùng tham số now tương lai, không phải chờ thật)
  const later = new Date(Date.now() + 61_000);
  const fourth = await consumeRateLimit(key, 2, 60_000, later);
  assert.ok(fourth.allowed, "cửa sổ mới phải reset bộ đếm");

  await prisma.rateLimitBucket.deleteMany({ where: { key } });
  console.log("postgres backend checks passed");
}

async function testUpstashRedisBackend() {
  // ── Mock REST endpoint của Upstash ────────────────────────────────────
  const MOCK_URL = "https://mock-upstash.example";
  const store = new Map<string, { count: number; expireAt: number }>();
  let evalCallCount = 0;

  const realFetch = globalThis.fetch;
  const mockFetch = async (
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> => {
    const url = String(input);
    assert.ok(url.startsWith(MOCK_URL), `fetch phải gọi tới Upstash URL, nhận: ${url}`);

    // SDK gói mọi lệnh vào pipeline: body = [ [lệnh...], ... ]
    const body = JSON.parse(String(init?.body)) as unknown[][];
    assert.ok(Array.isArray(body[0]), "body pipeline phải là mảng các lệnh");
    const cmd = body[0];
    assert.equal(cmd[0], "eval", `lệnh không mong muốn: ${cmd[0]}`);
    evalCallCount += 1;

    // ["eval", script, numkeys, ...keys, ...args]
    const script = String(cmd[1]);
    assert.ok(script.includes("INCR"), "script Lua phải dùng INCR");
    assert.ok(script.includes("PEXPIRE"), "script Lua phải đặt TTL");
    const key = String(cmd[3]);
    const windowMs = Number(cmd[4]);

    const nowMs = Date.now();
    let bucket = store.get(key);
    if (!bucket || bucket.expireAt <= nowMs) {
      bucket = { count: 0, expireAt: nowMs + windowMs };
    }
    bucket.count += 1;
    store.set(key, bucket);
    const pttl = Math.max(0, bucket.expireAt - nowMs);

    // Upstash trả số dạng chuỗi trong bảng Lua, bọc trong chuỗi JSON; endpoint
    // /pipeline trả về MẢNG kết quả [{result, error}] — đúng giao thức thật.
    return new Response(
      JSON.stringify([
        { result: JSON.stringify([String(bucket.count), String(pttl)]), error: null },
      ]),
      { status: 200 }
    );
  };
  globalThis.fetch = mockFetch as unknown as typeof fetch;

  try {
    process.env.UPSTASH_REDIS_REST_URL = `${MOCK_URL}`;
    process.env.UPSTASH_REDIS_REST_TOKEN = "mock-token";

    const key = `test-redis:${Date.now()}:${Math.random()}`;
    const first = await consumeRateLimit(key, 2, 60_000);
    const second = await consumeRateLimit(key, 2, 60_000);
    const third = await consumeRateLimit(key, 2, 60_000);

    assert.ok(first.allowed && second.allowed, "redis: hai request đầu phải được phép");
    assert.ok(!third.allowed, "redis: request thứ ba phải bị chặn");
    assert.ok(third.retryAfterSeconds >= 1 && third.retryAfterSeconds <= 60);
    assert.equal(evalCallCount, 3, "mỗi lần consume phải đúng 1 roundtrip EVAL");

    // Bucket hết hạn → cửa sổ mới reset
    const bucket = store.get(key)!;
    bucket.expireAt = Date.now() - 1;
    const fourth = await consumeRateLimit(key, 2, 60_000);
    assert.ok(fourth.allowed, "redis: cửa sổ mới phải reset bộ đếm");

    console.log("upstash redis backend checks passed");
  } finally {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    globalThis.fetch = realFetch;
  }
}

async function main() {
  await testPostgresBackend();
  await testUpstashRedisBackend();
  console.log("rate limit checks passed");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
