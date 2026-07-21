import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import {
  BOOKING_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  SEAT_HOLD_MINUTES,
  SEAT_TYPE_LABELS,
  formatDateTime,
  formatVnd,
} from "@/lib/constants";
import { QrTicket } from "@/components/booking/qr-ticket";
import { HoldCountdown } from "@/components/booking/hold-countdown";
import { expirePendingBookings } from "@/lib/booking-expire";

export const dynamic = "force-dynamic";

const statusColor: Record<string, "success" | "warning" | "danger" | "muted"> = {
  CONFIRMED: "success",
  PENDING: "warning",
  CANCELLED: "danger",
  EXPIRED: "muted",
};

const paymentColor: Record<string, "success" | "warning" | "danger" | "info"> = {
  PAID: "success",
  UNPAID: "warning",
  FAILED: "danger",
  REFUNDED: "info",
};

export default async function ConfirmationPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  await expirePendingBookings();

  const booking = await prisma.booking.findUnique({
    where: { code },
    include: {
      showtime: {
        include: { movie: true, cinema: true, room: true },
      },
      seats: { include: { seat: true, ticketType: true } },
      combos: { include: { combo: true } },
      payment: true,
      promotion: true,
    },
  });

  if (!booking) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Breadcrumbs items={[
        { label: "Trang chủ", href: "/" },
        { label: "Vé của tôi", href: "/bookings" },
        { label: booking.code },
      ]} />
      <div className="text-center">
        <span className="text-6xl">
          {booking.status === "PENDING" ? "⏳" : "🎉"}
        </span>
        <h1 className="mt-4 text-3xl font-bold">
          {booking.status === "PENDING"
            ? "Đang giữ ghế — chờ thanh toán"
            : booking.status === "EXPIRED"
              ? "Vé đã hết hạn giữ chỗ"
              : "Đặt vé thành công!"}
        </h1>
        <p className="mt-2 text-sm text-muted">
          {booking.status === "CONFIRMED" ? (
            <>
              Vé điện tử đã được gửi tới <b>{booking.contactEmail}</b>
              {booking.emailSentAt ? " (email đã gửi)" : " (nếu cấu hình Resend)"}
            </>
          ) : booking.status === "PENDING" && booking.expiresAt ? (
            <>
              Giữ ghế tối đa {SEAT_HOLD_MINUTES} phút · hết hạn{" "}
              <b>{formatDateTime(booking.expiresAt)}</b>
            </>
          ) : (
            <>Mã đặt vé: <b>{booking.code}</b></>
          )}
        </p>
        {booking.status === "PENDING" && booking.expiresAt && (
          <div className="mx-auto mt-5 max-w-md">
            <HoldCountdown expiresAt={booking.expiresAt} />
            {booking.payment?.method !== "AT_COUNTER" &&
              booking.payment?.status === "UNPAID" && (
                <Link
                  href={`/booking/pay/${booking.code}`}
                  className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white"
                >
                  Tiếp tục thanh toán sandbox →
                </Link>
              )}
          </div>
        )}
      </div>

      <div className="mt-8 overflow-hidden rounded-3xl border border-border bg-surface">
        {/* Ticket header */}
        <div className="flex items-center justify-between border-b border-dashed border-border-light bg-surface-raised px-6 py-4">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted">
              Mã đặt vé
            </p>
            <p className="font-mono text-2xl font-black tracking-widest text-accent">
              {booking.code}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <Badge color={statusColor[booking.status] ?? "muted"}>
              {BOOKING_STATUS_LABELS[booking.status]}
            </Badge>
            {booking.payment && (
              <Badge color={paymentColor[booking.payment.status] ?? "muted"}>
                {PAYMENT_STATUS_LABELS[booking.payment.status]}
              </Badge>
            )}
          </div>
        </div>

        <div className="grid gap-6 p-6 sm:grid-cols-[1fr_auto]">
          <div className="flex gap-4">
            <div className="relative aspect-[2/3] w-20 shrink-0 overflow-hidden rounded-xl">
              <Image
                src={booking.showtime.movie.posterUrl}
                alt={booking.showtime.movie.title}
                fill
                sizes="80px"
                className="object-cover"
              />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold">
                {booking.showtime.movie.title}
              </h2>
              <p className="mt-0.5 text-xs text-muted">
                {booking.showtime.format} ·{" "}
                {booking.showtime.movie.ageRating} ·{" "}
                {booking.showtime.movie.durationMin} phút
              </p>
              <dl className="mt-3 space-y-1 text-sm">
                <div className="flex gap-2">
                  <dt className="text-muted">Suất:</dt>
                  <dd className="font-semibold">
                    {formatDateTime(booking.showtime.startsAt)}
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-muted">Rạp:</dt>
                  <dd className="font-semibold">
                    {booking.showtime.cinema.name}
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-muted">Phòng:</dt>
                  <dd className="font-semibold">{booking.showtime.room.name}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-muted">Ghế:</dt>
                  <dd className="font-semibold">
                    {booking.seats
                      .map((bs) => `${bs.seat.row}${bs.seat.number}`)
                      .join(", ")}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <QrTicket code={booking.code} />
        </div>

        {/* Price detail */}
        <div className="border-t border-dashed border-border-light px-6 py-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
            Chi tiết thanh toán
          </h3>
          <ul className="mt-3 space-y-1.5 text-sm">
            {booking.seats.map((bs) => (
              <li key={bs.id} className="flex justify-between">
                <span className="text-muted">
                  Ghế {bs.seat.row}
                  {bs.seat.number} ({SEAT_TYPE_LABELS[bs.seat.type]} ·{" "}
                  {bs.ticketType.name})
                </span>
                <span>{formatVnd(bs.price)}</span>
              </li>
            ))}
            {booking.combos.map((bc) => (
              <li key={bc.id} className="flex justify-between">
                <span className="text-muted">
                  {bc.combo.name} ×{bc.quantity}
                </span>
                <span>{formatVnd(bc.unitPrice * bc.quantity)}</span>
              </li>
            ))}
            {booking.discountTotal > 0 && (
              <li className="flex justify-between text-success">
                <span>
                  Giảm giá{booking.promotion ? ` (${booking.promotion.code})` : ""}
                </span>
                <span>−{formatVnd(booking.discountTotal)}</span>
              </li>
            )}
          </ul>
          <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
            <span className="font-semibold">Tổng cộng</span>
            <span className="text-xl font-bold text-accent">
              {formatVnd(booking.finalTotal)}
            </span>
          </div>
          {booking.payment && (
            <p className="mt-2 text-xs text-muted">
              Phương thức: {PAYMENT_METHOD_LABELS[booking.payment.method]}
            </p>
          )}
        </div>
      </div>

      {/* Arrival instructions */}
      <div className="mt-6 rounded-2xl border border-info/30 bg-info/5 p-5 text-sm">
        <h3 className="font-semibold text-info">📌 Hướng dẫn nhận vé</h3>
        <ul className="mt-2 list-inside list-disc space-y-1 text-muted">
          <li>Có mặt tại rạp trước giờ chiếu ít nhất 15 phút.</li>
          <li>
            Xuất trình mã đặt vé <b className="text-foreground">{booking.code}</b>{" "}
            hoặc mã QR tại quầy soát vé.
          </li>
          {booking.payment?.status === "UNPAID" && (
            <li className="text-warning">
              Vé chưa thanh toán — vui lòng thanh toán tại quầy trước giờ chiếu
              30 phút, nếu không vé sẽ bị hủy.
            </li>
          )}
          <li>Vé HSSV/Trẻ em cần xuất trình giấy tờ tùy thân khi vào rạp.</li>
        </ul>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href={`/bookings?email=${encodeURIComponent(booking.contactEmail)}`}
          className="rounded-xl border border-border px-6 py-3 text-sm font-semibold text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
        >
          Xem vé của tôi
        </Link>
        <Link
          href="/movies"
          className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
        >
          Đặt vé phim khác
        </Link>
      </div>
    </div>
  );
}
