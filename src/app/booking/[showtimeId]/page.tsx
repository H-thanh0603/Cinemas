import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BookingFlow } from "@/components/booking/booking-flow";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { formatDateTime } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function BookingPage({
  params,
}: {
  params: Promise<{ showtimeId: string }>;
}) {
  const { showtimeId } = await params;

  const showtime = await prisma.showtime.findUnique({
    where: { id: showtimeId },
    include: {
      movie: true,
      cinema: true,
      room: { include: { seats: true } },
    },
  });

  if (!showtime) notFound();

  const isPast = showtime.startsAt <= new Date();
  const isCancelled = showtime.status === "CANCELLED";

  if (isPast || isCancelled) {
    return (
      <div className="mx-auto flex max-w-7xl flex-col items-center px-4 py-24 text-center sm:px-6">
        <span className="text-6xl">⏰</span>
        <h1 className="mt-6 text-2xl font-bold">
          {isCancelled ? "Suất chiếu đã bị hủy" : "Suất chiếu đã kết thúc"}
        </h1>
        <p className="mt-3 max-w-md text-muted">
          Suất chiếu {showtime.movie.title} lúc{" "}
          {formatDateTime(showtime.startsAt)}{" "}
          {isCancelled
            ? "đã bị hủy bởi rạp."
            : "đã qua, không thể đặt vé."}{" "}
          Vui lòng chọn suất chiếu khác.
        </p>
        <Link
          href={`/movies/${showtime.movie.slug}#showtimes`}
          className="mt-8 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
        >
          Xem suất chiếu khác
        </Link>
      </div>
    );
  }

  // Seats already taken for this showtime (bookings not cancelled/expired)
  const bookedSeats = await prisma.bookingSeat.findMany({
    where: {
      booking: {
        showtimeId,
        status: { in: ["PENDING", "CONFIRMED"] },
      },
    },
    select: { seatId: true },
  });

  const [ticketTypes, combos] = await Promise.all([
    prisma.ticketType.findMany({ where: { isActive: true } }),
    prisma.foodCombo.findMany({
      where: { isActive: true },
      orderBy: { price: "asc" },
    }),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <Breadcrumbs items={[
        { label: "Trang chủ", href: "/" },
        { label: showtime.movie.title, href: `/movies/${showtime.movie.slug}` },
        { label: "Đặt vé" },
      ]} />
      <BookingFlow
      showtime={{
        id: showtime.id,
        startsAt: showtime.startsAt.toISOString(),
        format: showtime.format,
        basePrice: showtime.basePrice,
        movie: {
          title: showtime.movie.title,
          slug: showtime.movie.slug,
          posterUrl: showtime.movie.posterUrl,
          durationMin: showtime.movie.durationMin,
          ageRating: showtime.movie.ageRating,
        },
        cinema: {
          name: showtime.cinema.name,
          address: showtime.cinema.address,
          city: showtime.cinema.city,
        },
        room: {
          name: showtime.room.name,
          rows: showtime.room.rows,
          cols: showtime.room.cols,
        },
      }}
      seats={showtime.room.seats.map((s) => ({
        id: s.id,
        row: s.row,
        number: s.number,
        type: s.type,
        isActive: s.isActive,
      }))}
      bookedSeatIds={bookedSeats.map((b) => b.seatId)}
      ticketTypes={ticketTypes.map((t) => ({
        id: t.id,
        code: t.code,
        name: t.name,
        description: t.description,
        priceModifier: t.priceModifier,
      }))}
      combos={combos.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        imageUrl: c.imageUrl,
        price: c.price,
        category: c.category,
      }))}
    />
    </div>
  );
}
