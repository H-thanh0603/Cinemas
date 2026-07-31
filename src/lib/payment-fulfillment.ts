import type Stripe from "stripe";
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { validateStripeCheckoutSession } from "./stripe-payment";

type FulfillmentResult = {
  duplicate: boolean;
  confirmed: boolean;
  bookingId: string;
};

export async function reconcileStripeRefundEvent(input: {
  eventId: string;
  payloadHash: string;
  eventType: string;
  refundId: string;
  paymentIntentId?: string | null;
  paymentId?: string | null;
  status: "succeeded" | "pending" | "failed";
}): Promise<{ duplicate: boolean; updated: boolean }> {
  try {
    await prisma.paymentEvent.create({
      data: {
        provider: "STRIPE",
        eventId: input.eventId,
        type: input.eventType,
        payloadHash: input.payloadHash,
      },
    });
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
      throw error;
    }
    const existing = await prisma.paymentEvent.findUniqueOrThrow({
      where: { provider_eventId: { provider: "STRIPE", eventId: input.eventId } },
    });
    if (existing.payloadHash !== input.payloadHash) throw new Error("Stripe event replay payload mismatch");
    return { duplicate: true, updated: existing.status === "PROCESSED" };
  }

  const payment = await prisma.payment.findFirst({
    where: {
      OR: [
        input.paymentId ? { id: input.paymentId } : undefined,
        input.paymentIntentId ? { providerPaymentId: input.paymentIntentId } : undefined,
      ].filter(Boolean) as { id?: string; providerPaymentId?: string }[],
    },
    select: { id: true, bookingId: true },
  });
  if (!payment) {
    await prisma.paymentEvent.update({
      where: { provider_eventId: { provider: "STRIPE", eventId: input.eventId } },
      data: { status: "FAILED", error: "Payment not found" },
    });
    return { duplicate: false, updated: false };
  }

  const status = input.status === "succeeded"
    ? "REFUNDED"
    : input.status === "failed"
      ? "PAID"
      : "REFUND_PENDING";
  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status,
        refundId: input.refundId,
        refundedAt: status === "REFUNDED" ? new Date() : null,
        lastError: input.status === "failed" ? "Stripe refund failed" : null,
      },
    });
    if (status === "REFUNDED") {
      await tx.booking.updateMany({
        where: { id: payment.bookingId, status: { in: ["CONFIRMED", "CANCELLED"] } },
        data: { status: "CANCELLED", expiresAt: null },
      });
    }
    await tx.paymentEvent.update({
      where: { provider_eventId: { provider: "STRIPE", eventId: input.eventId } },
      data: { status: "PROCESSED", processedAt: new Date(), error: null },
    });
  });
  return { duplicate: false, updated: true };
}

export async function failStripeCheckoutSession(input: {
  eventId: string;
  payloadHash: string;
  eventType: string;
  session: Stripe.Checkout.Session;
}): Promise<{ duplicate: boolean; failed: boolean; bookingId: string }> {
  const bookingId = input.session.metadata?.bookingId;
  if (!bookingId) throw new Error("Stripe booking mismatch");

  try {
    await prisma.paymentEvent.create({
      data: {
        provider: "STRIPE",
        eventId: input.eventId,
        type: input.eventType,
        payloadHash: input.payloadHash,
      },
    });
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
      throw error;
    }
    const existing = await prisma.paymentEvent.findUniqueOrThrow({
      where: {
        provider_eventId: { provider: "STRIPE", eventId: input.eventId },
      },
    });
    if (existing.payloadHash !== input.payloadHash) {
      throw new Error("Stripe event replay payload mismatch");
    }
    return {
      duplicate: true,
      failed: existing.status === "PROCESSED",
      bookingId,
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.payment.updateMany({
      where: {
        bookingId,
        provider: "STRIPE",
        status: { in: ["UNPAID", "PROCESSING", "FAILED"] },
      },
      data: {
        status: "FAILED",
        providerCheckoutId: input.session.id,
        lastError: input.eventType,
      },
    });
    await tx.paymentEvent.update({
      where: {
        provider_eventId: { provider: "STRIPE", eventId: input.eventId },
      },
      data: { status: "PROCESSED", processedAt: new Date() },
    });
  });
  return { duplicate: false, failed: true, bookingId };
}

export async function fulfillStripeCheckoutSession(input: {
  eventId: string;
  payloadHash: string;
  session: Stripe.Checkout.Session;
}): Promise<FulfillmentResult> {
  const bookingId = input.session.metadata?.bookingId;
  if (!bookingId) throw new Error("Stripe booking mismatch");

  let duplicate = false;
  try {
    await prisma.paymentEvent.create({
      data: {
        provider: "STRIPE",
        eventId: input.eventId,
        type: "checkout.session.completed",
        payloadHash: input.payloadHash,
      },
    });
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
      throw error;
    }
    const existing = await prisma.paymentEvent.findUniqueOrThrow({
      where: {
        provider_eventId: { provider: "STRIPE", eventId: input.eventId },
      },
    });
    if (existing.payloadHash !== input.payloadHash) {
      throw new Error("Stripe event replay payload mismatch");
    }
    if (existing.status === "PROCESSED") {
      return { duplicate: true, confirmed: true, bookingId };
    }
    if (existing.status === "RECEIVED") {
      return { duplicate: true, confirmed: false, bookingId };
    }
    await prisma.paymentEvent.update({
      where: { id: existing.id },
      data: { status: "RECEIVED", error: null },
    });
    duplicate = true;
  }

  try {
    const confirmed = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUniqueOrThrow({
        where: { id: bookingId },
        include: {
          payment: true,
          seats: { select: { id: true } },
          seatLocks: { select: { seatId: true } },
        },
      });
      validateStripeCheckoutSession(input.session, {
        bookingId: booking.id,
        amount: booking.finalTotal,
      });

      if (booking.status === "CONFIRMED" && booking.payment?.status === "PAID") {
        await tx.paymentEvent.update({
          where: {
            provider_eventId: { provider: "STRIPE", eventId: input.eventId },
          },
          data: { status: "PROCESSED", processedAt: new Date(), error: null },
        });
        return true;
      }
      if (
        booking.status !== "PENDING" ||
        !booking.payment ||
        booking.payment.provider !== "STRIPE" ||
        !booking.expiresAt ||
        booking.expiresAt <= new Date()
      ) {
        throw new Error("Booking is no longer payable");
      }
      if (booking.seatLocks.length !== booking.seats.length) {
        throw new Error("Booking seat locks are incomplete");
      }

      const bookingClaim = await tx.booking.updateMany({
        where: {
          id: booking.id,
          status: "PENDING",
          expiresAt: { gt: new Date() },
        },
        data: { status: "CONFIRMED", expiresAt: null },
      });
      if (bookingClaim.count !== 1) throw new Error("Booking state changed");

      const { paymentIntentId, checkoutSessionId } =
        validateStripeCheckoutSession(input.session, {
          bookingId: booking.id,
          amount: booking.finalTotal,
        });
      const paymentClaim = await tx.payment.updateMany({
        where: {
          id: booking.payment.id,
          status: { in: ["UNPAID", "PROCESSING", "FAILED"] },
        },
        data: {
          status: "PAID",
          paidAt: new Date(),
          providerPaymentId: paymentIntentId,
          providerCheckoutId: checkoutSessionId,
          lastError: null,
        },
      });
      if (paymentClaim.count !== 1) throw new Error("Payment state changed");

      await tx.paymentEvent.update({
        where: {
          provider_eventId: { provider: "STRIPE", eventId: input.eventId },
        },
        data: { status: "PROCESSED", processedAt: new Date(), error: null },
      });
      return true;
    });

    return { duplicate, confirmed, bookingId };
  } catch (error) {
    await prisma.paymentEvent.update({
      where: {
        provider_eventId: { provider: "STRIPE", eventId: input.eventId },
      },
      data: {
        status: "FAILED",
        error: error instanceof Error ? error.message.slice(0, 500) : "Unknown error",
      },
    });
    throw error;
  }
}
