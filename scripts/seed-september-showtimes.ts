import { PrismaClient } from "@prisma/client";
import { buildRoomSchedule } from "../src/lib/showtime-schedule";

// Seed lịch chiếu tháng 9 cho tất cả phim:
// - NOW_SHOWING: chiếu cả kỳ.
// - COMING_SOON: chỉ chiếu từ ngày sau releaseDate (data mẫu đã cũ nên luôn thỏa).
// Idempotent: bỏ qua (room, ngày) đã có showtime SCHEDULED.

const prisma = new PrismaClient();

// Tháng 9 cần seed: từ 12 → 25 (14 ngày tới kể từ hôm nay 11/09).
const START_DAY_OFFSET = 1;
const DAY_SPAN = 14;

function dayRange(offset: number) {
  const day = new Date();
  day.setDate(day.getDate() + offset);
  day.setHours(0, 0, 0, 0);
  const nextDay = new Date(day);
  nextDay.setDate(nextDay.getDate() + 1);
  return { day, nextDay };
}

async function main() {
  const [movies, rooms] = await Promise.all([
    prisma.movie.findMany({
      where: { status: { in: ["NOW_SHOWING", "COMING_SOON"] } },
      select: {
        id: true,
        slug: true,
        title: true,
        durationMin: true,
        status: true,
        releaseDate: true,
      },
      orderBy: { id: "asc" },
    }),
    prisma.room.findMany({
      where: { isActive: true, cinema: { isActive: true } },
      select: { id: true, cinemaId: true, name: true },
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

  const createdPerMovie: Record<string, number> = {};
  let created = 0;

  for (let dayOffset = START_DAY_OFFSET; dayOffset < START_DAY_OFFSET + DAY_SPAN; dayOffset++) {
    const { day, nextDay } = dayRange(dayOffset);

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

      // Chỉ xếp phim đã phát hành tính đến hết ngày này.
      const playable = movies.filter(
        (m) =>
          m.status === "NOW_SHOWING" ||
          new Date(m.releaseDate).getTime() < nextDay.getTime()
      );
      if (playable.length === 0) continue;

      const schedule = buildRoomSchedule(day, playable, {
        openingHour: 10,
        closingHour: 24,
        cleanupMinutes: 15,
        rotation: dayOffset + roomIndex,
      });

      const result = await prisma.showtime.createMany({
        data: schedule.map((slot, slotIndex) => {
          const format =
            roomIndex % 5 === 2 ? "IMAX" : slotIndex % 2 === 0 ? "2D" : "3D";
          const movie = playable.find((m) => m.id === slot.movieId)!;
          createdPerMovie[movie.slug] = (createdPerMovie[movie.slug] ?? 0) + 1;
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

  console.log(`September showtimes created: ${created}`);
  for (const [slug, count] of Object.entries(createdPerMovie).sort()) {
    console.log(`  ${slug}: ${count}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
