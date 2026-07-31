import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";
import {
  completeSandboxPayment,
  createBooking,
} from "../src/app/booking/actions";
import { expirePendingBookings } from "../src/lib/booking-expire";

process.env.ENABLE_PAYMENT_SANDBOX = "true";

const prisma = new PrismaClient();
const suffix = Date.now().toString(36).toUpperCase();
let showtimeId: string | null = null;
let promotionId: string | null = null;

async function main() {
  const room = await prisma.room.findFirstOrThrow({
    where: { isActive: true },
    include: { seats: { where: { isActive: true }, take: 5 } },
  });
  assert.ok(room.seats.length >= 4, "test room needs four active seats");

  const movie = await prisma.movie.findFirstOrThrow();
  const ticket = await prisma.ticketType.findFirstOrThrow({
    where: { code: "ADULT", isActive: true },
  });
  const startsAt = new Date(Date.now() + 30 * 24 * 60 * 60_000);
  const showtime = await prisma.showtime.create({
    data: {
      movieId: movie.id,
      cinemaId: room.cinemaId,
      roomId: room.id,
      startsAt,
      endsAt: new Date(startsAt.getTime() + 2 * 60 * 60_000),
      basePrice: 80_000,
      format: "2D",
    },
  });
  showtimeId = showtime.id;

  const contact = {
    name: "Security Test",
    email: `security-${suffix.toLowerCase()}@example.com`,
    phone: "0912345678",
  };
  const book = (seatId: string, promotionCode?: string) =>
    createBooking({
      showtimeId: showtime.id,
      seats: [{ seatId, ticketTypeId: ticket.id }],
      combos: [],
      promotionCode,
      contact,
      paymentMethod: "SANDBOX",
    });

  const first = await book(room.seats[0].id);
  assert.ok(first.ok, "initial booking should be created");
  const paymentResults = await Promise.all([
    completeSandboxPayment({ code: first.data.code }),
    completeSandboxPayment({ code: first.data.code }),
  ]);
  assert.ok(paymentResults.every((result) => result.ok), "duplicate payment must be idempotent");
  const paid = await prisma.booking.findUniqueOrThrow({
    where: { code: first.data.code },
    include: { payment: true, seatLocks: true },
  });
  assert.equal(paid.status, "CONFIRMED");
  assert.equal(paid.payment?.status, "PAID");
  assert.equal(paid.seatLocks.length, 1, "confirmed booking must retain its seat lock");

  const expired = await book(room.seats[1].id);
  assert.ok(expired.ok, "expiring booking should be created");
  await prisma.booking.update({
    where: { code: expired.data.code },
    data: { expiresAt: new Date(Date.now() - 1_000) },
  });
  const expiredPayment = await completeSandboxPayment({ code: expired.data.code });
  assert.equal(expiredPayment.ok, false, "expired booking must not be paid");
  await expirePendingBookings();
  const expiredState = await prisma.booking.findUniqueOrThrow({
    where: { code: expired.data.code },
    include: { payment: true, seatLocks: true },
  });
  assert.equal(expiredState.status, "EXPIRED");
  assert.equal(expiredState.payment?.status, "FAILED");
  assert.equal(expiredState.seatLocks.length, 0, "expired booking must release its lock");

  const promotion = await prisma.promotion.create({
    data: {
      code: `AUDIT${suffix}`,
      description: "Security regression test",
      discountType: "FIXED",
      discountValue: 1_000,
      minOrderValue: 0,
      usageLimit: 1,
      startsAt: new Date(Date.now() - 60_000),
      expiresAt: new Date(Date.now() + 60 * 60_000),
    },
  });
  promotionId = promotion.id;
  const promoResults = await Promise.all([
    book(room.seats[2].id, promotion.code),
    book(room.seats[3].id, promotion.code),
  ]);
  assert.equal(
    promoResults.filter((result) => result.ok).length,
    1,
    "one-use promotion must have exactly one winner"
  );
  const promotionState = await prisma.promotion.findUniqueOrThrow({
    where: { id: promotion.id },
  });
  assert.equal(promotionState.usedCount, 1);

  console.log("security regression checks passed");
}

main()
  .finally(async () => {
    if (showtimeId) {
      await prisma.booking.deleteMany({ where: { showtimeId } });
    }
    if (promotionId) {
      await prisma.promotion.deleteMany({ where: { id: promotionId } });
    }
    if (showtimeId) {
      await prisma.showtime.deleteMany({ where: { id: showtimeId } });
    }
    await prisma.$disconnect();
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
