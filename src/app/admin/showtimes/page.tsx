import Link from "next/link";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { escapeLikePattern } from "@/lib/search-utils";
import { SHOWTIME_FORMAT_LABELS, formatDateTime } from "@/lib/constants";
import { ShowtimeActions } from "./showtime-actions";
import { AdminSearch, AdminFilter } from "../admin-search";
import { AdminPagination } from "../admin-pagination";

export const dynamic = "force-dynamic";

export default async function AdminShowtimesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const { q, status, page: pageParam } = await searchParams;
  const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);
  const pageSize = 50;
  const safeQ = q ? escapeLikePattern(q) : "";
  const where: Prisma.ShowtimeWhereInput = {
    AND: [
      safeQ ? { OR: [{ movie: { title: { contains: safeQ, mode: "insensitive" as const } } }, { room: { name: { contains: safeQ, mode: "insensitive" as const } } }, { room: { cinema: { name: { contains: safeQ, mode: "insensitive" as const } } } }] } : {},
      status && status !== "ALL" ? { status } : {},
    ],
  };

  const [showtimes, total] = await Promise.all([
    prisma.showtime.findMany({
    where,
    orderBy: { startsAt: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
    include: {
      movie: true,
      room: { include: { cinema: true } },
      _count: { select: { bookings: true } },
    },
    }),
    prisma.showtime.count({ where }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Quản lý suất chiếu</h1>
          <p className="text-sm text-muted">{total} suất chiếu</p>
        </div>
        <Link
          href="/admin/showtimes/new"
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary-hover"
        >
          + Thêm suất chiếu
        </Link>
      </div>
      <AdminPagination page={page} totalPages={Math.max(1, Math.ceil(total / pageSize))} query={{ q, status }} />

      {/* Search & filter */}
      <div className="flex flex-wrap items-center gap-3">
        <AdminSearch param="q" placeholder="Tìm theo phim, rạp, phòng..." />
        <AdminFilter
          param="status"
          label="Tất cả trạng thái"
          options={[
            { value: "SCHEDULED", label: "Đã lên lịch" },
            { value: "CANCELLED", label: "Đã hủy" },
          ]}
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface-raised text-left text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3">Phim</th>
              <th className="px-4 py-3">Rạp / Phòng</th>
              <th className="px-4 py-3">Thời gian</th>
              <th className="px-4 py-3">Định dạng</th>
              <th className="px-4 py-3">Đặt vé</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {showtimes.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-muted">
                  Không tìm thấy suất chiếu nào
                </td>
              </tr>
            ) : (
              showtimes.map((s) => (
                <tr key={s.id} className="transition-colors hover:bg-surface-raised/50">
                  <td className="px-4 py-3 font-semibold">{s.movie.title}</td>
                  <td className="px-4 py-3 text-muted">
                    {s.room.cinema.name} · {s.room.name}
                  </td>
                  <td className="px-4 py-3">{formatDateTime(s.startsAt)}</td>
                  <td className="px-4 py-3">{SHOWTIME_FORMAT_LABELS[s.format as keyof typeof SHOWTIME_FORMAT_LABELS] || s.format}</td>
                  <td className="px-4 py-3">{s._count.bookings}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                      s.status === "SCHEDULED" ? "bg-green-500/20 text-green-400" :
                      s.status === "CANCELLED" ? "bg-red-500/20 text-red-400" :
                      "bg-gray-500/20 text-gray-400"
                    }`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ShowtimeActions id={s.id} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
