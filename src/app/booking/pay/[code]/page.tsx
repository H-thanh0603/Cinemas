import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { expirePendingBookings } from "@/lib/booking-expire";
import { formatVnd, PAYMENT_METHOD_LABELS } from "@/lib/constants";
import { HoldCountdown } from "@/components/booking/hold-countdown";
import { SandboxPayForm } from "@/components/booking/sandbox-pay-form";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

export const dynamic = "force-dynamic";

export default async function PaymentPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  await expirePendingBookings();

  const booking = await prisma.booking.findUnique({
    where: { code },
    include: {
      payment: true,
      showtime: { include: { movie: true, cinema: true, room: true } },
      seats: { include: { seat: true } },
    },
  });

  if (!booking) notFound();

  if (booking.status === "CONFIRMED") {
    redirect(`/booking/confirmation/${code}`);
  }

  if (booking.status === "EXPIRED" || booking.status === "CANCELLED") {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Không thể thanh toán</h1>
        <p className="mt-2 text-muted">
          Đơn {code} đã {booking.status === "EXPIRED" ? "hết hạn giữ ghế" : "bị hủy"}.
        </p>
        <Link
          href="/movies?status=NOW_SHOWING"
          className="mt-6 inline-block rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white"
        >
          Đặt vé lại
        </Link>
      </div>
    );
  }

  if (booking.payment?.method === "AT_COUNTER") {
    redirect(`/booking/confirmation/${code}`);
  }

  const method = booking.payment?.method ?? "CREDIT_CARD";
  const seats = booking.seats
    .map((s) => `${s.seat.row}${s.seat.number}`)
    .join(", ");

  return (
    <div className="mx-auto max-w-lg px-4 py-10 sm:px-6">
      <Breadcrumbs
        items={[
          { label: "Trang chủ", href: "/" },
          { label: "Thanh toán" },
          { label: code },
        ]}
      />

      <div className="mt-4 rounded-2xl border border-border bg-surface-raised p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted">
              Cổng thanh toán sandbox
            </p>
            <h1 className="text-xl font-extrabold">CineStar Pay</h1>
          </div>
          <span className="rounded-lg bg-amber-500/15 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-300">
            Demo · không trừ tiền
          </span>
        </div>

        {booking.expiresAt && (
          <div className="mb-5">
            <HoldCountdown expiresAt={booking.expiresAt} />
          </div>
        )}

        <dl className="mb-6 space-y-2 rounded-xl border border-border bg-surface p-4 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Mã đơn</dt>
            <dd className="font-mono font-bold text-accent">{booking.code}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Phim</dt>
            <dd className="text-right font-medium">
              {booking.showtime.movie.title}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Rạp / ghế</dt>
            <dd className="text-right">
              {booking.showtime.cinema.name} · {seats}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Phương thức</dt>
            <dd>{PAYMENT_METHOD_LABELS[method] ?? method}</dd>
          </div>
          <div className="flex justify-between border-t border-border pt-2">
            <dt className="font-semibold">Thanh toán</dt>
            <dd className="text-lg font-extrabold text-primary">
              {formatVnd(booking.finalTotal)}
            </dd>
          </div>
        </dl>

        <SandboxPayForm code={booking.code} method={method} amount={booking.finalTotal} />
      </div>
    </div>
  );
}
