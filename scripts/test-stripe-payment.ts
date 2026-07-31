import assert from "node:assert/strict";
import Stripe from "stripe";
import {
  buildStripeCheckoutParams,
  stripeRefundIdempotencyKey,
  stripeCheckoutIdempotencyKey,
  validateStripeCheckoutSession,
  verifyStripeWebhook,
} from "../src/lib/stripe-payment";

const secret = "whsec_test_secret";
const payload = JSON.stringify({
  id: "evt_test_checkout",
  object: "event",
  api_version: "2025-08-27.basil",
  created: Math.floor(Date.now() / 1000),
  type: "checkout.session.completed",
  data: {
    object: {
      id: "cs_test_123",
      object: "checkout.session",
      amount_total: 180000,
      currency: "vnd",
      payment_status: "paid",
      payment_intent: "pi_test_123",
      metadata: {
        bookingId: "booking_123",
        bookingCode: "CS-TEST123456",
      },
    },
  },
});
const signature = Stripe.webhooks.generateTestHeaderString({
  payload,
  secret,
});
const event = verifyStripeWebhook(payload, signature, secret);
assert.equal(event.id, "evt_test_checkout");

const session = event.data.object as Stripe.Checkout.Session;
assert.deepEqual(
  validateStripeCheckoutSession(session, {
    bookingId: "booking_123",
    amount: 180000,
  }),
  { paymentIntentId: "pi_test_123", checkoutSessionId: "cs_test_123" }
);
assert.throws(
  () =>
    validateStripeCheckoutSession(session, {
      bookingId: "booking_123",
      amount: 170000,
    }),
  /amount mismatch/
);
assert.equal(
  stripeCheckoutIdempotencyKey("booking_123"),
  stripeCheckoutIdempotencyKey("booking_123")
);
assert.equal(
  stripeRefundIdempotencyKey("payment_123"),
  "refund:payment_123:v1"
);
const params = buildStripeCheckoutParams({
  appUrl: "https://cinema.example",
  bookingId: "booking_123",
  bookingCode: "CS-TEST123456",
  customerEmail: "customer@example.com",
  movieTitle: "Test Movie",
  amount: 180000,
  expiresAt: new Date("2035-01-01T10:30:00.000Z"),
});
assert.equal(params.mode, "payment");
assert.equal(params.line_items?.[0]?.price_data?.currency, "vnd");
assert.equal(params.line_items?.[0]?.price_data?.unit_amount, 180000);
assert.equal(params.metadata?.bookingId, "booking_123");
assert.equal(params.expires_at, 2051260200);

console.log("stripe payment checks passed");
