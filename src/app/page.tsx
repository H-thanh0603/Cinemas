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

// Catalog: đổi hiếm — ISR 60s đủ tươi, cắt tải DB mỗi render.
// ponytail: xóa dynamic → revalidate khi có admin-trigger revalidation.
export const revalidate = 60;

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

      {/* ── Stats Bar ── */}
      <section className="border-y border-border/40 bg-surface/40 backdrop-blur-sm">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-border/30 sm:grid-cols-4">
          {[
            { icon: Film, value: stats.movies, label: "Phim đang chiếu" },
            { icon: Building2, value: stats.cinemas, label: "Rạp toàn quốc" },
            { icon: Clock3, value: stats.showtimes, label: "Suất sắp tới" },
            { icon: Ticket, value: stats.bookings, label: "Vé đã xác nhận" },
          ].map((s, i) => (
            <div
              key={i}
              className="group flex flex-col items-center gap-2 px-4 py-8 text-center transition-all duration-300 hover:bg-surface-raised/30"
            >
              <s.icon className="h-5 w-5 text-primary-light transition-transform duration-300 group-hover:scale-110" />
              <CountUp
                value={s.value}
                className="font-display text-2xl font-extrabold tabular-nums sm:text-3xl"
              />
              <span className="text-xs text-muted">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Genres ── */}
      <section className="border-b border-border/30 bg-surface/15">
        <div className="mx-auto max-w-7xl overflow-x-auto px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="shrink-0 text-[11px] font-bold uppercase tracking-wider text-primary">
              Thể loại
            </span>
            {genres.map((g) => (
              <Link
                key={g.id}
                href={`/movies?genre=${g.slug}`}
                className="shrink-0 rounded-full border border-border/50 bg-surface px-4 py-1.5 text-xs font-medium text-muted transition-all duration-300 hover:border-primary/30 hover:bg-primary/8 hover:text-primary"
              >
                {g.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Now Showing ── */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <Reveal>
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="mb-3 flex items-center gap-2.5">
                <span className="h-7 w-1.5 rounded-full bg-gradient-to-b from-primary to-primary-dark shadow-[0_0_12px_rgba(0,255,135,0.5)]" />
                <span className="text-xs font-bold uppercase tracking-widest text-primary">
                  Đang chiếu
                </span>
              </div>
              <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
                Phim đang chiếu
              </h2>
              <p className="mt-2 text-sm text-muted">
                Đặt vé ngay cho các suất chiếu hôm nay
              </p>
            </div>
            <Link
              href="/movies?status=NOW_SHOWING"
              className="group inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors duration-300 hover:text-primary-hover"
            >
              Xem tất cả
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </Reveal>
        {nowShowing.length === 0 ? (
          <EmptyState title="Chưa có phim đang chiếu" description="Vui lòng quay lại sau." />
        ) : (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
            {nowShowing.map((movie, i) => (
              <MovieCard key={movie.id} movie={movie} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* ── Coming Soon ── */}
      <section className="relative overflow-hidden border-y border-border/30">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-surface to-accent/3" />
        <div className="absolute -right-24 top-0 h-96 w-96 rounded-full bg-primary/8 blur-[140px] animate-glow" />
        <div className="absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-accent/5 blur-[120px] animate-glow" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <Reveal>
            <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="mb-3 flex items-center gap-2.5">
                  <span className="h-7 w-1.5 rounded-full bg-gradient-to-b from-accent to-primary-dark" />
                  <span className="text-xs font-bold uppercase tracking-widest text-accent">
                    Sắp chiếu
                  </span>
                </div>
                <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
                  Phim sắp chiếu
                </h2>
                <p className="mt-2 text-sm text-muted">
                  Đừng bỏ lỡ những bom tấn sắp ra mắt
                </p>
              </div>
              <Link
                href="/movies?status=COMING_SOON"
                className="group inline-flex items-center gap-1.5 text-sm font-semibold text-accent transition-colors duration-300 hover:text-accent-hover"
              >
                Xem tất cả
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
          </Reveal>
          {comingSoon.length === 0 ? (
            <EmptyState title="Chưa có phim sắp chiếu" description="Vui lòng quay lại sau." />
          ) : (
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
              {comingSoon.map((movie, i) => (
                <MovieCard key={movie.id} movie={movie} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Cinemas ── */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <Reveal>
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="mb-3 flex items-center gap-2.5">
                <span className="h-7 w-1.5 rounded-full bg-gradient-to-b from-info to-blue-400" />
                <span className="text-xs font-bold uppercase tracking-widest text-info">
                  Hệ thống
                </span>
              </div>
              <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
                Hệ thống rạp
              </h2>
              <p className="mt-2 text-sm text-muted">Chọn rạp gần bạn để xem lịch chiếu</p>
            </div>
            <Link
              href="/cinemas"
              className="group inline-flex items-center gap-1.5 text-sm font-semibold text-info transition-colors duration-300 hover:text-blue-400"
            >
              Tất cả rạp
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </Reveal>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {cinemas.map((cinema, i) => (
            <Reveal key={cinema.id} delay={i * 0.06}>
              <Link
                href={`/cinemas/${cinema.slug}`}
                className="group relative block overflow-hidden rounded-2xl border border-border/50 bg-surface p-7 transition-all duration-400 hover:border-primary/25 hover:shadow-xl hover:shadow-primary/5 hover-lift"
              >
                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/5 transition-transform duration-600 group-hover:scale-150" />
                <div className="relative flex items-start gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/15">
                    <Building2 className="h-6 w-6" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display font-bold transition-colors duration-300 group-hover:text-primary">
                      {cinema.name}
                    </h3>
                    <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-accent">
                      <MapPin className="h-3 w-3" />
                      {cinema.city}
                    </p>
                    <p className="mt-2.5 text-sm text-muted line-clamp-2">{cinema.address}</p>
                    <div className="mt-3.5 flex items-center gap-2 text-xs text-muted-dark">
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

      {/* ── Promotions ── */}
      <section className="border-y border-border/30 bg-surface/25">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <Reveal>
            <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="mb-3 flex items-center gap-2.5">
                  <span className="h-7 w-1.5 rounded-full bg-gradient-to-b from-accent to-primary-dark" />
                  <span className="text-xs font-bold uppercase tracking-widest text-accent">
                    Ưu đãi
                  </span>
                </div>
                <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
                  Ưu đãi đang diễn ra
                </h2>
                <p className="mt-2 text-sm text-muted">
                  Nhập mã khi thanh toán để nhận ưu đãi
                </p>
              </div>
              <Link
                href="/promotions"
                className="group inline-flex items-center gap-1.5 text-sm font-semibold text-accent transition-colors duration-300 hover:text-accent-hover"
              >
                Tất cả ưu đãi
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
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
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {promotions.map((promo, i) => (
                <Reveal key={promo.id} delay={i * 0.08}>
                  <div className="shine-border group relative overflow-hidden rounded-2xl border border-accent/15 bg-gradient-to-br from-surface to-surface-raised p-7 transition-all duration-400 hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5">
                    <span className="absolute -right-3 -top-3 text-7xl opacity-[0.05] transition-transform duration-500 group-hover:scale-110">
                      %
                    </span>
                    <span className="inline-block rounded-lg border border-dashed border-accent/50 bg-accent/8 px-3.5 py-1.5 font-mono text-sm font-bold tracking-wider text-accent">
                      {promo.code}
                    </span>
                    <p className="mt-4 text-sm text-muted leading-relaxed">{promo.description}</p>
                    <div className="mt-5 flex items-center justify-between">
                      <span className="text-xs text-muted-dark">
                        HSD: {formatDate(promo.expiresAt)}
                      </span>
                      <span className="rounded-full bg-accent/8 px-3.5 py-1.5 text-xs font-bold text-accent">
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

      {/* ── Membership CTA ── */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] border border-border/40 bg-gradient-to-r from-primary/12 via-surface to-accent/8 px-6 py-20 text-center sm:px-14">
            <div className="absolute -left-28 -top-28 h-80 w-80 rounded-full bg-primary/10 blur-[120px] animate-glow" />
            <div className="absolute -bottom-28 -right-28 h-80 w-80 rounded-full bg-accent/8 blur-[120px] animate-glow" />
            <div className="relative">
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                <Crown className="h-7 w-7" />
              </span>
              <h2 className="mt-6 font-display text-3xl font-extrabold sm:text-4xl">
                Thành viên <span className="text-gradient">CineStar</span>
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted">
                Tích điểm mỗi lần đặt vé, đổi quà, nhận ưu đãi sinh nhật và suất
                chiếu sớm dành riêng cho hội viên.
              </p>
              <div className="mt-12 grid gap-5 sm:grid-cols-3">
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
                    className="group rounded-2xl border border-border/40 bg-surface/50 p-7 text-left backdrop-blur-sm transition-all duration-400 hover:border-primary/25 hover:bg-surface-raised/60 hover-lift"
                  >
                    <item.icon className="h-7 w-7 text-primary-light transition-transform duration-300 group-hover:scale-110" />
                    <h3 className="mt-4 font-display font-bold">{item.title}</h3>
                    <p className="mt-1.5 text-xs text-muted leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
              <Link
                href="/movies?status=NOW_SHOWING"
                className="btn-sheen mt-12 inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-primary to-primary-dark px-9 py-4 font-bold text-on-primary shadow-xl shadow-primary/20 transition-all duration-300 hover:shadow-primary/35 hover:scale-[1.02]"
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
