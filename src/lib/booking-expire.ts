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

/**
 * Seat IDs currently locked (held or sold) for a showtime.
 * Query trực tiếp DB — không cache in-memory để đúng trên mọi topology
 * (multi-instance/serverless). Đã có index trên ShowtimeSeatLock.showtimeId.
 */
export async function getLockedSeatIds(showtimeId: string): Promise<string[]> {
  const locks = await prisma.showtimeSeatLock.findMany({
    where: { showtimeId },
    select: { seatId: true },
  });
  return locks.map((l) => l.seatId);
}

/** Cron-friendly batch expiry. */
export async function expirePendingBookingsBatch(): Promise<{
  expiredCount: number;
}> {
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

    return { expiredCount };
  });
}
