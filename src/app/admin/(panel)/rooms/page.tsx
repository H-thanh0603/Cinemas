import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { RoomActions } from "./room-actions";

export const dynamic = "force-dynamic";

export default async function AdminRoomsPage() {
  const rooms = await prisma.room.findMany({
    orderBy: [{ cinema: { name: "asc" } }, { name: "asc" }],
    include: {
      cinema: true,
      _count: { select: { seats: true, showtimes: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản lý phòng & ghế</h1>
          <p className="text-sm text-muted">{rooms.length} phòng</p>
        </div>
        <Link
          href="/admin/rooms/new"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-background hover:opacity-90"
        >
          + Thêm phòng
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface-raised text-left text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3">Phòng</th>
              <th className="px-4 py-3">Rạp</th>
              <th className="px-4 py-3">Sức chứa</th>
              <th className="px-4 py-3">Ghế</th>
              <th className="px-4 py-3">Suất chiếu</th>
              <th className="px-4 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rooms.map((r) => (
              <tr key={r.id} className="hover:bg-surface-raised/50">
                <td className="px-4 py-3 font-semibold">{r.name}</td>
                <td className="px-4 py-3 text-muted">{r.cinema.name}</td>
                <td className="px-4 py-3">{r.rows}×{r.cols} ({r.rows * r.cols})</td>
                <td className="px-4 py-3">{r._count.seats}</td>
                <td className="px-4 py-3">{r._count.showtimes}</td>
                <td className="px-4 py-3 text-right">
                  <RoomActions id={r.id} name={r.name} seatCount={r._count.seats} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
