import assert from "node:assert/strict";
import Stripe from "stripe";
import { PrismaClient } from "@prisma/client";
import {
  failStripeCheckoutSession,
  fulfillStripeCheckoutSession,
  reconcileStripeRefundEvent,
} from "../src/lib/payment-fulfillment";

const prisma = new PrismaClient();
const suffix = Date.now().toString(36);
const eventIds = [
  `evt_${suffix}_paid`,
  `evt_${suffix}_mismatch`,
  `evt_${suffix}_failed`,
  `evt_${suffix}_refund`,
];
const bookingIds: string[] = [];

async function createPendingBooking(seatOffset: number) {
  const showtime = await prisma.showtime.findFirstOrThrow({
    where: { startsAt: { gt: new Date() }, status: "SCHEDULED" },
    include: {
      room: {
        include: {
          seats: {
            where: { isActive: true },
            orderBy: [{ row: "asc" }, { number: "asc" }],
          },
        },
      },
    },
    orderBy: { startsAt: "asc" },
  });
  const locked = await prisma.showtimeSeatLock.findMany({
    where: { showtimeId: showtime.id },
    select: { seatId: true },
  });
  const lockedIds = new Set(locked.map((lock) => lock.seatId));
  const seat = showtime.room.seats.filter((candidate) => !lockedIds.has(candidate.id))[
    seatOffset
  ];
  assert.ok(seat, "test requires an available seat");
  const ticket = await prisma.ticketType.findFirstOrThrow({
    where: { code: "ADULT" },
  });
  const amount = 80000;
  const booking = await prisma.booking.create({
    data: {
      code: `CS-PAY${suffix.toUpperCase()}${seatOffset}`,
      showtimeId: showtime.id,
      contactName: "Stripe Test",
      contactEmail: `stripe-${suffix}@example.com`,
      contactPhone: "0912345678",
      seatsTotal: amount,
      combosTotal: 0,
      discountTotal: 0,
      finalTotal: amount,
      expiresAt: new Date(Date.now() + 30 * 60_000),
      seats: {
        create: { seatId: seat.id, ticketTypeId: ticket.id, price: amount },
      },
      payment: {
        create: {
          method: "STRIPE",
          provider: "STRIPE",
          status: "PROCESSING",
          amount,
        },
      },
    },
  });
  bookingIds.push(booking.id);
  await prisma.showtimeSeatLock.create({
    data: {
      showtimeId: showtime.id,
      seatId: seat.id,
      bookingId: booking.id,
    },
  });
  return booking;
}

function sessionFor(
  bookingId: string,
  amount: number,
  id: string
): Stripe.Checkout.Session {
  return {
    id,
    object: "checkout.session",
    amount_total: amount,
    currency: "vnd",
    payment_status: "paid",
    payment_intent: `pi_${id}`,
    metadata: { bookingId },
  } as unknown as Stripe.Checkout.Session;
}

async function main() {
  const paidBooking = await createPendingBooking(0);
  const first = await fulfillStripeCheckoutSession({
    eventId: eventIds[0],
    payloadHash: `hash_${suffix}_paid`,
    session: sessionFor(paidBooking.id, paidBooking.finalTotal, `cs_${suffix}_paid`),
  });
  assert.deepEqual(first, {
    duplicate: false,
    confirmed: true,
    bookingId: paidBooking.id,
  });

  const duplicate = await fulfillStripeCheckoutSession({
    eventId: eventIds[0],
    payloadHash: `hash_${suffix}_paid`,
    session: sessionFor(paidBooking.id, paidBooking.finalTotal, `cs_${suffix}_paid`),
  });
  assert.equal(duplicate.duplicate, true);

  const paidState = await prisma.booking.findUniqueOrThrow({
    where: { id: paidBooking.id },
    include: { payment: true, seatLocks: true },
  });
  assert.equal(paidState.status, "CONFIRMED");
  assert.equal(paidState.payment?.status, "PAID");
  assert.equal(paidState.seatLocks.length, 1);
  await prisma.payment.update({
    where: { id: paidState.payment!.id },
    data: { providerPaymentId: `pi_${suffix}_paid` },
  });
  const refund = await reconcileStripeRefundEvent({
    eventId: eventIds[3],
    payloadHash: `hash_${suffix}_refund`,
    eventType: "refund.updated",
    refundId: `re_${suffix}`,
    paymentIntentId: `pi_${suffix}_paid`,
    status: "succeeded",
  });
  assert.equal(refund.updated, true);
  const refundedState = await prisma.booking.findUniqueOrThrow({
    where: { id: paidBooking.id },
    include: { payment: true },
  });
  assert.equal(refundedState.status, "CANCELLED");
  assert.equal(refundedState.payment?.status, "REFUNDED");

  const mismatchBooking = await createPendingBooking(1);
  await assert.rejects(
    fulfillStripeCheckoutSession({
      eventId: eventIds[1],
      payloadHash: `hash_${suffix}_mismatch`,
      session: sessionFor(
        mismatchBooking.id,
        mismatchBooking.finalTotal - 1000,
        `cs_${suffix}_mismatch`
      ),
    }),
    /amount mismatch/
  );
  const mismatchState = await prisma.booking.findUniqueOrThrow({
    where: { id: mismatchBooking.id },
    include: { payment: true },
  });
  assert.equal(mismatchState.status, "PENDING");
  assert.notEqual(mismatchState.payment?.status, "PAID");

  const failedBooking = await createPendingBooking(2);
  const failure = await failStripeCheckoutSession({
    eventId: eventIds[2],
    payloadHash: `hash_${suffix}_failed`,
    eventType: "checkout.session.async_payment_failed",
    session: sessionFor(
      failedBooking.id,
      failedBooking.finalTotal,
      `cs_${suffix}_failed`
    ),
  });
  assert.equal(failure.failed, true);
  const failedState = await prisma.booking.findUniqueOrThrow({
    where: { id: failedBooking.id },
    include: { payment: true, seatLocks: true },
  });
  assert.equal(failedState.status, "PENDING");
  assert.equal(failedState.payment?.status, "FAILED");
  assert.equal(failedState.seatLocks.length, 1);

  console.log("payment fulfillment checks passed");
}

main()
  .finally(async () => {
    await prisma.paymentEvent.deleteMany({ where: { eventId: { in: eventIds } } });
    await prisma.booking.deleteMany({ where: { id: { in: bookingIds } } });
    await prisma.$disconnect();
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
