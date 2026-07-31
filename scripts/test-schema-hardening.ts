import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const requiredTables = [
    "AuditLog",
    "PasswordResetToken",
    "RateLimitBucket",
    "PaymentEvent",
  ];
  const tables = await prisma.$queryRaw<Array<{ name: string }>>(Prisma.sql`
    SELECT tablename AS name
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename IN (${Prisma.join(requiredTables)})
  `);
  assert.deepEqual(
    new Set(tables.map((table) => table.name)),
    new Set(requiredTables),
    "production hardening tables are missing"
  );

  const requiredConstraints = [
    "Showtime_no_scheduled_overlap",
    "Showtime_time_check",
    "Showtime_base_price_check",
    "Booking_totals_check",
    "Payment_amount_check",
    "Promotion_values_check",
  ];
  const constraints = await prisma.$queryRaw<Array<{ name: string }>>(Prisma.sql`
    SELECT conname AS name
    FROM pg_constraint
    WHERE conname IN (${Prisma.join(requiredConstraints)})
  `);
  assert.deepEqual(
    new Set(constraints.map((constraint) => constraint.name)),
    new Set(requiredConstraints),
    "database integrity constraints are missing"
  );

  const movie = await prisma.movie.findFirstOrThrow();
  const room = await prisma.room.findFirstOrThrow();
  const firstId = randomUUID();
  const secondId = randomUUID();
  const startsAt = new Date("2035-01-01T10:00:00.000Z");
  const firstEndsAt = new Date("2035-01-01T12:00:00.000Z");
  const secondStartsAt = new Date("2035-01-01T11:00:00.000Z");
  const secondEndsAt = new Date("2035-01-01T13:00:00.000Z");

  try {
    await prisma.$executeRaw(Prisma.sql`
      INSERT INTO "Showtime"
        ("id", "movieId", "cinemaId", "roomId", "startsAt", "endsAt",
         "basePrice", "format", "status", "createdAt")
      VALUES
        (${firstId}, ${movie.id}, ${room.cinemaId}, ${room.id}, ${startsAt},
         ${firstEndsAt}, 80000, '2D', 'SCHEDULED', NOW())
    `);

    let overlapRejected = false;
    try {
      await prisma.$executeRaw(Prisma.sql`
        INSERT INTO "Showtime"
          ("id", "movieId", "cinemaId", "roomId", "startsAt", "endsAt",
           "basePrice", "format", "status", "createdAt")
        VALUES
          (${secondId}, ${movie.id}, ${room.cinemaId}, ${room.id},
           ${secondStartsAt}, ${secondEndsAt}, 80000, '2D', 'SCHEDULED', NOW())
      `);
    } catch {
      overlapRejected = true;
    }
    assert.equal(overlapRejected, true, "database allowed overlapping showtimes");
  } finally {
    await prisma.showtime.deleteMany({ where: { id: { in: [firstId, secondId] } } });
  }

  console.log("schema hardening checks passed");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
