import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge, EmptyState } from "@/components/ui";
import {
  BOOKING_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  formatDateTime,
  formatVnd,
} from "@/lib/constants";
import { LookupForm } from "./lookup-form";
import { auth } from "@/auth";
import { expirePendingBookings } from "@/lib/booking-expire";

export const metadata: Metadata = {
  title: "Vé của tôi",
};

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

type BookingWithRelations = Awaited<
  ReturnType<typeof findBookings>
>[number];

function findBookings(email: string) {
  return prisma.booking.findMany({
    where: { contactEmail: email },
    orderBy: { createdAt: "desc" },
    include: {
      showtime: { include: { movie: true, cinema: true, room: true } },
      seats: { include: { seat: true } },
      payment: true,
    },
  });
}

function BookingCard({ booking }: { booking: BookingWithRelations }) {
  return (
    <Link
      href={`/booking/confirmation/${booking.code}`}
      className="group flex gap-4 rounded-2xl border border-border bg-surface p-4 transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
    >
      <div className="relative hidden aspect-[2/3] w-16 shrink-0 overflow-hidden rounded-lg sm:block">
        <Image
          src={booking.showtime.movie.posterUrl}
          alt={booking.showtime.movie.title}
          fill
          sizes="64px"
          className="object-cover"
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs font-bold tracking-wider text-accent">
            {booking.code}
          </span>
          <Badge color={statusColor[booking.status] ?? "muted"}>
            {BOOKING_STATUS_LABELS[booking.status]}
          </Badge>
          {booking.payment && (
            <Badge color={paymentColor[booking.payment.status] ?? "muted"}>
              {PAYMENT_STATUS_LABELS[booking.payment.status]}
            </Badge>
          )}
        </div>
        <h3 className="mt-1.5 font-bold group-hover:text-primary">
          {booking.showtime.movie.title}
        </h3>
        <p className="mt-0.5 text-xs text-muted">
          {formatDateTime(booking.showtime.startsAt)} ·{" "}
          {booking.showtime.cinema.name} · {booking.showtime.room.name}
        </p>
        <p className="mt-0.5 text-xs text-muted">
          Ghế:{" "}
          <span className="font-semibold text-foreground">
            {booking.seats
              .map((bs) => `${bs.seat.row}${bs.seat.number}`)
              .join(", ")}
          </span>
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end justify-between">
        <span className="font-bold text-accent">
          {formatVnd(booking.finalTotal)}
        </span>
        <span className="text-xs text-muted group-hover:text-primary">
          Chi tiết →
        </span>
      </div>
    </Link>
  );
}

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  await expirePendingBookings();
  const session = await auth();
  const { email: emailParam } = await searchParams;
  const email =
    emailParam?.trim() ||
    session?.user?.email?.trim() ||
    undefined;

  let bookings = email ? await findBookings(email) : null;

  // Also include bookings linked to the logged-in user id
  if (session?.user?.id) {
    const byUser = await prisma.booking.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        showtime: { include: { movie: true, cinema: true, room: true } },
        seats: { include: { seat: true } },
        payment: true,
      },
    });
    if (!bookings) {
      bookings = byUser;
    } else {
      const seen = new Set(bookings.map((b) => b.id));
      for (const b of byUser) {
        if (!seen.has(b.id)) bookings.push(b);
      }
    }
  }

  const now = new Date();
  const upcoming =
    bookings?.filter(
      (b) =>
        b.showtime.startsAt > now &&
        (b.status === "CONFIRMED" || b.status === "PENDING")
    ) ?? [];
  const past =
    bookings?.filter(
      (b) =>
        b.showtime.startsAt <= now &&
        b.status !== "CANCELLED" &&
        b.status !== "EXPIRED"
    ) ?? [];
  const cancelled =
    bookings?.filter(
      (b) => b.status === "CANCELLED" || b.status === "EXPIRED"
    ) ?? [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">Vé của tôi</h1>
      <p className="mt-1 text-sm text-muted">
        {session?.user
          ? `Xin chào ${session.user.name || session.user.email} — lịch sử đặt vé của bạn`
          : "Nhập email đã dùng khi đặt vé, hoặc đăng nhập để xem lịch sử"}
      </p>

      <div className="mt-6">
        <LookupForm initialEmail={email ?? ""} />
      </div>

      {email && bookings && (
        <div className="mt-10 space-y-10">
          {bookings.length === 0 ? (
            <EmptyState
              icon="🎫"
              title="Không tìm thấy vé nào"
              description={`Không có đơn đặt vé nào cho email "${email}". Kiểm tra lại email hoặc đặt vé ngay.`}
              actionHref="/movies?status=NOW_SHOWING"
              actionLabel="Đặt vé ngay"
            />
          ) : (
            <>
              <section>
                <h2 className="text-lg font-bold">
                  Sắp tới{" "}
                  <span className="text-sm font-normal text-muted">
                    ({upcoming.length})
                  </span>
                </h2>
                {upcoming.length === 0 ? (
                  <p className="mt-3 rounded-xl border border-dashed border-border bg-surface px-4 py-6 text-center text-sm text-muted">
                    Không có vé nào sắp tới
                  </p>
                ) : (
                  <div className="mt-3 space-y-3">
                    {upcoming.map((b) => (
                      <BookingCard key={b.id} booking={b} />
                    ))}
                  </div>
                )}
              </section>

              <section>
                <h2 className="text-lg font-bold">
                  Đã xem{" "}
                  <span className="text-sm font-normal text-muted">
                    ({past.length})
                  </span>
                </h2>
                {past.length === 0 ? (
                  <p className="mt-3 rounded-xl border border-dashed border-border bg-surface px-4 py-6 text-center text-sm text-muted">
                    Chưa có vé nào đã sử dụng
                  </p>
                ) : (
                  <div className="mt-3 space-y-3 opacity-80">
                    {past.map((b) => (
                      <BookingCard key={b.id} booking={b} />
                    ))}
                  </div>
                )}
              </section>

              <section>
                <h2 className="text-lg font-bold">
                  Đã hủy / Hết hạn{" "}
                  <span className="text-sm font-normal text-muted">
                    ({cancelled.length})
                  </span>
                </h2>
                {cancelled.length === 0 ? (
                  <p className="mt-3 rounded-xl border border-dashed border-border bg-surface px-4 py-6 text-center text-sm text-muted">
                    Không có vé bị hủy
                  </p>
                ) : (
                  <div className="mt-3 space-y-3 opacity-60">
                    {cancelled.map((b) => (
                      <BookingCard key={b.id} booking={b} />
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      )}

      {!email && (
        <div className="mt-10">
          <EmptyState
            icon="🔍"
            title="Tra cứu vé đã đặt"
            description="Nhập email phía trên để xem toàn bộ vé sắp tới, vé đã xem và vé đã hủy của bạn."
          />
        </div>
      )}
    </div>
  );
}
