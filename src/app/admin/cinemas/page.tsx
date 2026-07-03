import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CinemaActions } from "./cinema-actions";

export const dynamic = "force-dynamic";

export default async function AdminCinemasPage() {
  const cinemas = await prisma.cinema.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { rooms: true, showtimes: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản lý rạp</h1>
          <p className="text-sm text-muted">{cinemas.length} rạp</p>
        </div>
        <Link
          href="/admin/cinemas/new"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-background hover:opacity-90"
        >
          + Thêm rạp
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cinemas.map((c) => (
          <div
            key={c.id}
            className="rounded-xl border border-border bg-surface-raised p-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold">{c.name}</h3>
                <p className="text-xs text-muted">{c.slug}</p>
              </div>
              <CinemaActions id={c.id} name={c.name} />
            </div>
            <p className="mt-2 text-sm text-muted">{c.address}</p>
            <div className="mt-3 flex gap-4 text-xs text-muted">
              <span>🪑 {c._count.rooms} phòng</span>
              <span>🕐 {c._count.showtimes} suất chiếu</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
