import { PrismaClient } from "@prisma/client";
import { buildRoomSchedule } from "../src/lib/showtime-schedule";

const prisma = new PrismaClient();

async function main() {
  const [movies, rooms] = await Promise.all([
    prisma.movie.findMany({
      where: { status: "NOW_SHOWING" },
      select: { id: true, durationMin: true },
      orderBy: { id: "asc" },
    }),
    prisma.room.findMany({
      where: { isActive: true, cinema: { isActive: true } },
      select: { id: true, cinemaId: true },
      orderBy: { id: "asc" },
    }),
  ]);
  if (movies.length === 0 || rooms.length === 0) {
    throw new Error("Active movies and rooms are required");
  }

  const basePrices: Record<string, number> = {
    "2D": 75000,
    "3D": 95000,
    IMAX: 130000,
  };
  let created = 0;

  for (let dayOffset = 1; dayOffset <= 14; dayOffset++) {
    const day = new Date();
    day.setDate(day.getDate() + dayOffset);
    day.setHours(0, 0, 0, 0);
    const nextDay = new Date(day);
    nextDay.setDate(nextDay.getDate() + 1);

    for (let roomIndex = 0; roomIndex < rooms.length; roomIndex++) {
      const room = rooms[roomIndex];
      const existing = await prisma.showtime.count({
        where: {
          roomId: room.id,
          status: "SCHEDULED",
          startsAt: { gte: day, lt: nextDay },
        },
      });
      if (existing > 0) continue;

      const schedule = buildRoomSchedule(day, movies, {
        openingHour: 10,
        closingHour: 24,
        cleanupMinutes: 15,
        rotation: dayOffset + roomIndex,
      });
      const result = await prisma.showtime.createMany({
        data: schedule.map((slot, slotIndex) => {
          const format =
            roomIndex % 5 === 2 ? "IMAX" : slotIndex % 2 === 0 ? "2D" : "3D";
          return {
            movieId: slot.movieId,
            cinemaId: room.cinemaId,
            roomId: room.id,
            startsAt: slot.startsAt,
            endsAt: slot.endsAt,
            basePrice: basePrices[format],
            format,
          };
        }),
      });
      created += result.count;
    }
  }

  console.log(`future showtimes created: ${created}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
