import { prisma } from "@/lib/prisma";

/**
 * Mark PENDING bookings past expiresAt as EXPIRED and release seat locks.
 * Safe to call on every seat-map load / cron tick / payment page.
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
      // ponytail: per-row conditional update keeps expiry/payment race-safe;
      // a bulk UPDATE ... RETURNING can replace this if expiry throughput matters.
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

/** Seat IDs currently locked (held or sold) for a showtime. */
export async function getLockedSeatIds(showtimeId: string): Promise<string[]> {
  await expirePendingBookings();
  const locks = await prisma.showtimeSeatLock.findMany({
    where: { showtimeId },
    select: { seatId: true },
  });
  return locks.map((l) => l.seatId);
}
