"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/toast";
import { createBooking } from "@/app/booking/actions";
import {
  MAX_SEATS_PER_BOOKING,
  SEAT_HOLD_MINUTES,
  SEAT_TYPE_LABELS,
  formatDateTime,
  formatVnd,
} from "@/lib/constants";
import { seatBasePrice } from "@/lib/booking";
import { effectiveBasePrice } from "@/lib/booking-pricing";
import { getTmdbImageUrl } from "@/lib/tmdb-image";
import { PosterImage } from "@/components/ui/poster-image";
import { BookingProgress } from "./progress";
import { SeatMap } from "./seat-map";
import { ExtrasStep } from "./extras-step";
import {
  CheckoutStep,
  type ContactInfo,
  type PromoState,
} from "./checkout-step";
import { useSeatRealtime } from "./use-seat-realtime";
import type { ComboDto, SeatDto, ShowtimeDto, TicketTypeDto } from "./types";

type BookingFlowProps = {
  showtime: ShowtimeDto;
  seats: SeatDto[];
  bookedSeatIds: string[];
  ticketTypes: TicketTypeDto[];
  combos: ComboDto[];
  prefillContact?: Partial<ContactInfo>;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^0\d{9,10}$/;

export function BookingFlow({
  showtime,
  seats,
  bookedSeatIds,
  ticketTypes,
  combos,
  prefillContact,
}: BookingFlowProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { data: session } = useSession();

  const [step, setStep] = useState<"seats" | "extras" | "checkout">("seats");
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [ticketAssignments, setTicketAssignments] = useState<
    Record<string, string>
  >({});
  const [comboQuantities, setComboQuantities] = useState<
    Record<string, number>
  >({});
  const [contact, setContact] = useState<ContactInfo>({
    name: prefillContact?.name || session?.user?.name || "",
    email: prefillContact?.email || session?.user?.email || "",
    phone: prefillContact?.phone || "",
  });
  const [paymentMethod, setPaymentMethod] = useState("STRIPE");
  const [promo, setPromo] = useState<PromoState>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof ContactInfo, string>>
  >({});
  const [submitting, setSubmitting] = useState(false);

  const bookedSet = useSeatRealtime(showtime.id, bookedSeatIds);
  const seatById = useMemo(() => new Map(seats.map((s) => [s.id, s])), [seats]);
  const defaultTicket =
    ticketTypes.find((t) => t.code === "ADULT") ?? ticketTypes[0];
  const ticketById = useMemo(
    () => new Map(ticketTypes.map((t) => [t.id, t])),
    [ticketTypes]
  );
  const comboById = useMemo(
    () => new Map(combos.map((c) => [c.id, c])),
    [combos]
  );

  const selectedSeats = selectedSeatIds
    .map((id) => seatById.get(id))
    .filter((s): s is SeatDto => Boolean(s));

  // ── Price computation ──────────────────────────────────────────────
  const effBasePrice = effectiveBasePrice(
    showtime.basePrice,
    new Date(showtime.startsAt)
  );
  const seatsTotal = selectedSeats.reduce((sum, seat) => {
    const ttId = ticketAssignments[seat.id] ?? defaultTicket?.id;
    const tt = ttId ? ticketById.get(ttId) : undefined;
    return (
      sum +
      Math.max(0, seatBasePrice(effBasePrice, seat.type) + (tt?.priceModifier ?? 0))
    );
  }, 0);

  const combosTotal = Object.entries(comboQuantities).reduce(
    (sum, [comboId, qty]) => {
      const combo = comboById.get(comboId);
      return sum + (combo ? combo.price * qty : 0);
    },
    0
  );

  const orderValue = seatsTotal + combosTotal;
  const discount = promo ? Math.min(promo.discount, orderValue) : 0;
  const finalTotal = orderValue - discount;

  // ── Handlers ───────────────────────────────────────────────────────
  function toggleSeat(seat: SeatDto) {
    setSelectedSeatIds((prev) => {
      if (prev.includes(seat.id)) {
        setTicketAssignments((ta) => {
          const next = { ...ta };
          delete next[seat.id];
          return next;
        });
        return prev.filter((id) => id !== seat.id);
      }
      if (prev.length >= MAX_SEATS_PER_BOOKING) {
        toast(
          `Bạn chỉ có thể chọn tối đa ${MAX_SEATS_PER_BOOKING} ghế mỗi lần đặt`,
          "error"
        );
        return prev;
      }
      if (defaultTicket) {
        setTicketAssignments((ta) => ({ ...ta, [seat.id]: defaultTicket.id }));
      }
      return [...prev, seat.id];
    });
    // seat change invalidates applied promo (order value changes)
    setPromo(null);
  }

  // Replace the whole selection with the auto-picked group (keeps default ticket).
  function handleAutoPick(picked: SeatDto[]) {
    setSelectedSeatIds((prev) => {
      if (defaultTicket) {
        setTicketAssignments((ta) => {
          const next = { ...ta };
          for (const id of prev) delete next[id];
          for (const s of picked) next[s.id] = defaultTicket.id;
          return next;
        });
      } else {
        setTicketAssignments({});
      }
      return picked.map((s) => s.id);
    });
    setPromo(null);
  }

  function validateContact(): boolean {
    const errors: Partial<Record<keyof ContactInfo, string>> = {};
    if (!contact.name.trim() || contact.name.trim().length < 2) {
      errors.name = "Vui lòng nhập họ tên (ít nhất 2 ký tự)";
    }
    if (!EMAIL_RE.test(contact.email.trim())) {
      errors.email = "Email không hợp lệ";
    }
    if (!PHONE_RE.test(contact.phone.trim())) {
      errors.phone = "SĐT phải bắt đầu bằng 0 và có 10-11 chữ số";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function submitBooking() {
    if (!validateContact()) {
      toast("Vui lòng kiểm tra lại thông tin liên hệ", "error");
      return;
    }
    const userId = session?.user?.id;
    setSubmitting(true);
    const result = await createBooking({
      showtimeId: showtime.id,
      // retry-safe: same key returns the same booking instead of a duplicate
      idempotencyKey: crypto.randomUUID(),
      seats: selectedSeats.map((seat) => ({
        seatId: seat.id,
        ticketTypeId: ticketAssignments[seat.id] ?? defaultTicket!.id,
      })),
      combos: Object.entries(comboQuantities)
        .filter(([, qty]) => qty > 0)
        .map(([comboId, quantity]) => ({ comboId, quantity })),
      promotionCode: promo?.code,
      contact: {
        name: contact.name.trim(),
        email: contact.email.trim(),
        phone: contact.phone.trim(),
      },
      paymentMethod,
    });
    setSubmitting(false);

    if (result.ok) {
      if (result.data.needsPayment) {
        toast(
          `Đã giữ ghế ${SEAT_HOLD_MINUTES} phút — hoàn tất thanh toán online`,
          "success"
        );
        router.push(`/booking/pay/${result.data.code}${userId ? "" : `?email=${encodeURIComponent(contact.email.trim().toLowerCase())}`}`);
      } else {
        toast(
          `Giữ ghế ${SEAT_HOLD_MINUTES} phút — thanh toán tại quầy trước khi hết hạn`,
          "success"
        );
        router.push(`/booking/confirmation/${result.data.code}${userId ? "" : `?email=${encodeURIComponent(contact.email.trim().toLowerCase())}`}`);
      }
    } else {
      toast(result.error, "error");
      // if seats were taken, go back to seat selection and refresh data
      if (result.error.includes("vừa được người khác đặt")) {
        router.refresh();
        setStep("seats");
        setSelectedSeatIds([]);
        setTicketAssignments({});
      }
    }
  }

  const continueLabel: Record<typeof step, string> = {
    seats: selectedSeats.length === 0 ? "Chọn ít nhất 1 ghế" : "Tiếp tục dịch vụ →",
    extras: "Tiếp tục thanh toán →",
    checkout: submitting ? "Đang xử lý..." : `Xác nhận đặt vé`,
  };

  function handleContinue() {
    if (step === "seats") setStep("extras");
    else if (step === "extras") setStep("checkout");
    else submitBooking();
  }

  const continueDisabled = selectedSeats.length === 0 || submitting;

  const [isCartBouncing, setIsCartBouncing] = useState(false);

  useEffect(() => {
    if (finalTotal > 0) {
      const timer = setTimeout(() => setIsCartBouncing(true), 0);
      const reset = setTimeout(() => setIsCartBouncing(false), 450);
      return () => {
        clearTimeout(timer);
        clearTimeout(reset);
      };
    }
  }, [finalTotal]);

  return (
    <div className="mx-auto max-w-[1850px] px-2 sm:px-4 md:px-6 lg:px-8 py-8">
      <BookingProgress current={step} />

      <div className={`mt-8 ${step === "seats" ? "block" : "grid gap-6 xl:gap-8 lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_380px]"}`}>
        {/* Main panel - 100% full width during seat selection */}
        <div className="w-full rounded-3xl border border-border/80 bg-surface/90 p-3 sm:p-6 md:p-8 backdrop-blur shadow-2xl">
          {step === "seats" && (
            <>
              <div className="text-center pb-6 border-b border-border/60">

                <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1 text-xs font-bold text-primary mb-2">
                  <span className="h-2 w-2 rounded-full bg-primary animate-ping" />
                  PHÒNG CHIẾU CAO CẤP: {showtime.room.name}
                </div>
                <h1 className="text-2xl font-black tracking-tight sm:text-3xl font-display">
                  Sơ đồ & Chọn ghế xem phim
                </h1>
                <p className="mt-2 text-xs text-muted max-w-lg mx-auto">
                  Chọn tối đa {MAX_SEATS_PER_BOOKING} ghế mỗi lượt · Cập nhật trạng thái tức thì · Trải nghiệm sơ đồ rạp 3D
                </p>
              </div>

              <div className="mt-8 w-full">
                <SeatMap
                  seats={seats}
                  bookedSeatIds={bookedSet}
                  selectedSeatIds={selectedSeatIds}
                  onToggle={toggleSeat}
                  onAutoPick={handleAutoPick}
                  basePrice={effBasePrice}
                />
              </div>

              {/* Bottom Quick Action Bar inside Seats Step */}
              <div className={`mt-10 pt-6 border-t border-border/80 flex flex-wrap items-center justify-between gap-4 bg-surface-raised/50 p-6 rounded-2xl transition-all ${
                isCartBouncing
                  ? "animate-cart-impact border-amber-400 ring-2 ring-amber-400/50 shadow-amber-500/20"
                  : "border-border-light/80 shadow-black/40"
              }`}>
                <div className="flex items-center gap-4">
                  <div className="relative aspect-[2/3] w-14 shrink-0 overflow-hidden rounded-lg shadow-md border border-border-light hidden sm:block">
                    <PosterImage
                      src={getTmdbImageUrl(showtime.movie.posterUrl, "thumbnail")}
                      alt={showtime.movie.title}
                      fill
                      sizes="56px"
                      quality={95}
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm sm:text-base">{showtime.movie.title}</h3>
                    <p className="text-xs text-muted">
                      {showtime.cinema.name} · {showtime.room.name} · {formatDateTime(showtime.startsAt)}
                    </p>
                    <div className="mt-1 text-xs text-foreground">
                      Ghế đã chọn:{" "}
                      {selectedSeats.length === 0 ? (
                        <span className="text-muted italic">Chưa chọn</span>
                      ) : (
                        <span className="font-bold text-accent">
                          {selectedSeats.map((s) => `${s.row}${s.number}`).join(", ")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 ml-auto">
                  <div className={`text-right transition-transform duration-200 ${isCartBouncing ? "scale-110 text-amber-400 font-extrabold" : ""}`}>
                    <span className="block text-xs text-muted uppercase font-semibold">Tạm tính</span>
                    <span className="text-xl sm:text-2xl font-black text-accent">{formatVnd(finalTotal)}</span>
                  </div>

                  <button
                    type="button"
                    disabled={continueDisabled}
                    onClick={handleContinue}
                    className="rounded-2xl bg-primary px-8 py-4 text-sm font-bold text-on-primary shadow-xl shadow-primary/30 transition-all hover:bg-primary-hover hover:scale-105 disabled:cursor-not-allowed disabled:bg-surface-raised disabled:text-muted-dark disabled:shadow-none"
                  >
                    Tiếp tục bắp nước →
                  </button>
                </div>
              </div>
            </>
          )}

          {step === "extras" && (
            <ExtrasStep
              basePrice={effBasePrice}
              selectedSeats={selectedSeats}
              ticketTypes={ticketTypes}
              ticketAssignments={ticketAssignments}
              onAssignTicket={(seatId, ticketTypeId) => {
                setTicketAssignments((ta) => ({ ...ta, [seatId]: ticketTypeId }));
                setPromo(null);
              }}
              combos={combos}
              comboQuantities={comboQuantities}
              onComboChange={(comboId, quantity) => {
                setComboQuantities((cq) => ({ ...cq, [comboId]: quantity }));
                setPromo(null);
              }}
            />
          )}

          {step === "checkout" && (
            <CheckoutStep
              orderValue={orderValue}
              contact={contact}
              onContactChange={setContact}
              paymentMethod={paymentMethod}
              onPaymentMethodChange={setPaymentMethod}
              promo={promo}
              onPromoChange={setPromo}
              fieldErrors={fieldErrors}
            />
          )}
        </div>

        {/* Sticky summary sidebar for Extras & Checkout steps */}
        {step !== "seats" && (
          <aside className="lg:sticky lg:top-20 lg:self-start">
            <div className="rounded-3xl border border-border/80 bg-surface/90 p-6 backdrop-blur shadow-2xl">
              <div className="flex gap-4">
                <div className="relative aspect-[2/3] w-20 shrink-0 overflow-hidden rounded-xl shadow-lg border border-border-light">
                  <PosterImage
                    src={getTmdbImageUrl(showtime.movie.posterUrl, "thumbnail")}
                    alt={showtime.movie.title}
                    fill
                    priority
                    sizes="80px"
                    quality={95}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="line-clamp-2 font-display text-lg font-extrabold tracking-tight">
                    {showtime.movie.title}
                  </h2>
                  <p className="mt-1 text-xs text-muted">
                    {showtime.format} · <span className="font-bold text-accent">{showtime.movie.ageRating}</span> ·{" "}
                    {showtime.movie.durationMin} phút
                  </p>
                </div>
              </div>

              <dl className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="shrink-0 text-muted">Rạp</dt>
                  <dd className="text-right font-medium">
                    {showtime.cinema.name}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Phòng</dt>
                  <dd className="font-medium">{showtime.room.name}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Suất chiếu</dt>
                  <dd className="font-medium">
                    {formatDateTime(showtime.startsAt)}
                  </dd>
                </div>
              </dl>

              <div className="mt-4 border-t border-border pt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Ghế đã chọn ({selectedSeats.length})
                </p>
                {selectedSeats.length === 0 ? (
                  <p className="mt-2 text-sm text-muted-dark">
                    Chưa chọn ghế nào
                  </p>
                ) : (
                  <ul className="mt-2 space-y-1.5">
                    {selectedSeats.map((seat) => {
                      const ttId = ticketAssignments[seat.id] ?? defaultTicket?.id;
                      const tt = ttId ? ticketById.get(ttId) : undefined;
                      const price = Math.max(
                        0,
                        seatBasePrice(effBasePrice, seat.type) +
                          (tt?.priceModifier ?? 0)
                      );
                      return (
                        <li
                          key={seat.id}
                          className="flex items-center justify-between text-sm"
                        >
                          <span>
                            <span className="font-bold">
                              {seat.row}
                              {seat.number}
                            </span>{" "}
                            <span className="text-xs text-muted">
                              ({SEAT_TYPE_LABELS[seat.type]}
                              {tt && tt.code !== "ADULT" ? ` · ${tt.name}` : ""})
                            </span>
                          </span>
                          <span className="font-medium">{formatVnd(price)}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {combosTotal > 0 && (
                <div className="mt-4 border-t border-border pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                    Combo
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {Object.entries(comboQuantities)
                      .filter(([, qty]) => qty > 0)
                      .map(([comboId, qty]) => {
                        const combo = comboById.get(comboId);
                        if (!combo) return null;
                        return (
                          <li
                            key={comboId}
                            className="flex items-center justify-between text-sm"
                          >
                            <span className="min-w-0 truncate pr-2">
                              {combo.name}{" "}
                              <span className="text-xs text-muted">×{qty}</span>
                            </span>
                            <span className="shrink-0 font-medium">
                              {formatVnd(combo.price * qty)}
                            </span>
                          </li>
                        );
                      })}
                  </ul>
                </div>
              )}

              <div className="mt-4 space-y-1.5 border-t border-border pt-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">Tiền ghế</span>
                  <span>{formatVnd(seatsTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Combo</span>
                  <span>{formatVnd(combosTotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-success">
                    <span>Giảm giá ({promo?.code})</span>
                    <span>−{formatVnd(discount)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-2">
                  <span className="font-semibold">Tổng cộng</span>
                  <span className="text-lg font-bold text-accent">
                    {formatVnd(finalTotal)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                disabled={continueDisabled}
                onClick={handleContinue}
                className="mt-5 w-full rounded-xl bg-primary py-3.5 font-semibold text-on-primary shadow-lg shadow-primary/25 transition-all hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-surface-raised disabled:text-muted-dark disabled:shadow-none"
              >
                {continueLabel[step]}
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={() =>
                  setStep(step === "checkout" ? "extras" : "seats")
                }
                className="mt-3 w-full rounded-xl border border-border py-3 text-sm font-semibold text-muted transition-colors hover:bg-surface-hover hover:text-foreground disabled:opacity-40"
              >
                ← Quay lại
              </button>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
