"use server";

import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { generateBookingCode, seatBasePrice } from "@/lib/booking";
import { MAX_SEATS_PER_BOOKING } from "@/lib/constants";

export type CreateBookingInput = {
  showtimeId: string;
  seats: { seatId: string; ticketTypeId: string }[];
  combos: { comboId: string; quantity: number }[];
  promotionCode?: string;
  contact: { name: string; email: string; phone: string };
  paymentMethod: string;
  idempotencyKey?: string;
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

// Pay-at-counter bookings hold seats this long before expiring
const HOLD_MINUTES = 15;

// ── Rate limiting ────────────────────────────────────────────────────────
// ponytail: in-memory per-process limiter, resets on restart and doesn't
// share state across instances. Move to Redis when running >1 instance.
const RATE_LIMIT = { windowMs: 60_000, max: 10 };
const hits = new Map<string, number[]>();

async function rateLimited(): Promise<boolean> {
  const ip =
    (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT.windowMs);
  if (recent.length >= RATE_LIMIT.max) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  return false;
}

// ── Expired-hold sweep ───────────────────────────────────────────────────
// Lazy sweep: runs on booking attempts, no cron needed. Seats of expired
// bookings free up because seat queries filter status IN (PENDING, CONFIRMED).
async function sweepExpiredBookings() {
  const expired = await prisma.booking.findMany({
    where: { status: "PENDING", expiresAt: { lt: new Date() } },
    select: { id: true, promotionId: true },
  });
  if (expired.length === 0) return;
  await prisma.$transaction([
    prisma.booking.updateMany({
      where: { id: { in: expired.map((b) => b.id) } },
      data: { status: "EXPIRED" },
    }),
    // give back promo slots that expired holds consumed
    ...expired
      .filter((b) => b.promotionId)
      .map((b) =>
        prisma.promotion.update({
          where: { id: b.promotionId! },
          data: { usedCount: { decrement: 1 } },
        })
      ),
  ]);
}

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
): Promise<ActionResult<{ code: string }>> {
  if (await rateLimited()) {
    return {
      ok: false,
      error: "Quá nhiều yêu cầu, vui lòng thử lại sau ít phút.",
    };
  }

  // ── Contact validation ────────────────────────────────────────────────
  const name = input.contact.name?.trim();
  const email = input.contact.email?.trim();
  const phone = input.contact.phone?.trim();

  if (!name || name.length < 2) {
    return { ok: false, error: "Vui lòng nhập họ tên hợp lệ" };
  }
  if (!email || !EMAIL_RE.test(email)) {
    return { ok: false, error: "Vui lòng nhập email hợp lệ" };
  }
  if (!phone || !PHONE_RE.test(phone)) {
    return { ok: false, error: "Vui lòng nhập số điện thoại hợp lệ (bắt đầu bằng 0, 10-11 số)" };
  }
  if (!PAYMENT_METHODS.includes(input.paymentMethod)) {
    return { ok: false, error: "Phương thức thanh toán không hợp lệ" };
  }

  // ── Seat validation ──────────────────────────────────────────────────
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

  // ── Idempotency: a retry with the same key returns the original booking ─
  const idempotencyKey = input.idempotencyKey?.trim() || null;
  if (idempotencyKey) {
    const existing = await prisma.booking.findUnique({
      where: { idempotencyKey },
      select: { code: true },
    });
    if (existing) return { ok: true, data: { code: existing.code } };
  }

  // free seats held by expired pay-at-counter bookings before we check
  await sweepExpiredBookings();

  // ── Showtime validation ──────────────────────────────────────────────
  const showtime = await prisma.showtime.findUnique({
    where: { id: input.showtimeId },
  });
  if (!showtime || showtime.status !== "SCHEDULED") {
    return { ok: false, error: "Suất chiếu không tồn tại hoặc đã bị hủy" };
  }
  if (showtime.startsAt <= new Date()) {
    return { ok: false, error: "Suất chiếu đã bắt đầu, không thể đặt vé" };
  }

  // ── Load seats & ticket types & combos ───────────────────────────────
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

  // ── Price computation (server-side, authoritative) ───────────────────
  const seatLines = input.seats.map((s) => {
    const seat = seatById.get(s.seatId)!;
    const tt = ticketTypeById.get(s.ticketTypeId)!;
    const price = Math.max(
      0,
      seatBasePrice(showtime.basePrice, seat.type) + tt.priceModifier
    );
    return {
      seatId: s.seatId,
      ticketTypeId: s.ticketTypeId,
      showtimeId: showtime.id,
      price,
    };
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

  // ── Promotion (claimed atomically inside the transaction below) ──────
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
        error: "Mã ưu đãi không hợp lệ hoặc đã hết hạn. Vui lòng kiểm tra lại.",
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

  // ── Transaction ───────────────────────────────────────────────────────
  // Double booking is impossible: the unique index (showtimeId, seatId) on
  // BookingSeat rejects the second insert even if two requests race past
  // the conflict check.
  try {
    const result = await prisma.$transaction(async (tx) => {
      // fast friendly error before the constraint fires
      const conflicts = await tx.bookingSeat.findMany({
        where: {
          seatId: { in: seatIds },
          booking: {
            showtimeId: showtime.id,
            status: { in: ["PENDING", "CONFIRMED"] },
          },
        },
        include: { seat: true },
      });
      if (conflicts.length > 0) {
        const names = conflicts
          .map((c) => `${c.seat.row}${c.seat.number}`)
          .join(", ");
        throw new Error(`SEAT_TAKEN:${names}`);
      }

      // atomic promo claim: read+increment inside the write transaction.
      // ponytail: safe because SQLite serializes write transactions; on
      // Postgres use a conditional UPDATE ... WHERE usedCount < limit.
      if (promotionId) {
        const promo = await tx.promotion.findUnique({
          where: { id: promotionId },
        });
        const claimable =
          promo &&
          promo.isActive &&
          promo.startsAt <= new Date() &&
          promo.expiresAt >= new Date() &&
          (promo.usageLimit === null || promo.usedCount < promo.usageLimit) &&
          orderValue >= promo.minOrderValue;
        if (!claimable) throw new Error("PROMO_INVALID");
        await tx.promotion.update({
          where: { id: promotionId },
          data: { usedCount: { increment: 1 } },
        });
      }

      // simulate payment: AT_COUNTER stays UNPAID and holds seats only
      // until expiresAt; other methods succeed immediately
      const paid = input.paymentMethod !== "AT_COUNTER";

      // generate unique code with retries
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
          contactName: name,
          contactEmail: email,
          contactPhone: phone,
          status: paid ? "CONFIRMED" : "PENDING",
          idempotencyKey,
          expiresAt: paid ? null : new Date(Date.now() + HOLD_MINUTES * 60_000),
          seatsTotal,
          combosTotal,
          discountTotal,
          finalTotal,
          promotionId,
          seats: { create: seatLines },
          combos: { create: comboLines },
          payment: {
            create: {
              method: input.paymentMethod,
              status: paid ? "PAID" : "UNPAID",
              amount: finalTotal,
              paidAt: paid ? new Date() : null,
            },
          },
        },
      });

      return booking;
    });

    return { ok: true, data: { code: result.code } };
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("SEAT_TAKEN:")) {
      const names = e.message.slice("SEAT_TAKEN:".length);
      return {
        ok: false,
        error: `Ghế ${names} vừa được người khác đặt. Vui lòng chọn ghế khác.`,
      };
    }
    if (e instanceof Error && e.message === "PROMO_INVALID") {
      return {
        ok: false,
        error: "Mã ưu đãi không hợp lệ hoặc đã hết hạn. Vui lòng kiểm tra lại.",
      };
    }
    // unique (showtimeId, seatId) violation = lost the race for a seat
    if (
      typeof e === "object" &&
      e !== null &&
      "code" in e &&
      (e as { code?: string }).code === "P2002"
    ) {
      return {
        ok: false,
        error: "Có ghế vừa được người khác đặt. Vui lòng chọn ghế khác.",
      };
    }
    console.error("createBooking failed:", e);
    return {
      ok: false,
      error: "Không thể tạo đơn đặt vé. Vui lòng thử lại sau.",
    };
  }
}
