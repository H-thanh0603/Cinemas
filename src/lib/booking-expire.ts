import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Mark PENDING bookings past expiresAt as EXPIRED and release seat locks.
 * Bulk SQL (no per-booking loop) — safe under concurrency: UPDATE ... WHERE
 * status='PENDING' guards against double-expire; locks released only for
 * bookings this transaction actually flipped.
 */
export async function expirePendingBookings(): Promise<number> {
  const { expiredCount } = await expirePendingBookingsBatch();
  return expiredCount;
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
    // Flip PENDING→EXPIRED in one statement; RETURNING ids so we only touch
    // locks/payments of bookings this call won (race-safe vs concurrent runs).
    //
    // TIMEZONE-SAFETY: cột "expiresAt" là timestamp NAIVE ghi theo UTC wall
    // (Prisma DateTime → timestamp without timezone). new Date() gửi qua
    // driver là timestamptz. So sánh trực tiếp naive < timestamptz khiến
    // Postgres diễn giải naive theo SESSION timezone — lệch cả tiếng khi
    // server để TZ khác UTC (vd local dev +07). Ép so sánh cùng múi giờ:
    // naive-UTC (cột) so với naive-UTC (now AT TIME ZONE 'UTC').
    const expired = await tx.$queryRaw<{ id: string }[]>(Prisma.sql`
      UPDATE "Booking"
      SET "status" = 'EXPIRED'
      WHERE "status" = 'PENDING' AND "expiresAt" < (${now} AT TIME ZONE 'UTC')
      RETURNING "id"
    `);

    if (expired.length === 0) return { expiredCount: 0 };
    const ids = expired.map((r) => r.id);

    await tx.showtimeSeatLock.deleteMany({
      where: { bookingId: { in: ids } },
    });
    await tx.payment.updateMany({
      where: {
        bookingId: { in: ids },
        status: { in: ["UNPAID", "PROCESSING"] },
      },
      data: { status: "FAILED", lastError: "booking_expired" },
    });

    return { expiredCount: ids.length };
  });
}
