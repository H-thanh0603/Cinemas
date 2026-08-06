import { seatBasePrice } from "./booking";

/**
 * Pricing & validation helpers tách khỏi server action createBooking
 * để unit-test được (thuần, không phụ thuộc DB).
 */

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_RE = /^0\d{9,10}$/;

export function validateContact(input: {
  name: string;
  email: string;
  phone: string;
}): string | null {
  const name = input.name?.trim();
  const email = input.email?.trim().toLowerCase();
  const phone = input.phone?.trim();

  if (!name || name.length < 2) {
    return "Vui lòng nhập họ tên hợp lệ";
  }
  if (!email || !EMAIL_RE.test(email)) {
    return "Vui lòng nhập email hợp lệ";
  }
  if (!phone || !PHONE_RE.test(phone)) {
    return "Vui lòng nhập số điện thoại hợp lệ (bắt đầu bằng 0, 10-11 số)";
  }
  return null;
}

export function validateSeatSelection(
  seatIds: string[],
  maxSeats: number
): string | null {
  if (!seatIds || seatIds.length === 0) {
    return "Vui lòng chọn ít nhất 1 ghế";
  }
  if (seatIds.length > maxSeats) {
    return `Chỉ được đặt tối đa ${maxSeats} ghế mỗi lần`;
  }
  if (new Set(seatIds).size !== seatIds.length) {
    return "Danh sách ghế bị trùng lặp";
  }
  return null;
}

export function validateComboInputs(inputs: {
  comboId: string;
  quantity: number;
}[]): string | null {
  const comboInputs = (inputs ?? []).filter((c) => c.quantity > 0);
  const comboIds = comboInputs.map((c) => c.comboId);
  if (new Set(comboIds).size !== comboIds.length) {
    return "Danh sách combo bị trùng lặp";
  }
  if (comboInputs.some((c) => c.quantity > 10)) {
    return "Tối đa 10 phần cho mỗi loại combo";
  }
  return null;
}

export function computeDiscount(
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

export type PricingSeatLine = {
  seatId: string;
  ticketTypeId: string;
  price: number;
};

export function buildSeatPricing(input: {
  basePrice: number;
  seats: { seatId: string; ticketTypeId: string; seatType: string }[];
  ticketTypeById: Map<string, { id: string; priceModifier: number }>;
}): { seatLines: PricingSeatLine[]; seatsTotal: number } {
  const seatLines: PricingSeatLine[] = input.seats.map((s) => {
    const tt = input.ticketTypeById.get(s.ticketTypeId)!;
    const price = Math.max(
      0,
      seatBasePrice(input.basePrice, s.seatType) + tt.priceModifier
    );
    return { seatId: s.seatId, ticketTypeId: s.ticketTypeId, price };
  });
  const seatsTotal = seatLines.reduce((sum, l) => sum + l.price, 0);
  return { seatLines, seatsTotal };
}

export type PricingComboLine = {
  comboId: string;
  quantity: number;
  unitPrice: number;
};

export function buildComboPricing(input: {
  comboInputs: { comboId: string; quantity: number }[];
  comboById: Map<string, { id: string; price: number }>;
}): { comboLines: PricingComboLine[]; combosTotal: number } {
  const comboLines: PricingComboLine[] = input.comboInputs.map((c) => ({
    comboId: c.comboId,
    quantity: c.quantity,
    unitPrice: input.comboById.get(c.comboId)!.price,
  }));
  const combosTotal = comboLines.reduce(
    (sum, l) => sum + l.unitPrice * l.quantity,
    0
  );
  return { comboLines, combosTotal };
}
