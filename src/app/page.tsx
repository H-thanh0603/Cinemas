import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { MovieCard } from "@/components/movies/movie-card";
import { SectionHeading, Badge, EmptyState } from "@/components/ui";
import { formatDate } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [featured, nowShowing, comingSoon, cinemas, promotions, genres] =
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
    ]);

  return (
    <div>
      {/* Hero */}
      {featured && (
        <section className="relative overflow-hidden">
          <div className="absolute inset-0">
            <Image
              src={featured.backdropUrl ?? featured.posterUrl}
              alt=""
              fill
              priority
              className="object-cover opacity-30"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/40" />
          </div>
          <div className="relative mx-auto flex max-w-7xl flex-col gap-8 px-4 py-16 sm:px-6 md:flex-row md:items-center md:py-24">
            <div className="relative mx-auto aspect-[2/3] w-48 shrink-0 overflow-hidden rounded-2xl border border-border shadow-2xl md:mx-0 md:w-64">
              <Image
                src={featured.posterUrl}
                alt={featured.title}
                fill
                priority
                sizes="256px"
                className="object-cover"
              />
            </div>
            <div className="text-center md:text-left">
              <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
                <Badge color="primary">Phim nổi bật</Badge>
                <Badge color="accent">{featured.ageRating}</Badge>
              </div>
              <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">
                {featured.title}
              </h1>
              <p className="mt-2 text-sm text-muted">
                {featured.genres.map((g) => g.genre.name).join(" · ")} ·{" "}
                {featured.durationMin} phút · Khởi chiếu{" "}
                {formatDate(featured.releaseDate)}
              </p>
              <p className="mx-auto mt-4 max-w-2xl text-muted md:mx-0">
                {featured.description.length > 220
                  ? featured.description.slice(0, 220) + "…"
                  : featured.description}
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3 md:justify-start">
                <Link
                  href={`/movies/${featured.slug}#showtimes`}
                  className="rounded-xl bg-primary px-8 py-3.5 font-semibold text-white shadow-lg shadow-primary/25 transition-colors hover:bg-primary-hover"
                >
                  Đặt vé ngay
                </Link>
                <Link
                  href={`/movies/${featured.slug}`}
                  className="rounded-xl border border-border-light bg-surface/60 px-8 py-3.5 font-semibold backdrop-blur transition-colors hover:bg-surface-hover"
                >
                  Xem chi tiết
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Genre navigation */}
      <section className="border-y border-border bg-surface/50">
        <div className="mx-auto max-w-7xl overflow-x-auto px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="shrink-0 text-xs font-semibold uppercase tracking-wider text-muted">
              Thể loại:
            </span>
            {genres.map((g) => (
              <Link
                key={g.id}
                href={`/movies?genre=${g.slug}`}
                className="shrink-0 rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs font-medium text-muted transition-colors hover:border-primary hover:text-foreground"
              >
                {g.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Now Showing */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <SectionHeading
          title="Phim đang chiếu"
          subtitle="Đặt vé ngay cho các suất chiếu hôm nay"
          action={
            <Link
              href="/movies?status=NOW_SHOWING"
              className="text-sm font-semibold text-primary hover:text-primary-hover"
            >
              Xem tất cả →
            </Link>
          }
        />
        {nowShowing.length === 0 ? (
          <EmptyState
            title="Chưa có phim đang chiếu"
            description="Vui lòng quay lại sau."
          />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {nowShowing.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        )}
      </section>

      {/* Coming Soon */}
      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6">
        <SectionHeading
          title="Phim sắp chiếu"
          subtitle="Đừng bỏ lỡ những bom tấn sắp ra mắt"
          action={
            <Link
              href="/movies?status=COMING_SOON"
              className="text-sm font-semibold text-primary hover:text-primary-hover"
            >
              Xem tất cả →
            </Link>
          }
        />
        {comingSoon.length === 0 ? (
          <EmptyState
            title="Chưa có phim sắp chiếu"
            description="Vui lòng quay lại sau."
          />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {comingSoon.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        )}
      </section>

      {/* Cinemas */}
      <section className="border-y border-border bg-surface/40">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <SectionHeading
            title="Hệ thống rạp"
            subtitle="Chọn rạp gần bạn để xem lịch chiếu"
            action={
              <Link
                href="/cinemas"
                className="text-sm font-semibold text-primary hover:text-primary-hover"
              >
                Tất cả rạp →
              </Link>
            }
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cinemas.map((cinema) => (
              <Link
                key={cinema.id}
                href={`/cinemas/${cinema.slug}`}
                className="group rounded-2xl border border-border bg-surface p-6 transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-xl">
                    🏢
                  </span>
                  <div>
                    <h3 className="font-semibold group-hover:text-primary">
                      {cinema.name}
                    </h3>
                    <p className="text-xs text-muted">{cinema.city}</p>
                  </div>
                </div>
                <p className="mt-3 text-sm text-muted">{cinema.address}</p>
                <p className="mt-2 text-xs text-muted-dark">
                  Giờ mở cửa: {cinema.openingHours}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Promotions */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <SectionHeading
          title="Ưu đãi đang diễn ra"
          subtitle="Nhập mã khi thanh toán để nhận ưu đãi"
          action={
            <Link
              href="/promotions"
              className="text-sm font-semibold text-primary hover:text-primary-hover"
            >
              Tất cả ưu đãi →
            </Link>
          }
        />
        {promotions.length === 0 ? (
          <EmptyState
            icon="🎁"
            title="Chưa có ưu đãi nào"
            description="Các chương trình khuyến mãi sẽ sớm quay lại."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {promotions.map((promo) => (
              <div
                key={promo.id}
                className="relative overflow-hidden rounded-2xl border border-accent/20 bg-gradient-to-br from-surface to-surface-raised p-6"
              >
                <span className="absolute -right-4 -top-4 text-7xl opacity-10">
                  🎁
                </span>
                <span className="inline-block rounded-lg border border-dashed border-accent/60 bg-accent/10 px-3 py-1 font-mono text-sm font-bold tracking-wider text-accent">
                  {promo.code}
                </span>
                <p className="mt-3 text-sm text-muted">{promo.description}</p>
                <p className="mt-3 text-xs text-muted-dark">
                  HSD: {formatDate(promo.expiresAt)}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Membership */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <div className="overflow-hidden rounded-3xl border border-border bg-gradient-to-r from-primary/15 via-surface to-accent/10 px-6 py-12 text-center sm:px-12">
          <h2 className="text-2xl font-bold sm:text-3xl">
            Thành viên Cine<span className="text-primary">Star</span>
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted">
            Tích điểm mỗi lần đặt vé, đổi quà, nhận ưu đãi sinh nhật và suất
            chiếu sớm dành riêng cho hội viên. Chương trình thành viên sẽ sớm ra
            mắt.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-border bg-surface/60 p-5">
              <span className="text-3xl">⭐</span>
              <h3 className="mt-2 font-semibold">Tích điểm</h3>
              <p className="mt-1 text-xs text-muted">
                Nhận 1 điểm cho mỗi 10.000đ chi tiêu
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-surface/60 p-5">
              <span className="text-3xl">🎂</span>
              <h3 className="mt-2 font-semibold">Quà sinh nhật</h3>
              <p className="mt-1 text-xs text-muted">
                Vé miễn phí trong tháng sinh nhật
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-surface/60 p-5">
              <span className="text-3xl">🎬</span>
              <h3 className="mt-2 font-semibold">Suất chiếu sớm</h3>
              <p className="mt-1 text-xs text-muted">
                Ưu tiên đặt vé trước ngày công chiếu
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
