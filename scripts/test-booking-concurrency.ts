import assert from "node:assert/strict";
import { prisma } from "../src/lib/prisma";
import { createBooking } from "../src/app/booking/actions";

process.env.ENABLE_PAYMENT_SANDBOX = "true";

async function main() {
  const showtime = await prisma.showtime.findFirstOrThrow({
    where: { status: "SCHEDULED", startsAt: { gt: new Date(Date.now() + 60 * 60_000) } },
    include: { room: { include: { seats: { where: { isActive: true }, take: 1 } } } },
    orderBy: { startsAt: "asc" },
  });
  const seat = showtime.room.seats[0];
  assert.ok(seat);
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
