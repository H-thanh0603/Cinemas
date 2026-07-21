import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { MovieCard } from "@/components/movies/movie-card";
import { EmptyState } from "@/components/ui";
import { formatDate, formatVnd } from "@/lib/constants";
import { HeroCarousel } from "@/components/home/hero-carousel";
import { Reveal } from "@/components/ui/reveal";
import { CountUp } from "@/components/ui/count-up";
import {
  Film,
  Building2,
  Clock3,
  Ticket,
  ArrowRight,
  MapPin,
  Star,
  Cake,
  Clapperboard,
  Crown,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [featuredList, nowShowing, comingSoon, cinemas, promotions, genres, stats] =
    await Promise.all([
      prisma.movie.findMany({
        where: { status: "NOW_SHOWING" },
        orderBy: { popularity: "desc" },
        take: 5,
        include: { genres: { include: { genre: true } } },
      }),
      prisma.movie.findMany({
        where: { status: "NOW_SHOWING" },
        orderBy: { popularity: "desc" },
        take: 10,
        include: { genres: { include: { genre: true } } },
      }),
      prisma.movie.findMany({
        where: { status: "COMING_SOON" },
        orderBy: { releaseDate: "asc" },
        take: 5,
        include: { genres: { include: { genre: true } } },
      }),
      prisma.cinema.findMany({ where: { isActive: true } }),
      prisma.promotion.findMany({
        where: { isActive: true, expiresAt: { gt: new Date() } },
        take: 3,
      }),
      prisma.genre.findMany({ orderBy: { name: "asc" } }),
      Promise.all([
        prisma.movie.count({ where: { status: "NOW_SHOWING" } }),
        prisma.cinema.count({ where: { isActive: true } }),
        prisma.showtime.count({
          where: { status: "SCHEDULED", startsAt: { gte: new Date() } },
        }),
        prisma.booking.count({ where: { status: "CONFIRMED" } }),
      ]).then(([movies, cinemasCount, showtimes, bookings]) => ({
        movies,
        cinemas: cinemasCount,
        showtimes,
        bookings,
      })),
    ]);

  const heroSlides = featuredList.map((m) => ({
    slug: m.slug,
    title: m.title,
    description: m.description,
    posterUrl: m.posterUrl,
    backdropUrl: m.backdropUrl,
    durationMin: m.durationMin,
    ageRating: m.ageRating,
    director: m.director,
    releaseDate: m.releaseDate,
    genres: m.genres,
  }));

  return (
    <div>
      {heroSlides.length > 0 && <HeroCarousel slides={heroSlides} />}

      {/* Stats */}
      <section className="border-y border-border bg-surface/60 backdrop-blur">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-border sm:grid-cols-4">
          {[
            { icon: Film, value: stats.movies, label: "Phim đang chiếu" },
            { icon: Building2, value: stats.cinemas, label: "Rạp toàn quốc" },
            { icon: Clock3, value: stats.showtimes, label: "Suất sắp tới" },
            { icon: Ticket, value: stats.bookings, label: "Vé đã xác nhận" },
          ].map((s, i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-1.5 px-4 py-6 text-center transition hover:bg-surface-raised/40"
            >
              <s.icon className="h-5 w-5 text-primary" />
              <CountUp
                value={s.value}
                className="font-display text-2xl font-extrabold tabular-nums sm:text-3xl"
              />
              <span className="text-xs text-muted">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Genres */}
      <section className="border-b border-border bg-surface/25">
        <div className="mx-auto max-w-7xl overflow-x-auto px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="shrink-0 text-[11px] font-bold uppercase tracking-wider text-primary">
              Thể loại
            </span>
            {genres.map((g) => (
              <Link
                key={g.id}
                href={`/movies?genre=${g.slug}`}
                className="shrink-0 rounded-full border border-border bg-surface px-4 py-1.5 text-xs font-medium text-muted transition-all hover:border-primary hover:bg-primary/10 hover:text-primary hover:shadow-md hover:shadow-primary/10"
              >
                {g.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Now showing */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <Reveal>
          <div className="mb-9 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="h-6 w-1.5 rounded-full bg-primary shadow-[0_0_12px_rgba(229,9,20,0.7)]" />
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  Đang chiếu
                </span>
              </div>
              <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
                Phim đang chiếu
              </h2>
              <p className="mt-1.5 text-sm text-muted">
                Đặt vé ngay cho các suất chiếu hôm nay
              </p>
            </div>
            <Link
              href="/movies?status=NOW_SHOWING"
              className="group inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-hover"
            >
              Xem tất cả
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </Reveal>
        {nowShowing.length === 0 ? (
          <EmptyState title="Chưa có phim đang chiếu" description="Vui lòng quay lại sau." />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {nowShowing.map((movie, i) => (
              <MovieCard key={movie.id} movie={movie} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* Coming soon */}
      <section className="relative overflow-hidden border-y border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-surface to-accent/5" />
        <div className="absolute -right-24 top-0 h-80 w-80 rounded-full bg-primary/15 blur-[120px] animate-glow" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <Reveal>
            <div className="mb-9 flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="h-6 w-1.5 rounded-full bg-accent" />
                  <span className="text-xs font-bold uppercase tracking-wider text-accent">
                    Sắp chiếu
                  </span>
                </div>
                <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
                  Phim sắp chiếu
                </h2>
                <p className="mt-1.5 text-sm text-muted">
                  Đừng bỏ lỡ những bom tấn sắp ra mắt
                </p>
              </div>
              <Link
                href="/movies?status=COMING_SOON"
                className="group inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:text-accent-hover"
              >
                Xem tất cả
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </Reveal>
          {comingSoon.length === 0 ? (
            <EmptyState title="Chưa có phim sắp chiếu" description="Vui lòng quay lại sau." />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {comingSoon.map((movie, i) => (
                <MovieCard key={movie.id} movie={movie} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Cinemas */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <Reveal>
          <div className="mb-9 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="h-6 w-1.5 rounded-full bg-info" />
                <span className="text-xs font-bold uppercase tracking-wider text-info">
                  Hệ thống
                </span>
              </div>
              <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
                Hệ thống rạp
              </h2>
              <p className="mt-1.5 text-sm text-muted">Chọn rạp gần bạn để xem lịch chiếu</p>
            </div>
            <Link
              href="/cinemas"
              className="group inline-flex items-center gap-1.5 text-sm font-semibold text-info"
            >
              Tất cả rạp
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </Reveal>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cinemas.map((cinema, i) => (
            <Reveal key={cinema.id} delay={i * 0.06}>
              <Link
                href={`/cinemas/${cinema.slug}`}
                className="group relative block overflow-hidden rounded-2xl border border-border bg-surface p-6 transition-all hover:border-primary/45 hover:shadow-xl hover:shadow-primary/10"
              >
                <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-primary/10 transition-transform duration-500 group-hover:scale-150" />
                <div className="relative flex items-start gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary transition-transform group-hover:scale-110">
                    <Building2 className="h-6 w-6" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display font-bold transition group-hover:text-primary">
                      {cinema.name}
                    </h3>
                    <p className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-accent">
                      <MapPin className="h-3 w-3" />
                      {cinema.city}
                    </p>
                    <p className="mt-2 text-sm text-muted line-clamp-2">{cinema.address}</p>
                    <div className="mt-3 flex items-center gap-2 text-xs text-muted-dark">
                      <Clock3 className="h-3.5 w-3.5" />
                      <span>{cinema.openingHours}</span>
                    </div>
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Promotions */}
      <section className="border-y border-border bg-surface/40">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <Reveal>
            <div className="mb-9 flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="h-6 w-1.5 rounded-full bg-accent" />
                  <span className="text-xs font-bold uppercase tracking-wider text-accent">
                    Ưu đãi
                  </span>
                </div>
                <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
                  Ưu đãi đang diễn ra
                </h2>
                <p className="mt-1.5 text-sm text-muted">
                  Nhập mã khi thanh toán để nhận ưu đãi
                </p>
              </div>
              <Link
                href="/promotions"
                className="group inline-flex items-center gap-1.5 text-sm font-semibold text-accent"
              >
                Tất cả ưu đãi
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </Reveal>
          {promotions.length === 0 ? (
            <EmptyState
              icon="🎁"
              title="Chưa có ưu đãi nào"
              description="Các chương trình khuyến mãi sẽ sớm quay lại."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {promotions.map((promo, i) => (
                <Reveal key={promo.id} delay={i * 0.08}>
                  <div className="shine-border group relative overflow-hidden rounded-2xl border border-accent/20 bg-gradient-to-br from-surface to-surface-raised p-6 transition hover:border-accent/45 hover:shadow-lg hover:shadow-accent/10">
                    <span className="absolute -right-3 -top-3 text-6xl opacity-[0.07] transition group-hover:scale-110">
                      %
                    </span>
                    <span className="inline-block rounded-lg border border-dashed border-accent/60 bg-accent/10 px-3 py-1 font-mono text-sm font-bold tracking-wider text-accent">
                      {promo.code}
                    </span>
                    <p className="mt-3 text-sm text-muted">{promo.description}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs text-muted-dark">
                        HSD: {formatDate(promo.expiresAt)}
                      </span>
                      <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-bold text-accent">
                        {promo.discountType === "PERCENT"
                          ? `Giảm ${promo.discountValue}%`
                          : `Giảm ${formatVnd(promo.discountValue)}`}
                      </span>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Membership CTA */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] border border-border bg-gradient-to-r from-primary/20 via-surface to-accent/15 px-6 py-16 text-center sm:px-12">
            <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-primary/20 blur-[100px] animate-glow" />
            <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-accent/15 blur-[100px] animate-glow" />
            <div className="relative">
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15 text-accent">
                <Crown className="h-7 w-7" />
              </span>
              <h2 className="mt-5 font-display text-3xl font-extrabold sm:text-4xl">
                Thành viên <span className="text-gradient">CineStar</span>
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted">
                Tích điểm mỗi lần đặt vé, đổi quà, nhận ưu đãi sinh nhật và suất
                chiếu sớm dành riêng cho hội viên.
              </p>
              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {[
                  {
                    icon: Star,
                    title: "Tích điểm",
                    desc: "Nhận 1 điểm cho mỗi 10.000đ chi tiêu",
                  },
                  {
                    icon: Cake,
                    title: "Quà sinh nhật",
                    desc: "Vé miễn phí trong tháng sinh nhật",
                  },
                  {
                    icon: Clapperboard,
                    title: "Suất chiếu sớm",
                    desc: "Ưu tiên đặt vé trước ngày công chiếu",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="group rounded-2xl border border-border bg-surface/70 p-6 text-left backdrop-blur transition hover:border-primary/35 hover:bg-surface-raised"
                  >
                    <item.icon className="h-7 w-7 text-primary transition group-hover:scale-110" />
                    <h3 className="mt-3 font-display font-bold">{item.title}</h3>
                    <p className="mt-1 text-xs text-muted">{item.desc}</p>
                  </div>
                ))}
              </div>
              <Link
                href="/movies?status=NOW_SHOWING"
                className="mt-10 inline-flex items-center gap-2 rounded-2xl bg-primary px-8 py-3.5 font-bold text-white shadow-lg shadow-primary/30 transition hover:bg-primary-hover"
              >
                Bắt đầu đặt vé
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
