import { prisma } from "@/lib/prisma";

/**
 * Mark PENDING bookings past expiresAt as EXPIRED and release seat locks.
 * Safe to call on every seat-map load / cron tick / payment page.
 */
export async function expirePendingBookings(): Promise<number> {
  const now = new Date();

  const expired = await prisma.booking.findMany({
    where: {
      status: "PENDING",
      expiresAt: { lt: now },
    },
    select: { id: true },
  });

  if (expired.length === 0) return 0;

  const ids = expired.map((b) => b.id);

  await prisma.$transaction([
    prisma.showtimeSeatLock.deleteMany({
      where: { bookingId: { in: ids } },
    }),
    prisma.booking.updateMany({
      where: { id: { in: ids } },
      data: { status: "EXPIRED" },
    }),
  ]);

  return ids.length;
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
