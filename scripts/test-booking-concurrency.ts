import assert from "node:assert/strict";
import { prisma } from "../src/lib/prisma";
import { createBooking } from "../src/app/booking/actions";
import { getLockedSeatIds } from "../src/lib/booking-expire";

process.env.ENABLE_PAYMENT_SANDBOX = "true";

/**
 * Race-condition: 2 createBooking đồng thời giành CÙNG 1 ghế → đúng 1 thắng.
 *
 * Fix flaky (2026-09-12): trước đây test lấy `seats take: 1` (ghế đầu
 * tiên A1) mà KHÔNG kiểm tra ghế có bị chiếm — seed data CI rơi ghế A1
 * của suất sớm nhất cho booking CONFIRMED → cả 2 race booking đều fail
 * "ghế đã đặt" → assert 0 !== 1 đỏ. Giờ chọn ghế thật sự trống (không
 * nằm trong ShowtimeSeatLock của suất đó).
 */
async function main() {
  const showtime = await prisma.showtime.findFirstOrThrow({
    where: { status: "SCHEDULED", startsAt: { gt: new Date(Date.now() + 60 * 60_000) } },
    include: { room: { include: { seats: { where: { isActive: true } } } } },
    orderBy: { startsAt: "asc" },
  });

  const lockedIds = new Set(await getLockedSeatIds(showtime.id));
  const seat = showtime.room.seats.find((s) => !lockedIds.has(s.id));
  assert.ok(seat, "Suất chiếu sớm nhất không còn ghế trống — dữ liệu seed cần thêm ghế");

  const ticket = await prisma.ticketType.findFirstOrThrow({ where: { code: "ADULT" } });
  const emails = [`race-${Date.now()}-a@example.com`, `race-${Date.now()}-b@example.com`];

  const results = await Promise.all(
    emails.map((email) =>
      createBooking({
        showtimeId: showtime.id,
        seats: [{ seatId: seat.id, ticketTypeId: ticket.id }],
        combos: [],
        contact: { name: "Race Test", email, phone: "0912345678" },
        paymentMethod: "SANDBOX",
      })
    )
  );
  for (const r of results) {
    if (!r.ok) console.log(`  race loser: ${r.error}`);
  }
  assert.equal(results.filter((result) => result.ok).length, 1);

  const codes = results.filter((result): result is Extract<typeof result, { ok: true }> => result.ok).map((result) => result.data.code);
  const bookings = await prisma.booking.findMany({ where: { code: { in: codes } }, select: { id: true } });
  await prisma.showtimeSeatLock.deleteMany({ where: { bookingId: { in: bookings.map((booking) => booking.id) } } });
  await prisma.booking.deleteMany({ where: { id: { in: bookings.map((booking) => booking.id) } } });
  console.log("booking concurrency checks passed");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
