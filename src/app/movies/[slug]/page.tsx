import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui";
import {
  AGE_RATING_LABELS,
  formatDate,
  formatTime,
  formatVnd,
} from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function MovieDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const movie = await prisma.movie.findUnique({
    where: { slug },
    include: {
      genres: { include: { genre: true } },
      showtimes: {
        where: {
          startsAt: { gt: new Date() },
          status: "SCHEDULED",
        },
        orderBy: { startsAt: "asc" },
        include: { cinema: true, room: true },
      },
    },
  });

  if (!movie) notFound();

  // group showtimes: date -> cinema -> showtimes
  const byDate = new Map<
    string,
    Map<string, { cinemaName: string; items: typeof movie.showtimes }>
  >();
  for (const st of movie.showtimes) {
    const dateKey = formatDate(st.startsAt);
    if (!byDate.has(dateKey)) byDate.set(dateKey, new Map());
    const cinemaMap = byDate.get(dateKey)!;
    if (!cinemaMap.has(st.cinemaId)) {
      cinemaMap.set(st.cinemaId, { cinemaName: st.cinema.name, items: [] });
    }
    cinemaMap.get(st.cinemaId)!.items.push(st);
  }

  return (
    <div>
      {/* Backdrop hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0">
          <Image
            src={movie.backdropUrl ?? movie.posterUrl}
            alt=""
            fill
            priority
            className="object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/50" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <nav className="text-xs text-muted">
            <Link href="/" className="hover:text-foreground">
              Trang chủ
            </Link>{" "}
            /{" "}
            <Link href="/movies" className="hover:text-foreground">
              Phim
            </Link>{" "}
            / <span className="text-foreground">{movie.title}</span>
          </nav>

          <div className="mt-6 flex flex-col gap-8 md:flex-row">
            <div className="relative mx-auto aspect-[2/3] w-52 shrink-0 overflow-hidden rounded-2xl border border-border shadow-2xl md:mx-0 md:w-72">
              <Image
                src={movie.posterUrl}
                alt={movie.title}
                fill
                priority
                sizes="288px"
                className="object-cover"
              />
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                {movie.status === "NOW_SHOWING" ? (
                  <Badge color="success">Đang chiếu</Badge>
                ) : movie.status === "COMING_SOON" ? (
                  <Badge color="info">Sắp chiếu</Badge>
                ) : (
                  <Badge>Ngừng chiếu</Badge>
                )}
                <Badge color="accent">{movie.ageRating}</Badge>
              </div>
              <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
                {movie.title}
              </h1>
              <p className="mt-2 text-sm text-muted">
                {movie.genres.map((g) => g.genre.name).join(" · ")}
              </p>

              <dl className="mt-6 grid grid-cols-2 gap-x-8 gap-y-3 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-xs uppercase tracking-wider text-muted-dark">
                    Thời lượng
                  </dt>
                  <dd className="mt-0.5 font-medium">{movie.durationMin} phút</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wider text-muted-dark">
                    Khởi chiếu
                  </dt>
                  <dd className="mt-0.5 font-medium">
                    {formatDate(movie.releaseDate)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wider text-muted-dark">
                    Giới hạn tuổi
                  </dt>
                  <dd className="mt-0.5 font-medium">
                    {AGE_RATING_LABELS[movie.ageRating] ?? movie.ageRating}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wider text-muted-dark">
                    Đạo diễn
                  </dt>
                  <dd className="mt-0.5 font-medium">{movie.director}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-xs uppercase tracking-wider text-muted-dark">
                    Diễn viên
                  </dt>
                  <dd className="mt-0.5 font-medium">{movie.cast}</dd>
                </div>
              </dl>

              <p className="mt-6 max-w-3xl leading-relaxed text-muted">
                {movie.description}
              </p>

              {movie.status === "NOW_SHOWING" && movie.showtimes.length > 0 && (
                <a
                  href="#showtimes"
                  className="mt-8 inline-block rounded-xl bg-primary px-8 py-3.5 font-semibold text-white shadow-lg shadow-primary/25 transition-colors hover:bg-primary-hover"
                >
                  Xem lịch chiếu ↓
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Trailer placeholder */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <h2 className="text-xl font-bold">Trailer</h2>
        {movie.trailerUrl ? (
          <div className="mt-4 aspect-video max-w-3xl overflow-hidden rounded-2xl border border-border">
            <iframe
              src={movie.trailerUrl}
              title={`Trailer ${movie.title}`}
              className="h-full w-full"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="mt-4 flex aspect-video max-w-3xl items-center justify-center rounded-2xl border border-dashed border-border bg-surface">
            <div className="text-center">
              <span className="text-5xl">🎞️</span>
              <p className="mt-3 text-sm text-muted">
                Trailer sẽ được cập nhật sớm
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Showtimes */}
      <section id="showtimes" className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <h2 className="text-xl font-bold">Lịch chiếu</h2>
        {byDate.size === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-border bg-surface px-6 py-12 text-center">
            <span className="text-4xl">📅</span>
            <p className="mt-3 font-medium">
              {movie.status === "COMING_SOON"
                ? "Phim chưa mở bán vé"
                : "Hiện chưa có suất chiếu nào"}
            </p>
            <p className="mt-1 text-sm text-muted">
              {movie.status === "COMING_SOON"
                ? `Phim dự kiến khởi chiếu ngày ${formatDate(movie.releaseDate)}. Hãy quay lại sau!`
                : "Vui lòng quay lại sau hoặc chọn phim khác."}
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-8">
            {[...byDate.entries()].map(([dateKey, cinemaMap]) => (
              <div key={dateKey}>
                <h3 className="sticky top-16 z-10 -mx-4 border-y border-border bg-background/95 px-4 py-2.5 text-sm font-bold uppercase tracking-wider text-accent backdrop-blur sm:mx-0 sm:rounded-lg sm:border">
                  📅 {dateKey}
                </h3>
                <div className="mt-4 space-y-5">
                  {[...cinemaMap.values()].map((group) => (
                    <div
                      key={group.cinemaName}
                      className="rounded-2xl border border-border bg-surface p-5"
                    >
                      <h4 className="font-semibold">{group.cinemaName}</h4>
                      <div className="mt-3 flex flex-wrap gap-2.5">
                        {group.items.map((st) => (
                          <Link
                            key={st.id}
                            href={`/booking/${st.id}`}
                            className="group rounded-xl border border-border-light bg-surface-raised px-4 py-2.5 text-center transition-all hover:border-primary hover:bg-primary/10"
                          >
                            <span className="block text-sm font-bold group-hover:text-primary">
                              {formatTime(st.startsAt)}
                            </span>
                            <span className="mt-0.5 block text-[11px] text-muted">
                              {st.format} · {st.room.name} ·{" "}
                              {formatVnd(st.basePrice)}
                            </span>
                          </Link>
                        ))}
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
