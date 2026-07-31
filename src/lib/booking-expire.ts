import { prisma } from "@/lib/prisma";

/**
 * Mark PENDING bookings past expiresAt as EXPIRED and release seat locks.
 * Called by cron job (every 1-2 min) and server actions.
 */
export async function expirePendingBookings(): Promise<number> {
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const candidates = await tx.booking.findMany({
      where: {
        status: "PENDING",
        expiresAt: { lt: now },
      },
      select: { id: true },
    });

    let expiredCount = 0;
    for (const { id } of candidates) {
      const expired = await tx.booking.updateMany({
        where: { id, status: "PENDING", expiresAt: { lt: now } },
        data: { status: "EXPIRED" },
      });
      if (expired.count === 0) continue;

      await tx.showtimeSeatLock.deleteMany({ where: { bookingId: id } });
      await tx.payment.updateMany({
        where: {
          bookingId: id,
          status: { in: ["UNPAID", "PROCESSING"] },
        },
        data: { status: "FAILED", lastError: "booking_expired" },
      });
      expiredCount++;
    }

    return expiredCount;
  });
}

/** In-memory cache for locked seat IDs per showtime. TTL = 3 seconds. */
const lockedSeatCache = new Map<
  string,
  { ids: string[]; expiresAt: number }
>();

const CACHE_TTL_MS = 3_000;

/** Seat IDs currently locked (held or sold) for a showtime. */
export async function getLockedSeatIds(showtimeId: string): Promise<string[]> {
  const cached = lockedSeatCache.get(showtimeId);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.ids;
  }

  const locks = await prisma.showtimeSeatLock.findMany({
    where: { showtimeId },
    select: { seatId: true },
  });
  const ids = locks.map((l) => l.seatId);

  lockedSeatCache.set(showtimeId, { ids, expiresAt: Date.now() + CACHE_TTL_MS });
  return ids;
}

/** Invalidate cache for a showtime (call after seat lock changes). */
export function invalidateLockedSeatCache(showtimeId: string): void {
  lockedSeatCache.delete(showtimeId);
}

/** Cron-friendly batch expiry + cache invalidation. */
export async function expirePendingBookingsBatch(): Promise<{
  expiredCount: number;
  invalidatedShowtimes: string[];
}> {
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const candidates = await tx.booking.findMany({
      where: {
        status: "PENDING",
        expiresAt: { lt: now },
      },
      select: { id: true, showtimeId: true },
    });

    let expiredCount = 0;
    const invalidatedShowtimes = new Set<string>();

    for (const { id, showtimeId } of candidates) {
      const expired = await tx.booking.updateMany({
        where: { id, status: "PENDING", expiresAt: { lt: now } },
        data: { status: "EXPIRED" },
      });
      if (expired.count === 0) continue;

      await tx.showtimeSeatLock.deleteMany({ where: { bookingId: id } });
      await tx.payment.updateMany({
        where: {
          bookingId: id,
          status: { in: ["UNPAID", "PROCESSING"] },
        },
        data: { status: "FAILED", lastError: "booking_expired" },
      });
      expiredCount++;
      invalidatedShowtimes.add(showtimeId);
    }

    for (const sid of invalidatedShowtimes) {
      lockedSeatCache.delete(sid);
    }

    return { expiredCount, invalidatedShowtimes: [...invalidatedShowtimes] };
  });
}