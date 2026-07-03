import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/ui";

export const metadata: Metadata = {
  title: "Hệ thống rạp",
};

export const dynamic = "force-dynamic";

export default async function CinemasPage() {
  const cinemas = await prisma.cinema.findMany({
    where: { isActive: true },
    include: {
      rooms: { where: { isActive: true } },
      _count: {
        select: {
          showtimes: {
            where: { startsAt: { gt: new Date() }, status: "SCHEDULED" },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">Hệ thống rạp</h1>
      <p className="mt-1 text-sm text-muted">
        Chọn rạp gần bạn để xem lịch chiếu và đặt vé
      </p>

      {cinemas.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon="🏢"
            title="Chưa có rạp nào hoạt động"
            description="Hệ thống rạp đang được cập nhật."
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {cinemas.map((cinema) => (
            <Link
              key={cinema.id}
              href={`/cinemas/${cinema.slug}`}
              className="group flex flex-col rounded-2xl border border-border bg-surface p-6 transition-all hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5"
            >
              <div className="flex items-start justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-2xl">
                  🏢
                </span>
                <span className="rounded-full bg-surface-raised px-3 py-1 text-xs font-medium text-muted">
                  {cinema._count.showtimes} suất chiếu sắp tới
                </span>
              </div>
              <h2 className="mt-4 text-lg font-bold group-hover:text-primary">
                {cinema.name}
              </h2>
              <p className="mt-1 text-sm text-muted">
                {cinema.address}, {cinema.city}
              </p>
              {cinema.description && (
                <p className="mt-3 line-clamp-2 text-sm text-muted-dark">
                  {cinema.description}
                </p>
              )}
              <div className="mt-auto space-y-1 pt-4 text-xs text-muted">
                <p>📞 {cinema.phone}</p>
                <p>🕐 {cinema.openingHours}</p>
                <p>🎬 {cinema.rooms.length} phòng chiếu</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
