import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatVnd, formatDateTime } from "@/lib/constants";

export const dynamic = "force-dynamic";

async function getStats() {
  const [
    movieCount,
    cinemaCount,
    roomCount,
    showtimeCount,
    bookingCount,
    activePromoCount,
    revenue,
    recentBookings,
    upcomingShowtimes,
  ] = await Promise.all([
    prisma.movie.count(),
    prisma.cinema.count(),
    prisma.room.count(),
    prisma.showtime.count(),
    prisma.booking.count(),
    prisma.promotion.count({ where: { isActive: true, expiresAt: { gte: new Date() } } }),
    prisma.payment.aggregate({
      where: { status: "PAID" },
      _sum: { amount: true },
    }),
    prisma.booking.findMany({
      take: 8,
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
  ]);

  return {
    movieCount,
    cinemaCount,
    roomCount,
    showtimeCount,
    bookingCount,
    activePromoCount,
    revenue: revenue._sum.amount ?? 0,
    recentBookings,
    upcomingShowtimes,
  };
}

const statCards = [
  { key: "movieCount", label: "Phim", icon: "🎬", href: "/admin/movies" },
  { key: "cinemaCount", label: "Rạp", icon: "🏢", href: "/admin/cinemas" },
  { key: "showtimeCount", label: "Suất chiếu", icon: "🕐", href: "/admin/showtimes" },
  { key: "bookingCount", label: "Đặt vé", icon: "🎫", href: "/admin/bookings" },
  { key: "activePromoCount", label: "Khuyến mãi", icon: "🎁", href: "/admin/promotions" },
] as const;

export default async function AdminOverviewPage() {
  const stats = await getStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tổng quan hệ thống</h1>
        <p className="text-sm text-muted">Thống kê và hoạt động gần đây</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {statCards.map((card) => (
          <Link
            key={card.key}
            href={card.href}
            className="rounded-xl border border-border bg-surface-raised p-4 transition-colors hover:border-primary"
          >
            <div className="text-2xl">{card.icon}</div>
            <div className="mt-2 text-2xl font-bold">
              {stats[card.key]}
            </div>
            <div className="text-xs text-muted">{card.label}</div>
          </Link>
        ))}
      </div>

      {/* Revenue */}
      <div className="rounded-xl border border-border bg-gradient-to-br from-surface-raised to-surface p-6">
        <div className="text-sm text-muted">Tổng doanh thu (đã thanh toán)</div>
        <div className="mt-1 text-3xl font-extrabold text-primary">
          {formatVnd(stats.revenue)}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent bookings */}
        <div className="rounded-xl border border-border bg-surface-raised p-4">
          <div className="mb-3 flex items-center justify-between">
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
                  className="flex items-center justify-between rounded-lg border border-border bg-surface p-3"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{b.code}</div>
                    <div className="truncate text-xs text-muted">
                      {b.showtime.movie.title} · {b.showtime.room.cinema.name}
                    </div>
                  </div>
                  <div className="ml-2 shrink-0 text-right">
                    <div className="text-sm font-bold">{formatVnd(b.finalTotal)}</div>
                    <div className="text-xs text-muted">{b.status}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming showtimes */}
        <div className="rounded-xl border border-border bg-surface-raised p-4">
          <div className="mb-3 flex items-center justify-between">
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
                  className="flex items-center justify-between rounded-lg border border-border bg-surface p-3"
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
    </div>
  );
}
