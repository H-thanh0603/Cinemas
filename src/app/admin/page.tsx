import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatVnd, formatDateTime, MOVIE_STATUS_LABELS } from "@/lib/constants";
import { AnimatedStats } from "./animated-stats";
import { RevenueChart } from "@/components/admin/revenue-chart";

export const dynamic = "force-dynamic";

async function getStats() {
  const [
    movieCount,
    nowShowingCount,
    cinemaCount,
    roomCount,
    showtimeCount,
    bookingCount,
    confirmedBookingCount,
    activePromoCount,
    revenue,
    recentBookings,
    upcomingShowtimes,
    topMovies,
    last7DaysRevenue,
  ] = await Promise.all([
    prisma.movie.count(),
    prisma.movie.count({ where: { status: "NOW_SHOWING" } }),
    prisma.cinema.count(),
    prisma.room.count(),
    prisma.showtime.count(),
    prisma.booking.count(),
    prisma.booking.count({ where: { status: "CONFIRMED" } }),
    prisma.promotion.count({ where: { isActive: true, expiresAt: { gte: new Date() } } }),
    prisma.payment.aggregate({
      where: { status: "PAID" },
      _sum: { amount: true },
    }),
    prisma.booking.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: {
        showtime: { include: { movie: true, room: { include: { cinema: true } } } },
        payment: true,
      },
    }),
    prisma.showtime.findMany({
      take: 6,
      where: { startsAt: { gte: new Date() }, status: "SCHEDULED" },
      orderBy: { startsAt: "asc" },
      include: { movie: true, room: { include: { cinema: true } } },
    }),
    prisma.movie.findMany({
      take: 5,
      orderBy: { popularity: "desc" },
      include: { _count: { select: { showtimes: true } } },
    }),
    Promise.all(
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        const end = new Date(start);
        end.setDate(end.getDate() + 1);
        return prisma.payment
          .aggregate({
            where: { status: "PAID", paidAt: { gte: start, lt: end } },
            _sum: { amount: true },
          })
          .then((r) => ({
            date: start,
            label: new Intl.DateTimeFormat("vi-VN", { weekday: "short" }).format(start),
            amount: r._sum.amount ?? 0,
          }));
      })
    ),
  ]);

  return {
    movieCount,
    nowShowingCount,
    cinemaCount,
    roomCount,
    showtimeCount,
    bookingCount,
    confirmedBookingCount,
    activePromoCount,
    revenue: revenue._sum.amount ?? 0,
    recentBookings,
    upcomingShowtimes,
    topMovies,
    last7DaysRevenue,
  };
}

export default async function AdminOverviewPage() {
  const stats = await getStats();

  const statCards = [
    { key: "movieCount", subKey: "nowShowingCount", label: "Phim", subLabel: "đang chiếu", icon: "🎬", href: "/admin/movies", color: "from-red-500/20 to-red-500/5", iconBg: "bg-red-500/20" },
    { key: "cinemaCount", subKey: "roomCount", label: "Rạp", subLabel: "phòng chiếu", icon: "🏢", href: "/admin/cinemas", color: "from-blue-500/20 to-blue-500/5", iconBg: "bg-blue-500/20" },
    { key: "showtimeCount", label: "Suất chiếu", subLabel: "tổng", icon: "🕐", href: "/admin/showtimes", color: "from-purple-500/20 to-purple-500/5", iconBg: "bg-purple-500/20" },
    { key: "bookingCount", subKey: "confirmedBookingCount", label: "Đặt vé", subLabel: "đã xác nhận", icon: "🎫", href: "/admin/bookings", color: "from-green-500/20 to-green-500/5", iconBg: "bg-green-500/20" },
    { key: "activePromoCount", label: "Khuyến mãi", subLabel: "đang hoạt động", icon: "🎁", href: "/admin/promotions", color: "from-yellow-500/20 to-yellow-500/5", iconBg: "bg-yellow-500/20" },
  ] as const;

  return (
    <div className="space-y-6 animate-stagger">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/15 via-surface to-accent/10 p-6 sm:p-8">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-accent/10 blur-3xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold sm:text-3xl">
              Chào mừng đến <span className="text-gradient">CineStar Admin</span>
            </h1>
            <p className="mt-1 text-sm text-muted">
              Quản lý hệ thống rạp chiếu phim — tổng quan và hoạt động gần đây
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/admin/movies/new"
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary-hover hover:shadow-primary/30"
            >
              + Thêm phim
            </Link>
            <Link
              href="/admin/showtimes/new"
              className="rounded-xl border border-border-light bg-surface/60 px-5 py-2.5 text-sm font-semibold backdrop-blur transition-colors hover:bg-surface-hover"
            >
              + Tạo suất chiếu
            </Link>
          </div>
        </div>
      </div>

      {/* Animated Stat cards */}
      <AnimatedStats cards={statCards} stats={stats} />

      {/* Revenue + Chart */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-gradient-to-br from-surface-raised to-surface p-6 lg:col-span-1">
          <div className="flex items-center gap-2 text-sm text-muted">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/15 text-base">
              💰
            </span>
            Tổng doanh thu
          </div>
          <div className="mt-3 text-3xl font-extrabold text-green-400 sm:text-4xl">
            {formatVnd(stats.revenue)}
          </div>
          <div className="mt-4 flex gap-4 text-xs">
            <div>
              <div className="text-muted">Vé đã bán</div>
              <div className="text-lg font-bold text-foreground">{stats.confirmedBookingCount}</div>
            </div>
            <div className="border-l border-border pl-4">
              <div className="text-muted">Suất chiếu</div>
              <div className="text-lg font-bold text-foreground">{stats.showtimeCount}</div>
            </div>
          </div>
        </div>

        {/* Revenue chart (Chart.js) */}
        <div className="rounded-2xl border border-border bg-surface-raised p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold">Doanh thu 7 ngày qua</h2>
            <span className="text-xs text-muted">Chart.js · theo ngày thanh toán</span>
          </div>
          <RevenueChart
            data={stats.last7DaysRevenue.map((d) => ({
              label: d.label,
              amount: d.amount,
            }))}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent bookings */}
        <div className="rounded-2xl border border-border bg-surface-raised p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold">Đặt vé gần đây</h2>
            <Link href="/admin/bookings" className="text-sm text-primary hover:underline">
              Xem tất cả →
            </Link>
          </div>
          {stats.recentBookings.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">Chưa có đặt vé nào</p>
          ) : (
            <div className="space-y-2">
              {stats.recentBookings.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-surface p-3 transition-colors hover:border-border-light"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{b.code}</div>
                    <div className="truncate text-xs text-muted">
                      {b.showtime.movie.title} · {b.showtime.room.cinema.name}
                    </div>
                  </div>
                  <div className="ml-2 shrink-0 text-right">
                    <div className="text-sm font-bold text-green-400">{formatVnd(b.finalTotal)}</div>
                    <div className="text-xs text-muted">{b.status}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming showtimes */}
        <div className="rounded-2xl border border-border bg-surface-raised p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold">Suất chiếu sắp tới</h2>
            <Link href="/admin/showtimes" className="text-sm text-primary hover:underline">
              Xem tất cả →
            </Link>
          </div>
          {stats.upcomingShowtimes.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">Không có suất chiếu nào</p>
          ) : (
            <div className="space-y-2">
              {stats.upcomingShowtimes.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-surface p-3 transition-colors hover:border-border-light"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{s.movie.title}</div>
                    <div className="truncate text-xs text-muted">
                      {s.room.cinema.name} · {s.room.name}
                    </div>
                  </div>
                  <div className="ml-2 shrink-0 text-right text-xs text-muted">
                    {formatDateTime(s.startsAt)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top movies */}
      <div className="rounded-2xl border border-border bg-surface-raised p-5">
        <h2 className="mb-4 font-bold">Phim phổ biến nhất</h2>
        {stats.topMovies.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">Chưa có phim nào</p>
        ) : (
          <div className="space-y-3">
            {stats.topMovies.map((m, i) => (
              <div key={m.id} className="flex items-center gap-4">
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                  i === 0 ? "bg-yellow-500/20 text-yellow-400" :
                  i === 1 ? "bg-gray-400/20 text-gray-300" :
                  i === 2 ? "bg-orange-500/20 text-orange-400" :
                  "bg-surface text-muted"
                }`}>
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{m.title}</div>
                  <div className="text-xs text-muted">
                    {MOVIE_STATUS_LABELS[m.status as keyof typeof MOVIE_STATUS_LABELS]} · {m._count.showtimes} suất chiếu
                  </div>
                </div>
                <div className="shrink-0 text-sm font-bold text-accent">{m.popularity} lượt</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
