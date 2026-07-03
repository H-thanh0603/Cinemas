import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate, formatTime, formatVnd } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function CinemaDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const cinema = await prisma.cinema.findUnique({
    where: { slug },
    include: {
      rooms: {
        where: { isActive: true },
        include: { _count: { select: { seats: true } } },
      },
      showtimes: {
        where: { startsAt: { gt: new Date() }, status: "SCHEDULED" },
        orderBy: { startsAt: "asc" },
        take: 60,
        include: { movie: true, room: true },
      },
    },
  });

  if (!cinema) notFound();

  // group showtimes by date then movie
  const byDate = new Map<
    string,
    Map<
      string,
      {
        movie: (typeof cinema.showtimes)[number]["movie"];
        items: typeof cinema.showtimes;
      }
    >
  >();
  for (const st of cinema.showtimes) {
    const dateKey = formatDate(st.startsAt);
    if (!byDate.has(dateKey)) byDate.set(dateKey, new Map());
    const movieMap = byDate.get(dateKey)!;
    if (!movieMap.has(st.movieId)) {
      movieMap.set(st.movieId, { movie: st.movie, items: [] });
    }
    movieMap.get(st.movieId)!.items.push(st);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <nav className="text-xs text-muted">
        <Link href="/" className="hover:text-foreground">
          Trang chủ
        </Link>{" "}
        /{" "}
        <Link href="/cinemas" className="hover:text-foreground">
          Rạp
        </Link>{" "}
        / <span className="text-foreground">{cinema.name}</span>
      </nav>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h1 className="text-3xl font-bold tracking-tight">{cinema.name}</h1>
          {cinema.description && (
            <p className="mt-3 leading-relaxed text-muted">
              {cinema.description}
            </p>
          )}

          <dl className="mt-6 grid gap-4 rounded-2xl border border-border bg-surface p-6 sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted-dark">
                Địa chỉ
              </dt>
              <dd className="mt-1 text-sm font-medium">
                {cinema.address}, {cinema.city}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted-dark">
                Điện thoại
              </dt>
              <dd className="mt-1 text-sm font-medium">{cinema.phone}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted-dark">
                Giờ mở cửa
              </dt>
              <dd className="mt-1 text-sm font-medium">{cinema.openingHours}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted-dark">
                Phòng chiếu
              </dt>
              <dd className="mt-1 text-sm font-medium">
                {cinema.rooms.length} phòng
              </dd>
            </div>
          </dl>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {cinema.rooms.map((room) => (
              <div
                key={room.id}
                className="rounded-xl border border-border bg-surface p-4"
              >
                <h3 className="font-semibold">{room.name}</h3>
                <p className="mt-1 text-xs text-muted">
                  {room._count.seats} ghế · {room.rows} hàng
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Map placeholder */}
        <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface p-6 text-center">
          <span className="text-5xl">🗺️</span>
          <p className="mt-3 text-sm font-medium">Bản đồ</p>
          <p className="mt-1 text-xs text-muted">
            Bản đồ chỉ đường sẽ được tích hợp sớm
          </p>
        </div>
      </div>

      {/* Showtimes */}
      <section className="mt-12">
        <h2 className="text-xl font-bold">Lịch chiếu tại rạp</h2>
        {byDate.size === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-border bg-surface px-6 py-12 text-center">
            <span className="text-4xl">📅</span>
            <p className="mt-3 font-medium">Chưa có suất chiếu sắp tới</p>
            <p className="mt-1 text-sm text-muted">Vui lòng quay lại sau.</p>
          </div>
        ) : (
          <div className="mt-6 space-y-8">
            {[...byDate.entries()].map(([dateKey, movieMap]) => (
              <div key={dateKey}>
                <h3 className="text-sm font-bold uppercase tracking-wider text-accent">
                  📅 {dateKey}
                </h3>
                <div className="mt-4 space-y-4">
                  {[...movieMap.values()].map((group) => (
                    <div
                      key={group.movie.id}
                      className="flex gap-4 rounded-2xl border border-border bg-surface p-4"
                    >
                      <Link
                        href={`/movies/${group.movie.slug}`}
                        className="relative hidden aspect-[2/3] w-20 shrink-0 overflow-hidden rounded-lg sm:block"
                      >
                        <Image
                          src={group.movie.posterUrl}
                          alt={group.movie.title}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/movies/${group.movie.slug}`}
                          className="font-semibold hover:text-primary"
                        >
                          {group.movie.title}
                        </Link>
                        <p className="mt-0.5 text-xs text-muted">
                          {group.movie.durationMin} phút ·{" "}
                          {group.movie.ageRating}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {group.items.map((st) => (
                            <Link
                              key={st.id}
                              href={`/booking/${st.id}`}
                              className="group rounded-lg border border-border-light bg-surface-raised px-3.5 py-2 text-center transition-all hover:border-primary hover:bg-primary/10"
                            >
                              <span className="block text-sm font-bold group-hover:text-primary">
                                {formatTime(st.startsAt)}
                              </span>
                              <span className="block text-[10px] text-muted">
                                {st.format} · {st.room.name} ·{" "}
                                {formatVnd(st.basePrice)}
                              </span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
