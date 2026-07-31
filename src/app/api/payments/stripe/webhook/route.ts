import { createHash } from "node:crypto";
import type Stripe from "stripe";
import { NextResponse } from "next/server";
import {
  failStripeCheckoutSession,
  fulfillStripeCheckoutSession,
  reconcileStripeRefundEvent,
} from "@/lib/payment-fulfillment";
import { verifyStripeWebhook } from "@/lib/stripe-payment";
import { prisma } from "@/lib/prisma";
import { expirePendingBookingsBatch } from "@/lib/booking-expire";
import { sendBookingConfirmationEmail } from "@/lib/email";

export const runtime = "nodejs";

async function sendConfirmation(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      seats: { include: { seat: true } },
      showtime: { include: { movie: true, cinema: true, room: true } },
    },
  });
  if (!booking || booking.emailSentAt) return;
  const mail = await sendBookingConfirmationEmail({
    code: booking.code,
    contactName: booking.contactName,
    contactEmail: booking.contactEmail,
    movieTitle: booking.showtime.movie.title,
    cinemaName: booking.showtime.cinema.name,
    roomName: booking.showtime.room.name,
    startsAt: booking.showtime.startsAt,
    seats: booking.seats.map((item) => `${item.seat.row}${item.seat.number}`),
    finalTotal: booking.finalTotal,
    status: "CONFIRMED",
  });
  if (mail.sent) {
    await prisma.booking.updateMany({
      where: { id: booking.id, emailSentAt: null },
      data: { emailSentAt: new Date() },
    });
  }
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook is not configured" }, { status: 503 });
  }
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  const payload = await request.text();
  let event: Stripe.Event;
  try {
    event = verifyStripeWebhook(payload, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid Stripe signature" }, { status: 400 });
  }
  const payloadHash = createHash("sha256").update(payload).digest("hex");

  try {
    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded"
    ) {
      const result = await fulfillStripeCheckoutSession({
        eventId: event.id,
        payloadHash,
        session: event.data.object as Stripe.Checkout.Session,
      });
      if (result.confirmed && !result.duplicate) {
        await sendConfirmation(result.bookingId);
      }
    } else if (
      event.type === "checkout.session.async_payment_failed" ||
      event.type === "checkout.session.expired"
    ) {
      const result = await failStripeCheckoutSession({
        eventId: event.id,
        payloadHash,
        eventType: event.type,
        session: event.data.object as Stripe.Checkout.Session,
      });
      if (event.type === "checkout.session.expired" && !result.duplicate) {
        await prisma.booking.updateMany({
          where: { id: result.bookingId, status: "PENDING" },
          data: { expiresAt: new Date() },
        });
        const { invalidatedShowtimes } = await expirePendingBookingsBatch();
        for (const sid of invalidatedShowtimes) {
          // Invalidate cache for affected showtimes
          const { invalidateLockedSeatCache } = await import("@/lib/booking-expire");
          invalidateLockedSeatCache(sid);
        }
      }
    } else if (event.type === "refund.updated") {
      const refund = event.data.object as Stripe.Refund;
      await reconcileStripeRefundEvent({
        eventId: event.id,
        payloadHash,
        eventType: event.type,
        refundId: refund.id,
        paymentIntentId: typeof refund.payment_intent === "string" ? refund.payment_intent : refund.payment_intent?.id,
        paymentId: refund.metadata?.paymentId,
        status: refund.status === "succeeded" ? "succeeded" : refund.status === "failed" ? "failed" : "pending",
      });
    } else if (event.type === "charge.refunded") {
      const charge = event.data.object as Stripe.Charge;
      await reconcileStripeRefundEvent({
        eventId: event.id,
        payloadHash,
        eventType: event.type,
        refundId: charge.refunds?.data[0]?.id ?? `charge:${charge.id}`,
        paymentIntentId: typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id,
        status: "succeeded",
      });
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook processing failed:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
