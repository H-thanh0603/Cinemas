import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { MovieCard } from "@/components/movies/movie-card";
import { EmptyState } from "@/components/ui";
import { formatDate, formatVnd } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [featured, nowShowing, comingSoon, cinemas, promotions, genres, stats] =
    await Promise.all([
      prisma.movie.findFirst({
        where: { status: "NOW_SHOWING" },
        orderBy: { popularity: "desc" },
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
        prisma.showtime.count({ where: { status: "SCHEDULED", startsAt: { gte: new Date() } } }),
        prisma.booking.count({ where: { status: "CONFIRMED" } }),
      ]).then(([movies, cinemas, showtimes, bookings]) => ({
        movies, cinemas, showtimes, bookings,
      })),
    ]);

  return (
    <div>
      {/* Hero — Cinematic full-bleed */}
      {featured && (
        <section className="relative h-[85vh] min-h-[600px] overflow-hidden">
          <div className="absolute inset-0">
            <Image
              src={featured.backdropUrl ?? featured.posterUrl}
              alt=""
              fill
              priority
              className="animate-hero-zoom object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/20" />
            <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent" />
          </div>

          {/* Glowing orbs */}
          <div className="absolute left-10 top-1/3 h-64 w-64 rounded-full bg-primary/20 blur-[100px] animate-glow" />
          <div className="absolute right-20 bottom-1/4 h-64 w-64 rounded-full bg-accent/10 blur-[100px] animate-glow" />

          <div className="relative mx-auto flex h-full max-w-7xl flex-col justify-end px-4 pb-16 sm:px-6 md:pb-24">
            <div className="max-w-2xl">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-primary px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-primary/30">
                  🔥 Phim nổi bật
                </span>
                <span className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs font-bold text-accent backdrop-blur">
                  {featured.ageRating}
                </span>
                <span className="rounded-full border border-border-light bg-surface/60 px-3 py-1.5 text-xs font-medium text-muted backdrop-blur">
                  {featured.genres.map((g) => g.genre.name).join(" · ")}
                </span>
              </div>
              <h1 className="text-4xl font-black leading-tight tracking-tight drop-shadow-2xl sm:text-5xl md:text-6xl">
                {featured.title}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted">
                <span className="flex items-center gap-1.5">
                  <span className="text-accent">⏱</span> {featured.durationMin} phút
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="text-accent">📅</span> Khởi chiếu {formatDate(featured.releaseDate)}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="text-accent">🎬</span> {featured.director}
                </span>
              </div>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-muted line-clamp-3">
                {featured.description}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={`/movies/${featured.slug}#showtimes`}
                  className="group flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 font-bold text-white shadow-xl shadow-primary/30 transition-all hover:bg-primary-hover hover:shadow-primary/40"
                >
                  🎫 Đặt vé ngay
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </Link>
                <Link
                  href={`/movies/${featured.slug}`}
                  className="flex items-center gap-2 rounded-xl border border-border-light bg-surface/60 px-8 py-3.5 font-bold backdrop-blur transition-all hover:bg-surface-hover"
                >
                  ▶ Xem chi tiết
                </Link>
              </div>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-float">
            <div className="flex h-10 w-6 items-start justify-center rounded-full border-2 border-muted/40 p-1.5">
              <div className="h-2 w-1 rounded-full bg-muted/60" />
            </div>
          </div>
        </section>
      )}

      {/* Stats bar */}
      <section className="border-y border-border bg-surface/50 backdrop-blur">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-border sm:grid-cols-4">
          {[
            { icon: "🎬", value: stats.movies, label: "Phim đang chiếu" },
            { icon: "🏢", value: stats.cinemas, label: "Rạp trên toàn quốc" },
            { icon: "🕐", value: stats.showtimes, label: "Suất chiếu hôm nay" },
            { icon: "🎫", value: stats.bookings, label: "Vé đã đặt" },
          ].map((s, i) => (
            <div key={i} className="flex flex-col items-center gap-1 px-4 py-5 text-center">
              <span className="text-2xl">{s.icon}</span>
              <span className="text-xl font-extrabold tabular-nums text-foreground sm:text-2xl">{s.value}</span>
              <span className="text-xs text-muted">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Genre navigation */}
      <section className="border-b border-border bg-surface/30">
        <div className="mx-auto max-w-7xl overflow-x-auto px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="shrink-0 text-xs font-bold uppercase tracking-wider text-primary">
              Thể loại:
            </span>
            {genres.map((g) => (
              <Link
                key={g.id}
                href={`/movies?genre=${g.slug}`}
                className="shrink-0 rounded-full border border-border bg-surface px-4 py-1.5 text-xs font-medium text-muted transition-all hover:border-primary hover:bg-primary/10 hover:text-primary"
              >
                {g.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Now Showing */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="h-6 w-1.5 rounded-full bg-primary" />
              <span className="text-xs font-bold uppercase tracking-wider text-primary">Đang chiếu</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Phim đang chiếu
            </h2>
            <p className="mt-1 text-sm text-muted">Đặt vé ngay cho các suất chiếu hôm nay</p>
          </div>
          <Link
            href="/movies?status=NOW_SHOWING"
            className="group flex items-center gap-1 text-sm font-semibold text-primary transition-colors hover:text-primary-hover"
          >
            Xem tất cả
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
        </div>
        {nowShowing.length === 0 ? (
          <EmptyState title="Chưa có phim đang chiếu" description="Vui lòng quay lại sau." />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {nowShowing.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        )}
      </section>

      {/* Coming Soon — with backdrop banner */}
      <section className="relative overflow-hidden border-y border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-surface to-accent/5" />
        <div className="absolute -right-20 top-0 h-72 w-72 rounded-full bg-primary/10 blur-[120px]" />
        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="h-6 w-1.5 rounded-full bg-accent" />
                <span className="text-xs font-bold uppercase tracking-wider text-accent">Sắp chiếu</span>
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                Phim sắp chiếu
              </h2>
              <p className="mt-1 text-sm text-muted">Đừng bỏ lỡ những bom tấn sắp ra mắt</p>
            </div>
            <Link
              href="/movies?status=COMING_SOON"
              className="group flex items-center gap-1 text-sm font-semibold text-accent transition-colors hover:text-accent-hover"
            >
              Xem tất cả
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
          </div>
          {comingSoon.length === 0 ? (
            <EmptyState title="Chưa có phim sắp chiếu" description="Vui lòng quay lại sau." />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {comingSoon.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Cinemas */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="h-6 w-1.5 rounded-full bg-info" />
              <span className="text-xs font-bold uppercase tracking-wider text-info">Hệ thống</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Hệ thống rạp
            </h2>
            <p className="mt-1 text-sm text-muted">Chọn rạp gần bạn để xem lịch chiếu</p>
          </div>
          <Link
            href="/cinemas"
            className="group flex items-center gap-1 text-sm font-semibold text-info transition-colors hover:text-info/80"
          >
            Tất cả rạp
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cinemas.map((cinema) => (
            <Link
              key={cinema.id}
              href={`/cinemas/${cinema.slug}`}
              className="group relative overflow-hidden rounded-2xl border border-border bg-surface p-6 transition-all hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5"
            >
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/5 transition-transform group-hover:scale-150" />
              <div className="relative flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-2xl transition-transform group-hover:scale-110">
                  🏢
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold group-hover:text-primary">{cinema.name}</h3>
                  <p className="mt-0.5 text-xs font-medium text-accent">{cinema.city}</p>
                  <p className="mt-2 text-sm text-muted line-clamp-2">{cinema.address}</p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-muted-dark">
                    <span>🕐</span>
                    <span>{cinema.openingHours}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Promotions */}
      <section className="border-y border-border bg-surface/40">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="h-6 w-1.5 rounded-full bg-accent" />
                <span className="text-xs font-bold uppercase tracking-wider text-accent">Ưu đãi</span>
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                Ưu đãi đang diễn ra
              </h2>
              <p className="mt-1 text-sm text-muted">Nhập mã khi thanh toán để nhận ưu đãi</p>
            </div>
            <Link
              href="/promotions"
              className="group flex items-center gap-1 text-sm font-semibold text-accent transition-colors hover:text-accent-hover"
            >
              Tất cả ưu đãi
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
          </div>
          {promotions.length === 0 ? (
            <EmptyState icon="🎁" title="Chưa có ưu đãi nào" description="Các chương trình khuyến mãi sẽ sớm quay lại." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {promotions.map((promo) => (
                <div
                  key={promo.id}
                  className="group relative overflow-hidden rounded-2xl border border-accent/20 bg-gradient-to-br from-surface to-surface-raised p-6 transition-all hover:border-accent/40 hover:shadow-lg hover:shadow-accent/5"
                >
                  <span className="absolute -right-4 -top-4 text-7xl opacity-10 transition-transform group-hover:scale-110">
                    🎁
                  </span>
                  <div className="relative">
                    <span className="inline-block rounded-lg border border-dashed border-accent/60 bg-accent/10 px-3 py-1 font-mono text-sm font-bold tracking-wider text-accent">
                      {promo.code}
                    </span>
                    <p className="mt-3 text-sm text-muted">{promo.description}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs text-muted-dark">
                        HSD: {formatDate(promo.expiresAt)}
                      </span>
                      <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-bold text-accent">
                        {promo.discountType === "PERCENT" ? `Giảm ${promo.discountValue}%` : `Giảm ${formatVnd(promo.discountValue)}`}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Membership CTA */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-r from-primary/15 via-surface to-accent/10 px-6 py-14 text-center sm:px-12">
          <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-[100px] animate-glow" />
          <div className="absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-accent/10 blur-[100px] animate-glow" />
          <div className="relative">
            <span className="text-4xl">👑</span>
            <h2 className="mt-4 text-3xl font-extrabold sm:text-4xl">
              Thành viên <span className="text-gradient">CineStar</span>
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-muted">
              Tích điểm mỗi lần đặt vé, đổi quà, nhận ưu đãi sinh nhật và suất
              chiếu sớm dành riêng cho hội viên.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="group rounded-2xl border border-border bg-surface/60 p-6 text-left transition-all hover:border-primary/30 hover:bg-surface-raised">
                <span className="text-3xl transition-transform group-hover:scale-110">⭐</span>
                <h3 className="mt-3 font-bold">Tích điểm</h3>
                <p className="mt-1 text-xs text-muted">
                  Nhận 1 điểm cho mỗi 10.000đ chi tiêu
                </p>
              </div>
              <div className="group rounded-2xl border border-border bg-surface/60 p-6 text-left transition-all hover:border-accent/30 hover:bg-surface-raised">
                <span className="text-3xl transition-transform group-hover:scale-110">🎂</span>
                <h3 className="mt-3 font-bold">Quà sinh nhật</h3>
                <p className="mt-1 text-xs text-muted">
                  Vé miễn phí trong tháng sinh nhật
                </p>
              </div>
              <div className="group rounded-2xl border border-border bg-surface/60 p-6 text-left transition-all hover:border-info/30 hover:bg-surface-raised">
                <span className="text-3xl transition-transform group-hover:scale-110">🎬</span>
                <h3 className="mt-3 font-bold">Suất chiếu sớm</h3>
                <p className="mt-1 text-xs text-muted">
                  Ưu tiên đặt vé trước ngày công chiếu
                </p>
              </div>
            </div>
            <Link
              href="/movies?status=NOW_SHOWING"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 font-bold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary-hover"
            >
              Bắt đầu đặt vé →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
