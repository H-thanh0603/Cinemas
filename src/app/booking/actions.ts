"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { generateBookingCode } from "@/lib/booking";
import { expirePendingBookings } from "@/lib/booking-expire";
import { sendBookingConfirmationEmail } from "@/lib/email";
import { expirePendingBookingsBatch } from "@/lib/booking-expire";
import {
  EMAIL_RE,
  buildComboPricing,
  buildSeatPricing,
  computeDiscount,
  validateComboInputs,
  validateContact,
  validateSeatSelection,
} from "@/lib/booking-pricing";
import { MAX_SEATS_PER_BOOKING, SEAT_HOLD_MINUTES } from "@/lib/constants";
import { auth } from "@/auth";
import { consumeRateLimit, rateLimitKey } from "@/lib/rate-limit";

export type CreateBookingInput = {
  showtimeId: string;
  seats: { seatId: string; ticketTypeId: string }[];
  combos: { comboId: string; quantity: number }[];
  promotionCode?: string;
  contact: { name: string; email: string; phone: string };
  paymentMethod: string;
};

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const PAYMENT_METHODS = [
  "STRIPE",
  "AT_COUNTER",
  "SANDBOX",
];

export async function validatePromotion(
  code: string,
  orderValue: number
): Promise<ActionResult<{ discount: number; description: string }>> {
  const promo = await prisma.promotion.findUnique({
    where: { code: code.trim().toUpperCase() },
  });

  if (!promo || !promo.isActive) {
    return { ok: false, error: "Mã ưu đãi không tồn tại" };
  }
  const now = new Date();
  if (promo.startsAt > now) {
    return { ok: false, error: "Mã ưu đãi chưa có hiệu lực" };
  }
  if (promo.expiresAt < now) {
    return { ok: false, error: "Mã ưu đãi đã hết hạn" };
  }
  if (promo.usageLimit !== null && promo.usedCount >= promo.usageLimit) {
    return { ok: false, error: "Mã ưu đãi đã hết lượt sử dụng" };
  }
  if (orderValue < promo.minOrderValue) {
    return {
      ok: false,
      error: `Đơn hàng tối thiểu ${new Intl.NumberFormat("vi-VN").format(promo.minOrderValue)}đ để dùng mã này`,
    };
  }

  const discount = computeDiscount(
    promo.discountType,
    promo.discountValue,
    promo.maxDiscount,
    orderValue
  );
  return { ok: true, data: { discount, description: promo.description } };
}

export async function createBooking(
  input: CreateBookingInput
): Promise<
  ActionResult<{
    code: string;
    status: string;
    expiresAt: string | null;
    needsPayment: boolean;
  }>
> {
  await expirePendingBookings();

  const contactError = validateContact({
    name: input.contact.name ?? "",
    email: input.contact.email ?? "",
    phone: input.contact.phone ?? "",
  });
  if (contactError) {
    return { ok: false, error: contactError };
  }
  const email = input.contact.email?.trim().toLowerCase() ?? "";
  const bookingLimit = await consumeRateLimit(
    rateLimitKey("booking", email),
    30,
    60_000
  );
  if (!bookingLimit.allowed) {
    return { ok: false, error: "Bạn thao tác quá nhanh. Vui lòng thử lại sau." };
  }
  if (!PAYMENT_METHODS.includes(input.paymentMethod)) {
    return { ok: false, error: "Phương thức thanh toán không hợp lệ" };
  }
  if (
    input.paymentMethod === "SANDBOX" &&
    (process.env.NODE_ENV === "production" ||
      process.env.ENABLE_PAYMENT_SANDBOX !== "true")
  ) {
    return { ok: false, error: "Sandbox payment is disabled" };
  }

  const seatIds = input.seats.map((s) => s.seatId);
  const seatError = validateSeatSelection(seatIds, MAX_SEATS_PER_BOOKING);
  if (seatError) {
    return { ok: false, error: seatError };
  }

  const showtime = await prisma.showtime.findUnique({
    where: { id: input.showtimeId },
    include: { movie: true, cinema: true, room: true },
  });
  if (!showtime || showtime.status !== "SCHEDULED") {
    return { ok: false, error: "Suất chiếu không tồn tại hoặc đã bị hủy" };
  }
  if (showtime.startsAt <= new Date()) {
    return { ok: false, error: "Suất chiếu đã bắt đầu, không thể đặt vé" };
  }

  const seats = await prisma.seat.findMany({
    where: { id: { in: seatIds }, roomId: showtime.roomId },
  });
  if (seats.length !== seatIds.length) {
    return { ok: false, error: "Có ghế không hợp lệ cho phòng chiếu này" };
  }
  if (seats.some((s) => !s.isActive)) {
    return { ok: false, error: "Có ghế đang không khả dụng" };
  }

  const ticketTypeIds = [...new Set(input.seats.map((s) => s.ticketTypeId))];
  const ticketTypes = await prisma.ticketType.findMany({
    where: { id: { in: ticketTypeIds }, isActive: true },
  });
  if (ticketTypes.length !== ticketTypeIds.length) {
    return { ok: false, error: "Loại vé không hợp lệ" };
  }
  const ticketTypeById = new Map(ticketTypes.map((t) => [t.id, t]));
  const seatById = new Map(seats.map((s) => [s.id, s]));

  const comboInputs = (input.combos ?? []).filter((c) => c.quantity > 0);
  const comboError = validateComboInputs(comboInputs);
  if (comboError) {
    return { ok: false, error: comboError };
  }
  const comboIds = comboInputs.map((c) => c.comboId);
  const combosDb = await prisma.foodCombo.findMany({
    where: { id: { in: comboIds }, isActive: true },
  });
  if (combosDb.length !== comboIds.length) {
    return { ok: false, error: "Có combo không hợp lệ" };
  }
  const comboById = new Map(combosDb.map((c) => [c.id, c]));

  const { seatLines, seatsTotal } = buildSeatPricing({
    basePrice: showtime.basePrice,
    seats: input.seats.map((s) => ({
      seatId: s.seatId,
      ticketTypeId: s.ticketTypeId,
      seatType: seatById.get(s.seatId)!.type,
    })),
    ticketTypeById,
  });

  const { comboLines, combosTotal } = buildComboPricing({
    comboInputs,
    comboById,
  });

  const orderValue = seatsTotal + combosTotal;

  let promotionId: string | null = null;
  let discountTotal = 0;
  if (input.promotionCode?.trim()) {
    const promo = await prisma.promotion.findUnique({
      where: { code: input.promotionCode.trim().toUpperCase() },
    });
    const now = new Date();
    if (
      !promo ||
      !promo.isActive ||
      promo.startsAt > now ||
      promo.expiresAt < now ||
      (promo.usageLimit !== null && promo.usedCount >= promo.usageLimit) ||
      orderValue < promo.minOrderValue
    ) {
      return {
        ok: false,
        error:
          "Mã ưu đãi không hợp lệ hoặc đã hết hạn. Vui lòng kiểm tra lại.",
      };
    }
    promotionId = promo.id;
    discountTotal = computeDiscount(
      promo.discountType,
      promo.discountValue,
      promo.maxDiscount,
      orderValue
    );
  }

  const finalTotal = orderValue - discountTotal;
  let userId: string | null = null;
  try {
    const session = await auth();
    userId = session?.user?.id ?? null;
  } catch {
    // Outside request scope (scripts/tests) — guest booking
    userId = null;
  }

  // Always hold seats first (PENDING + lock + expiresAt).
  // Online → user completes sandbox payment; AT_COUNTER stays PENDING.
  const expiresAt = new Date(Date.now() + SEAT_HOLD_MINUTES * 60_000);
  const needsOnlinePay = input.paymentMethod !== "AT_COUNTER";

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Pre-check locks for friendly seat names
      const conflicts = await tx.showtimeSeatLock.findMany({
        where: {
          showtimeId: showtime.id,
          seatId: { in: seatIds },
        },
        include: { seat: true },
      });
      if (conflicts.length > 0) {
        const names = conflicts
          .map((c) => `${c.seat.row}${c.seat.number}`)
          .join(", ");
        throw new Error(`SEAT_TAKEN:${names}`);
      }

      if (promotionId) {
        const promotionNow = new Date();
        const claimed = await tx.$queryRaw<{ id: string }[]>(Prisma.sql`
          UPDATE "Promotion"
          SET "usedCount" = "usedCount" + 1
          WHERE "id" = ${promotionId}
            AND "isActive" = true
            AND "startsAt" <= ${promotionNow}
            AND "expiresAt" >= ${promotionNow}
            AND ("usageLimit" IS NULL OR "usedCount" < "usageLimit")
          RETURNING "id"
        `);
        if (claimed.length === 0) {
          throw new Error("PROMO_TAKEN");
        }
      }

      let code = generateBookingCode();
      for (let i = 0; i < 10; i++) {
        const exists = await tx.booking.findUnique({ where: { code } });
        if (!exists) break;
        code = generateBookingCode();
      }
      // After 10 retries, if still colliding, throw — extremely unlikely
      // with 32^12 possible codes but handle gracefully.
      const codeCheck = await tx.booking.findUnique({ where: { code } });
      if (codeCheck) throw new Error("BOOKING_CODE_EXHAUSTED");

      const booking = await tx.booking.create({
        data: {
          code,
          showtimeId: showtime.id,
          userId,
          contactName: input.contact.name?.trim() ?? "",
          contactEmail: email,
          contactPhone: input.contact.phone?.trim() ?? "",
          status: "PENDING",
          seatsTotal,
          combosTotal,
          discountTotal,
          finalTotal,
          promotionId,
          expiresAt,
          seats: { create: seatLines },
          combos: { create: comboLines },
          payment: {
            create: {
              method: input.paymentMethod,
              provider:
                input.paymentMethod === "STRIPE"
                  ? "STRIPE"
                  : input.paymentMethod === "AT_COUNTER"
                    ? "COUNTER"
                    : "SANDBOX",
              status: "UNPAID",
              amount: finalTotal,
              paidAt: null,
            },
          },
        },
        include: {
          seats: { include: { seat: true } },
        },
      });

      // DB unique (showtimeId, seatId) — concurrent inserts fail hard
      try {
        await tx.showtimeSeatLock.createMany({
          data: seatIds.map((seatId) => ({
            showtimeId: showtime.id,
            seatId,
            bookingId: booking.id,
          })),
        });
      } catch {
        throw new Error("SEAT_TAKEN:ghế vừa bị người khác giữ");
      }

      return booking;
    });

    return {
      ok: true,
      data: {
        code: result.code,
        status: result.status,
        expiresAt: result.expiresAt?.toISOString() ?? null,
        needsPayment: needsOnlinePay,
      },
    };
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("SEAT_TAKEN:")) {
      const names = e.message.slice("SEAT_TAKEN:".length);
      return {
        ok: false,
        error: `Ghế ${names} vừa được người khác đặt. Vui lòng chọn ghế khác.`,
      };
    }
    if (e instanceof Error && e.message === "PROMO_TAKEN") {
      return {
        ok: false,
        error: "Mã ưu đãi vừa hết lượt sử dụng. Vui lòng thử mã khác.",
      };
    }
    console.error("createBooking failed:", e);
    return {
      ok: false,
      error: "Không thể tạo đơn đặt vé. Vui lòng thử lại sau.",
    };
  }
}

export type CompletePaymentInput = {
  code: string;
  cardNumber?: string;
  outcome?: "success" | "fail";
};

/** Development-only sandbox payment for a PENDING booking. */
export async function completeSandboxPayment(
  input: CompletePaymentInput
): Promise<ActionResult<{ code: string; status: string }>> {
  if (
    process.env.NODE_ENV === "production" ||
    process.env.ENABLE_PAYMENT_SANDBOX !== "true"
  ) {
    return { ok: false, error: "Sandbox payment is disabled" };
  }
  await expirePendingBookingsBatch();

  const booking = await prisma.booking.findUnique({
    where: { code: input.code },
    include: {
      payment: true,
      seats: { include: { seat: true } },
      showtime: { include: { movie: true, cinema: true, room: true } },
    },
  });

  if (!booking) {
    return { ok: false, error: "Không tìm thấy đơn đặt vé" };
  }
  let session = null;
  try {
    session = await auth();
  } catch {
    // Outside request scope (scripts/tests) — guest booking
    session = null;
  }
  if (booking.userId && session?.user?.id !== booking.userId) {
    return { ok: false, error: "Bạn không có quyền thanh toán đơn này" };
  }
  if (booking.status === "EXPIRED") {
    return { ok: false, error: "Đơn đã hết hạn giữ ghế. Vui lòng đặt lại." };
  }
  if (booking.status === "CONFIRMED") {
    return { ok: true, data: { code: booking.code, status: "CONFIRMED" } };
  }
  if (booking.status !== "PENDING" || !booking.payment) {
    return { ok: false, error: "Đơn không thể thanh toán" };
  }
  if (
    booking.payment.method === "AT_COUNTER" ||
    booking.payment.provider !== "SANDBOX"
  ) {
    return {
      ok: false,
      error: "Đơn này không dùng sandbox payment",
    };
  }
  if (booking.expiresAt && booking.expiresAt < new Date()) {
    await expirePendingBookings();
    return { ok: false, error: "Hết thời gian giữ ghế" };
  }

  const { runSandboxPayment } = await import("@/lib/payment-sandbox");
  const pay = runSandboxPayment({
    method: "E_WALLET",
    cardNumber: input.cardNumber,
    outcome: input.outcome ?? "success",
  });

  if (!pay.ok) {
    await prisma.payment.updateMany({
      where: {
        id: booking.payment.id,
        bookingId: booking.id,
        status: "UNPAID",
      },
      data: { status: "FAILED" },
    });
    return { ok: false, error: pay.error };
  }

  const paidAt = new Date();
  const claimed = await prisma.$transaction(async (tx) => {
    const bookingClaim = await tx.booking.updateMany({
      where: {
        id: booking.id,
        status: "PENDING",
        expiresAt: { gt: paidAt },
      },
      data: { status: "CONFIRMED", expiresAt: null },
    });
    if (bookingClaim.count !== 1) return false;

    const paymentUpdate = await tx.payment.updateMany({
      where: {
        id: booking.payment!.id,
        bookingId: booking.id,
        status: "UNPAID",
      },
      data: { status: "PAID", paidAt, sandboxTxnId: pay.txnId },
    });
    if (paymentUpdate.count !== 1) {
      throw new Error("PAYMENT_STATE_CHANGED");
    }
    return true;
  });

  if (!claimed) {
    const current = await prisma.booking.findUnique({
      where: { id: booking.id },
      select: { status: true },
    });
    if (current?.status === "CONFIRMED") {
      return { ok: true, data: { code: booking.code, status: "CONFIRMED" } };
    }
    return { ok: false, error: "Đơn đã hết hạn hoặc đã được xử lý" };
  }

  void (async () => {
    const mail = await sendBookingConfirmationEmail({
      code: booking.code,
      contactName: booking.contactName,
      contactEmail: booking.contactEmail,
      movieTitle: booking.showtime.movie.title,
      cinemaName: booking.showtime.cinema.name,
      roomName: booking.showtime.room.name,
      startsAt: booking.showtime.startsAt,
      seats: booking.seats.map((s) => `${s.seat.row}${s.seat.number}`),
      finalTotal: booking.finalTotal,
      status: "CONFIRMED",
    });
    if (mail.sent) {
      await prisma.booking.update({
        where: { id: booking.id },
        data: { emailSentAt: new Date() },
      });
    }
  })();

  return { ok: true, data: { code: booking.code, status: "CONFIRMED" } };
}

export async function verifyGuestAccess(
  code: string,
  email: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const cleanEmail = email?.trim().toLowerCase();
  if (!cleanEmail || !EMAIL_RE.test(cleanEmail)) {
    return { ok: false, error: "Email không hợp lệ" };
  }
  const booking = await prisma.booking.findUnique({
    where: { code },
    select: { contactEmail: true, userId: true },
  });
  if (!booking) {
    return { ok: false, error: "Không tìm thấy đơn đặt vé" };
  }
  if (booking.userId !== null) {
    return { ok: false, error: "Đơn đặt vé đã đăng nhập, dùng tính năng tìm vé của tôi" };
  }
  if (booking.contactEmail !== cleanEmail) {
    return { ok: false, error: "Email không khớp với đơn đặt vé" };
  }
  return { ok: true };
}
