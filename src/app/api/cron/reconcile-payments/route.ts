import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe-payment";
import { prisma } from "@/lib/prisma";
import {
  failStripeCheckoutSession,
  fulfillStripeCheckoutSession,
} from "@/lib/payment-fulfillment";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const authorization = request.headers.get("authorization");
  if (!secret || authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!process.env.STRIPE_SECRET_KEY?.trim()) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
  }

  const candidates = await prisma.payment.findMany({
    where: {
      provider: "STRIPE",
      status: "PROCESSING",
      providerCheckoutId: { not: null },
      updatedAt: { lt: new Date(Date.now() - 2 * 60_000) },
    },
    take: 50,
    orderBy: { updatedAt: "asc" },
  });
  let confirmed = 0;
  let failed = 0;
  for (const payment of candidates) {
    try {
      const session = await getStripe().checkout.sessions.retrieve(
        payment.providerCheckoutId!
      );
      const eventId = `reconcile_${session.id}_${session.status}_${session.payment_status}`;
      if (session.payment_status === "paid") {
        const result = await fulfillStripeCheckoutSession({
          eventId,
          payloadHash: `reconcile:${session.id}:${session.payment_status}`,
          session,
        });
        if (result.confirmed) confirmed++;
      } else if (session.status === "expired") {
        const result = await failStripeCheckoutSession({
          eventId,
          payloadHash: `reconcile:${session.id}:${session.status}`,
          eventType: "checkout.session.expired",
          session: session as Stripe.Checkout.Session,
        });
        if (result.failed) failed++;
      }
    } catch (error) {
      console.error("payment reconciliation failed:", payment.id, error);
    }
  }
  return NextResponse.json({
    scanned: candidates.length,
    confirmed,
    failed,
  });
}
