"use server";

import { prisma } from "@/lib/prisma";
import { generateBookingCode, seatBasePrice } from "@/lib/booking";
import { expirePendingBookings } from "@/lib/booking-expire";
import { sendBookingConfirmationEmail } from "@/lib/email";
import { MAX_SEATS_PER_BOOKING, SEAT_HOLD_MINUTES } from "@/lib/constants";
import { auth } from "@/auth";

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
  "CREDIT_CARD",
  "E_WALLET",
  "BANK_TRANSFER",
  "AT_COUNTER",
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^0\d{9,10}$/;

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

function computeDiscount(
  type: string,
  value: number,
  maxDiscount: number | null,
  orderValue: number
): number {
  let discount =
    type === "PERCENT" ? Math.floor((orderValue * value) / 100) : value;
  if (type === "PERCENT" && maxDiscount !== null) {
    discount = Math.min(discount, maxDiscount);
  }
  return Math.min(discount, orderValue);
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

  const name = input.contact.name?.trim();
  const email = input.contact.email?.trim().toLowerCase();
  const phone = input.contact.phone?.trim();

  if (!name || name.length < 2) {
    return { ok: false, error: "Vui lòng nhập họ tên hợp lệ" };
  }
  if (!email || !EMAIL_RE.test(email)) {
    return { ok: false, error: "Vui lòng nhập email hợp lệ" };
  }
  if (!phone || !PHONE_RE.test(phone)) {
    return {
      ok: false,
      error: "Vui lòng nhập số điện thoại hợp lệ (bắt đầu bằng 0, 10-11 số)",
    };
  }
  if (!PAYMENT_METHODS.includes(input.paymentMethod)) {
    return { ok: false, error: "Phương thức thanh toán không hợp lệ" };
  }

  if (!input.seats || input.seats.length === 0) {
    return { ok: false, error: "Vui lòng chọn ít nhất 1 ghế" };
  }
  if (input.seats.length > MAX_SEATS_PER_BOOKING) {
    return {
      ok: false,
      error: `Chỉ được đặt tối đa ${MAX_SEATS_PER_BOOKING} ghế mỗi lần`,
    };
  }
  const seatIds = input.seats.map((s) => s.seatId);
  if (new Set(seatIds).size !== seatIds.length) {
    return { ok: false, error: "Danh sách ghế bị trùng lặp" };
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
  const comboIds = comboInputs.map((c) => c.comboId);
  if (new Set(comboIds).size !== comboIds.length) {
    return { ok: false, error: "Danh sách combo bị trùng lặp" };
  }
  if (comboInputs.some((c) => c.quantity > 10)) {
    return { ok: false, error: "Tối đa 10 phần cho mỗi loại combo" };
  }
  const combosDb = await prisma.foodCombo.findMany({
    where: { id: { in: comboIds }, isActive: true },
  });
  if (combosDb.length !== comboIds.length) {
    return { ok: false, error: "Có combo không hợp lệ" };
  }
  const comboById = new Map(combosDb.map((c) => [c.id, c]));

  const seatLines = input.seats.map((s) => {
    const seat = seatById.get(s.seatId)!;
    const tt = ticketTypeById.get(s.ticketTypeId)!;
    const price = Math.max(
      0,
      seatBasePrice(showtime.basePrice, seat.type) + tt.priceModifier
    );
    return { seatId: s.seatId, ticketTypeId: s.ticketTypeId, price };
  });
  const seatsTotal = seatLines.reduce((sum, l) => sum + l.price, 0);

  const comboLines = comboInputs.map((c) => {
    const combo = comboById.get(c.comboId)!;
    return {
      comboId: c.comboId,
      quantity: c.quantity,
      unitPrice: combo.price,
    };
  });
  const combosTotal = comboLines.reduce(
    (sum, l) => sum + l.unitPrice * l.quantity,
    0
  );

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
        await tx.promotion.update({
          where: { id: promotionId },
          data: { usedCount: { increment: 1 } },
        });
      }

      let code = generateBookingCode();
      for (let i = 0; i < 5; i++) {
        const exists = await tx.booking.findUnique({ where: { code } });
        if (!exists) break;
        code = generateBookingCode();
      }

      const booking = await tx.booking.create({
        data: {
          code,
          showtimeId: showtime.id,
          userId,
          contactName: name,
          contactEmail: email,
          contactPhone: phone,
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

/** Complete sandbox payment for a PENDING online booking. */
export async function completeSandboxPayment(
  input: CompletePaymentInput
): Promise<ActionResult<{ code: string; status: string }>> {
  await expirePendingBookings();

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
  if (booking.status === "EXPIRED") {
    return { ok: false, error: "Đơn đã hết hạn giữ ghế. Vui lòng đặt lại." };
  }
  if (booking.status === "CONFIRMED") {
    return { ok: true, data: { code: booking.code, status: "CONFIRMED" } };
  }
  if (booking.status !== "PENDING" || !booking.payment) {
    return { ok: false, error: "Đơn không thể thanh toán" };
  }
  if (booking.payment.method === "AT_COUNTER") {
    return {
      ok: false,
      error: "Đơn thanh toán tại quầy — không qua cổng online",
    };
  }
  if (booking.expiresAt && booking.expiresAt < new Date()) {
    await expirePendingBookings();
    return { ok: false, error: "Hết thời gian giữ ghế" };
  }

  const { runSandboxPayment } = await import("@/lib/payment-sandbox");
  const pay = runSandboxPayment({
    method: booking.payment.method,
    cardNumber: input.cardNumber,
    outcome: input.outcome ?? "success",
  });

  if (!pay.ok) {
    await prisma.payment.update({
      where: { id: booking.payment.id },
      data: { status: "FAILED" },
    });
    return { ok: false, error: pay.error };
  }

  await prisma.$transaction([
    prisma.booking.update({
      where: { id: booking.id },
      data: { status: "CONFIRMED", expiresAt: null },
    }),
    prisma.payment.update({
      where: { id: booking.payment.id },
      data: {
        status: "PAID",
        paidAt: new Date(),
        sandboxTxnId: pay.txnId,
      },
    }),
  ]);

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
