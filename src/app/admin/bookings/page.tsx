import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatVnd, formatDateTime, BOOKING_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/constants";
import { BookingActions } from "./booking-actions";
import { AdminSearch, AdminFilter } from "../admin-search";

export const dynamic = "force-dynamic";

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q, status } = await searchParams;

  const bookings = await prisma.booking.findMany({
    where: {
      AND: [
        q
          ? {
              OR: [
                { code: { contains: q } },
                { contactName: { contains: q } },
                { contactEmail: { contains: q } },
                { contactPhone: { contains: q } },
              ],
            }
          : {},
        status && status !== "ALL"
          ? { status }
          : {},
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      showtime: { include: { movie: true, room: { include: { cinema: true } } } },
      payment: true,
      _count: { select: { seats: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Quản lý đặt vé</h1>
        <p className="text-sm text-muted">{bookings.length} đặt vé</p>
      </div>

      {/* Search & filter */}
      <div className="flex flex-wrap items-center gap-3">
        <AdminSearch param="q" placeholder="Tìm theo mã, tên, email, SĐT..." />
        <AdminFilter
          param="status"
          label="Tất cả trạng thái"
          options={[
            { value: "PENDING", label: "Chờ xác nhận" },
            { value: "CONFIRMED", label: "Đã xác nhận" },
            { value: "CANCELLED", label: "Đã hủy" },
            { value: "EXPIRED", label: "Hết hạn" },
          ]}
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface-raised text-left text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3">Mã đặt vé</th>
              <th className="px-4 py-3">Phim</th>
              <th className="px-4 py-3">Rạp</th>
              <th className="px-4 py-3">Suất chiếu</th>
              <th className="px-4 py-3">Ghế</th>
              <th className="px-4 py-3">Tổng tiền</th>
              <th className="px-4 py-3">Đặt vé</th>
              <th className="px-4 py-3">Thanh toán</th>
              <th className="px-4 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {bookings.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-muted">
                  Không tìm thấy đặt vé nào
                </td>
              </tr>
            ) : (
              bookings.map((b) => (
                <tr key={b.id} className="transition-colors hover:bg-surface-raised/50">
                  <td className="px-4 py-3">
                    <Link href={`/booking/confirmation/${b.code}`} className="font-semibold text-primary hover:underline">
                      {b.code}
                    </Link>
                    <div className="text-xs text-muted">{b.contactEmail}</div>
                  </td>
                  <td className="px-4 py-3">{b.showtime.movie.title}</td>
                  <td className="px-4 py-3 text-xs text-muted">
                    {b.showtime.room.cinema.name} · {b.showtime.room.name}
                  </td>
                  <td className="px-4 py-3 text-xs">{formatDateTime(b.showtime.startsAt)}</td>
                  <td className="px-4 py-3">{b._count.seats}</td>
                  <td className="px-4 py-3 font-semibold">{formatVnd(b.finalTotal)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                      b.status === "CONFIRMED" ? "bg-green-500/20 text-green-400" :
                      b.status === "CANCELLED" ? "bg-red-500/20 text-red-400" :
                      b.status === "EXPIRED" ? "bg-gray-500/20 text-gray-400" :
                      "bg-yellow-500/20 text-yellow-400"
                    }`}>
                      {BOOKING_STATUS_LABELS[b.status as keyof typeof BOOKING_STATUS_LABELS]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {b.payment ? (
                      <span className={`text-xs font-semibold ${
                        b.payment.status === "PAID" ? "text-green-400" :
                        b.payment.status === "REFUNDED" ? "text-blue-400" :
                        b.payment.status === "FAILED" ? "text-red-400" :
                        "text-yellow-400"
                      }`}>
                        {PAYMENT_STATUS_LABELS[b.payment.status as keyof typeof PAYMENT_STATUS_LABELS]}
                      </span>
                    ) : (
                      <span className="text-xs text-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <BookingActions id={b.id} status={b.status} />
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
