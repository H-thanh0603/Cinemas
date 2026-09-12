import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { getTmdbImageUrl } from "@/lib/tmdb-image";
import { PosterImage } from "@/components/ui/poster-image";
import { ShowtimeSection } from "@/components/movies/showtime-section";
import {
  AGE_RATING_LABELS,
  formatDate,
} from "@/lib/constants";

// Catalog detail — ISR 60s (movie + showtime thay đổi hiếm)
export const revalidate = 60;

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

  // JSON-LD schema.org — Movie schema cho cả Google lẫn AI agent
  // hiểu cấu trúc dữ liệu phim (lớp "web xây cho cả người lẫn AI đọc").
  const appUrl = process.env.APP_URL ?? "https://cinemas-khaki.vercel.app";
  const movieJsonLd = {
    "@context": "https://schema.org",
    "@type": "Movie",
    name: movie.title,
    description: movie.description,
    image: movie.posterUrl,
    genre: movie.genres.map((g) => g.genre.name),
    director: { "@type": "Person", name: movie.director },
    duration: `PT${movie.durationMin}M`,
    datePublished: movie.releaseDate.toISOString(),
    actor: movie.cast
      .split(",")
      .map((n) => ({ "@type": "Person", name: n.trim() })),
    url: `${appUrl}/movies/${movie.slug}`,
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(movieJsonLd) }}
      />
      {/* Breadcrumbs */}
      <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6">
        <Breadcrumbs items={[
          { label: "Trang chủ", href: "/" },
          { label: "Phim", href: "/movies" },
          { label: movie.title },
        ]} />
      </div>
      {/* Backdrop hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 pointer-events-none">
          <PosterImage
            src={getTmdbImageUrl(movie.backdropUrl ?? movie.posterUrl, "hero")}
            alt={movie.title}
            fill
            priority
            quality={95}
            className="opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/50" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <div className="mt-2 flex flex-col gap-8 md:flex-row">
            <div className="relative mx-auto aspect-[2/3] w-52 shrink-0 overflow-hidden rounded-2xl border border-border shadow-2xl md:mx-0 md:w-72">
              <PosterImage
                src={getTmdbImageUrl(movie.posterUrl, "card")}
                alt={movie.title}
                fill
                priority
                sizes="(max-width: 768px) 208px, 288px"
                quality={95}
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
                  className="mt-8 inline-block rounded-xl bg-primary px-8 py-3.5 font-semibold text-on-primary shadow-lg shadow-primary/25 transition-colors hover:bg-primary-hover"
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
      <section id="showtimes" className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <h2 className="text-xl font-bold">Lịch chiếu</h2>
        <div className="mt-5">
          <ShowtimeSection
            showtimes={movie.showtimes.map((st) => ({
              ...st,
              startsAt: st.startsAt.toISOString(),
            }))}
            status={movie.status}
            releaseDate={movie.releaseDate.toISOString()}
          />
        </div>
      </section>
    </div>
  );
}
