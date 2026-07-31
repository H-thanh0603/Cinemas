import { SEAT_TYPE_SURCHARGE } from "./constants";

export function seatBasePrice(basePrice: number, seatType: string): number {
  return basePrice + (SEAT_TYPE_SURCHARGE[seatType] ?? 0);
}

export function generateBookingCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const random = crypto.getRandomValues(new Uint32Array(10));
  let code = "";
  for (let i = 0; i < 10; i++) {
    code += chars[random[i] % chars.length];
  }
  return `CS-${code}`;
}
