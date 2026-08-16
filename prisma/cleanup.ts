// Retention: delete old CANCELLED/EXPIRED bookings so the DB doesn't grow
// unbounded. Run via `npm run db:cleanup` (cron it in production).
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const RETENTION_DAYS = 90;

async function main() {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - RETENTION_DAYS);

  // BookingSeat/BookingCombo/Payment cascade-delete with the booking
  const result = await prisma.booking.deleteMany({
    where: {
      status: { in: ["CANCELLED", "EXPIRED"] },
      createdAt: { lt: cutoff },
    },
  });

  console.log(
    `Deleted ${result.count} cancelled/expired bookings older than ${RETENTION_DAYS} days.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
