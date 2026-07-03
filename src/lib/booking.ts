import { SEAT_TYPE_SURCHARGE } from "./constants";

export function seatBasePrice(basePrice: number, seatType: string): number {
  return basePrice + (SEAT_TYPE_SURCHARGE[seatType] ?? 0);
}

export function generateBookingCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `CS-${code}`;
}
