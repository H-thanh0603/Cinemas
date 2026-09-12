/**
 * Timezone-safety regression test.
 *
 * Bug: Prisma lưu DateTime vào cột timestamp (naive) theo UTC wall-clock,
 * nhưng $queryRaw so sánh ${new Date()} (timestamptz) trực tiếp với cột naive.
 * Khi session timezone của Postgres ≠ UTC (vd local dev Asia/Ho_Chi_Minh +07),
 * naive-UTC bị đọc là +07 wall → lệch 7h → mọi booking PENDING "đã hết hạn
 * từ 7 tiếng trước" → bị expire sweep giết ngay sau khi tạo, locks bị xóa.
 *
 * Production Supabase session TZ = UTC nên chưa lộ; local dev +07 lộ đầy đủ.
 * Test này bắt bug ở CẢ HAI cấu hình timezone để fix phải đúng semantics,
 * không phải "đúng vì server đang để UTC".
 *
 * Chạy: DATABASE_URL=... npx tsx scripts/test-timezone-safety.ts
 * (Chạy 2 lần: với server TZ=UTC và TZ khác — hoặc trust logic below.)
 */

import { prisma } from "../src/lib/prisma";
import { expirePendingBookings } from "../src/lib/booking-expire";
import { consumeRateLimit } from "../src/lib/rate-limit";

let passed = 0;
let failed = 0;
function check(name: string, cond: boolean, detail = "") {
  if (cond) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

async function main() {
  // Xác nhận có thể tái hiện điều kiện lỗi: session TZ hiện tại
  const tzRows = (await prisma.$queryRawUnsafe(
    "SHOW timezone"
  )) as { TimeZone: string }[];
  const sessionTz = tzRows[0].TimeZone;
  console.log(`Session timezone: ${sessionTz}\n`);

  // ── 1. Booking PENDING vừa tạo KHÔNG được expire ─────────────────
  console.log("[1] Booking-expire sweep không giết booking chưa hết hạn");
  const showtime = await prisma.showtime.findFirst({
    where: { status: "SCHEDULED", startsAt: { gt: new Date(Date.now() + 86400_000) } },
    include: { room: true },
  });
  if (!showtime) throw new Error("Cần ít nhất 1 showtime tương lai trong DB");
  const freeSeat = await prisma.seat.findFirst({
    where: { roomId: showtime.roomId, isActive: true },
  });
  if (!freeSeat) throw new Error("Cần ít nhất 1 ghế active");

  const holdMinutes = 35;
  const expiresAt = new Date(Date.now() + holdMinutes * 60_000); // 35' trong tương lai
  const booking = await prisma.booking.create({
    data: {
      showtimeId: showtime.id,
      userId: null,
      code: `CS-TZTEST${Date.now().toString(36).toUpperCase().slice(-8)}`,
      status: "PENDING",
      contactName: "TZ Test",
      contactEmail: "tz-test@example.com",
      contactPhone: "0912345678",
      seatsTotal: 0,
      combosTotal: 0,
      discountTotal: 0,
      finalTotal: 0,
      expiresAt,
      idempotencyKey: `tz-test-${Date.now()}`,
      seatLocks: {
        create: [{ showtimeId: showtime.id, seatId: freeSeat.id }],
      },
    },
  });
  await prisma.payment.create({
    data: { bookingId: booking.id, method: "AT_COUNTER", provider: "COUNTER", amount: 0, status: "UNPAID" },
  });

  await expirePendingBookings(); // sweep — KHÔNG được đụng booking này

  const after = await prisma.booking.findUniqueOrThrow({
    where: { id: booking.id },
    include: { seatLocks: true },
  });
  check("booking vẫn PENDING", after.status === "PENDING", `status=${after.status}`);
  check("locks vẫn còn", after.seatLocks.length === 1, `locks=${after.seatLocks.length}`);

  // ── 2. Booking ĐÃ quá hạn thì PHẢI expire (sweep không hỏng ngược) ─
  console.log("\n[2] Sweep vẫn giết booking đã quá hạn thật");
  const expired1h = new Date(Date.now() - 3600_000); // 1h trước
  const stale = await prisma.booking.create({
    data: {
      showtimeId: showtime.id,
      code: `CS-TZSTALE${Date.now().toString(36).toUpperCase().slice(-8)}`,
      status: "PENDING",
      contactName: "TZ Stale",
      contactEmail: "tz-stale@example.com",
      contactPhone: "0912345678",
      seatsTotal: 0,
      combosTotal: 0,
      discountTotal: 0,
      finalTotal: 0,
      expiresAt: expired1h,
      idempotencyKey: `tz-stale-${Date.now()}`,
    },
  });
  await expirePendingBookings();
  const staleAfter = await prisma.booking.findUniqueOrThrow({ where: { id: stale.id } });
  check("stale → EXPIRED", staleAfter.status === "EXPIRED", `status=${staleAfter.status}`);

  // ── 3. Rate-limit window không reset sớm vì TZ ─────────────────────
  console.log("\n[3] Rate-limit: bucket trong cùng window KHÔNG reset");
  const rlKey = `tz-test:rl:${Date.now()}`;
  const first = await consumeRateLimit(rlKey, 5, 60_000);
  check("lần 1 allowed", first.allowed);
  const second = await consumeRateLimit(rlKey, 5, 60_000);
  check("lần 2 vẫn allowed", second.allowed);
  await consumeRateLimit(rlKey, 5, 60_000);
  const bucket = await prisma.rateLimitBucket.findUnique({ where: { key: rlKey } });
  check(
    "count=3 sau 3 lần cùng window (không reset về 1)",
    (bucket?.count ?? 0) === 3,
    `count=${bucket?.count}`
  );

  // ── 4. expiresAt trong DB phải là UTC wall (không lệch giờ) ────────
  console.log("\n[4] Prisma lưu naive-UTC đúng (validates test premise)");
  const stored = (await prisma.$queryRawUnsafe(
    `SELECT "expiresAt"::text FROM "Booking" WHERE "id" = '${booking.id}'`
  )) as { expiresAt: string }[];
  const storedMs = new Date(stored[0].expiresAt + "Z").getTime();
  const expectMs = expiresAt.getTime();
  check(
    "stored naive == UTC wall (±2s)",
    Math.abs(storedMs - expectMs) < 2000,
    `stored=${stored[0].expiresAt} expected=${new Date(expectMs).toISOString()}`
  );

  // Cleanup
  await prisma.showtimeSeatLock.deleteMany({ where: { bookingId: booking.id } });
  await prisma.payment.deleteMany({ where: { bookingId: { in: [booking.id, stale.id] } } });
  await prisma.booking.deleteMany({ where: { id: { in: [booking.id, stale.id] } } });
  await prisma.rateLimitBucket.deleteMany({ where: { key: rlKey } });

  console.log(`\nKết quả: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
