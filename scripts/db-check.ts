import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const [movies, cinemas, rooms, seats, showtimes, bookings, combos, promos, users] =
    await Promise.all([
      prisma.movie.count(),
      prisma.cinema.count(),
      prisma.room.count(),
      prisma.seat.count(),
      prisma.showtime.count(),
      prisma.booking.count(),
      prisma.foodCombo.count(),
      prisma.promotion.count(),
      prisma.user.count(),
    ]);

  console.log("📊 Database check:");
  console.log({ movies, cinemas, rooms, seats, showtimes, bookings, combos, promos, users });

  const future = await prisma.showtime.count({
    where: { startsAt: { gt: new Date() } },
  });
  console.log(`   Showtimes in the future: ${future}`);

  const bookedSeats = await prisma.bookingSeat.count();
  console.log(`   Booked seats total: ${bookedSeats}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
