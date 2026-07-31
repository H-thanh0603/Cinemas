import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secretKey) throw new Error("STRIPE_SECRET_KEY is not configured");
  stripeClient ??= new Stripe(secretKey, { maxNetworkRetries: 2 });
  return stripeClient;
}

export function stripeCheckoutIdempotencyKey(bookingId: string): string {
  return `checkout:${bookingId}:v1`;
}

export function stripeRefundIdempotencyKey(paymentId: string): string {
  return `refund:${paymentId}:v1`;
}

export function buildStripeCheckoutParams(input: {
  appUrl: string;
  bookingId: string;
  bookingCode: string;
  customerEmail: string;
  movieTitle: string;
  amount: number;
  expiresAt: Date;
}): Stripe.Checkout.SessionCreateParams {
  const origin = new URL(input.appUrl).origin;
  const metadata = {
    bookingId: input.bookingId,
    bookingCode: input.bookingCode,
  };
  return {
    mode: "payment",
    customer_email: input.customerEmail,
    client_reference_id: input.bookingId,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "vnd",
          unit_amount: input.amount,
          product_data: {
            name: `Vé xem phim — ${input.movieTitle}`,
            description: `Mã đặt vé ${input.bookingCode}`,
          },
        },
      },
    ],
    metadata,
    payment_intent_data: { metadata },
    success_url: `${origin}/booking/confirmation/${encodeURIComponent(input.bookingCode)}?payment=processing`,
    cancel_url: `${origin}/booking/pay/${encodeURIComponent(input.bookingCode)}?payment=cancelled`,
    expires_at: Math.floor(input.expiresAt.getTime() / 1000),
  };
}

export function verifyStripeWebhook(
  payload: string,
  signature: string,
  webhookSecret: string
): Stripe.Event {
  return Stripe.webhooks.constructEvent(payload, signature, webhookSecret, 300);
}

export function validateStripeCheckoutSession(
  session: Stripe.Checkout.Session,
  expected: { bookingId: string; amount: number }
): { paymentIntentId: string; checkoutSessionId: string } {
  if (session.metadata?.bookingId !== expected.bookingId) {
    throw new Error("Stripe booking mismatch");
  }
  if (session.currency?.toLowerCase() !== "vnd") {
    throw new Error("Stripe currency mismatch");
  }
  if (session.amount_total !== expected.amount) {
    throw new Error("Stripe amount mismatch");
  }
  if (session.payment_status !== "paid") {
    throw new Error("Stripe checkout is not paid");
  }
  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;
  if (!paymentIntentId) throw new Error("Stripe PaymentIntent is missing");
  return { paymentIntentId, checkoutSessionId: session.id };
}
