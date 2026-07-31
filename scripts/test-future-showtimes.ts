import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const futureCount = await prisma.showtime.count({
    where: { startsAt: { gt: new Date() }, status: "SCHEDULED" },
  });
  assert.ok(futureCount > 0, "database has no future scheduled showtimes");

  const [{ count }] = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) AS count
    FROM "Showtime" first_show
    JOIN "Showtime" second_show
      ON first_show."roomId" = second_show."roomId"
     AND first_show.id < second_show.id
     AND first_show.status = 'SCHEDULED'
     AND second_show.status = 'SCHEDULED'
     AND first_show."startsAt" < second_show."endsAt"
     AND second_show."startsAt" < first_show."endsAt"
    WHERE first_show."startsAt" > NOW()
  `;
  assert.equal(count, 0n, "future scheduled showtimes overlap");
  console.log(`future showtime checks passed (${futureCount} scheduled)`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
