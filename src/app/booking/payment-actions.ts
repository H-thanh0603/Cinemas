"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  buildStripeCheckoutParams,
  getStripe,
  stripeCheckoutIdempotencyKey,
} from "@/lib/stripe-payment";
import type { ActionResult } from "./actions";
import { consumeRateLimit, rateLimitKey } from "@/lib/rate-limit";

function appUrl(): string {
  const value =
    process.env.APP_URL?.trim() ||
    process.env.AUTH_URL?.trim() ||
    "http://localhost:3000";
  const url = new URL(value);
  if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
    throw new Error("APP_URL must use HTTPS in production");
  }
  return url.origin;
}

export async function createStripeCheckout(
  code: string
): Promise<ActionResult<{ url: string }>> {
  const paymentLimit = await consumeRateLimit(
    rateLimitKey("payment", code.trim().toUpperCase()),
    5,
    60_000
  );
  if (!paymentLimit.allowed) {
    return { ok: false, error: "Bạn thao tác quá nhanh. Vui lòng thử lại sau." };
  }
  const booking = await prisma.booking.findUnique({
    where: { code },
    include: {
      payment: true,
      showtime: { include: { movie: true } },
    },
  });
  if (!booking || !booking.payment) {
    return { ok: false, error: "Không tìm thấy đơn đặt vé" };
  }

  let session = null;
  try {
    session = await auth();
  } catch {
    session = null;
  }
  if (booking.userId && booking.userId !== session?.user?.id) {
    return { ok: false, error: "Bạn không có quyền thanh toán đơn này" };
  }
  if (
    booking.status !== "PENDING" ||
    !booking.expiresAt ||
    booking.expiresAt <= new Date()
  ) {
    return { ok: false, error: "Đơn đã hết hạn hoặc không thể thanh toán" };
  }
  if (booking.payment.method === "AT_COUNTER") {
    return { ok: false, error: "Đơn này thanh toán tại quầy" };
  }

  try {
    const stripe = getStripe();
    if (booking.payment.providerCheckoutId) {
      const existing = await stripe.checkout.sessions.retrieve(
        booking.payment.providerCheckoutId
      );
      if (existing.status === "open" && existing.url) {
        return { ok: true, data: { url: existing.url } };
      }
    }

    const minimumExpiry = new Date(Date.now() + 30 * 60_000);
    const expiresAt =
      booking.expiresAt > minimumExpiry ? booking.expiresAt : minimumExpiry;
    const idempotencyKey = stripeCheckoutIdempotencyKey(booking.id);
    const checkout = await stripe.checkout.sessions.create(
      buildStripeCheckoutParams({
        appUrl: appUrl(),
        bookingId: booking.id,
        bookingCode: booking.code,
        customerEmail: booking.contactEmail,
        movieTitle: booking.showtime.movie.title,
        amount: booking.finalTotal,
        expiresAt,
      }),
      { idempotencyKey }
    );
    if (!checkout.url) throw new Error("Stripe did not return a checkout URL");

    const claimed = await prisma.$transaction(async (tx) => {
      const bookingUpdate = await tx.booking.updateMany({
        where: { id: booking.id, status: "PENDING" },
        data: { expiresAt },
      });
      if (bookingUpdate.count !== 1) return false;
      const paymentUpdate = await tx.payment.updateMany({
        where: {
          id: booking.payment!.id,
          status: { in: ["UNPAID", "FAILED", "PROCESSING"] },
        },
        data: {
          method: "STRIPE",
          provider: "STRIPE",
          status: "PROCESSING",
          providerCheckoutId: checkout.id,
          idempotencyKey,
          lastError: null,
        },
      });
      return paymentUpdate.count === 1;
    });
    if (!claimed) {
      await stripe.checkout.sessions.expire(checkout.id).catch(() => undefined);
      return { ok: false, error: "Trạng thái đơn đã thay đổi, vui lòng tải lại" };
    }
    return { ok: true, data: { url: checkout.url } };
  } catch (error) {
    console.error("createStripeCheckout failed:", error);
    return {
      ok: false,
      error: "Không thể khởi tạo cổng thanh toán. Vui lòng thử lại.",
    };
  }
}
