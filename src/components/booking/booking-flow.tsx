"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useToast } from "@/components/ui/toast";
import { createBooking } from "@/app/booking/actions";
import {
  MAX_SEATS_PER_BOOKING,
  SEAT_TYPE_LABELS,
  formatDateTime,
  formatVnd,
} from "@/lib/constants";
import { seatBasePrice } from "@/lib/booking";
import { BookingProgress } from "./progress";
import { SeatMap } from "./seat-map";
import { ExtrasStep } from "./extras-step";
import {
  CheckoutStep,
  type ContactInfo,
  type PromoState,
} from "./checkout-step";
import type { ComboDto, SeatDto, ShowtimeDto, TicketTypeDto } from "./types";

type BookingFlowProps = {
  showtime: ShowtimeDto;
  seats: SeatDto[];
  bookedSeatIds: string[];
  ticketTypes: TicketTypeDto[];
  combos: ComboDto[];
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^0\d{9,10}$/;

export function BookingFlow({
  showtime,
  seats,
  bookedSeatIds,
  ticketTypes,
  combos,
}: BookingFlowProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [step, setStep] = useState<"seats" | "extras" | "checkout">("seats");
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [ticketAssignments, setTicketAssignments] = useState<
    Record<string, string>
  >({});
  const [comboQuantities, setComboQuantities] = useState<
    Record<string, number>
  >({});
  const [contact, setContact] = useState<ContactInfo>({
    name: "",
    email: "",
    phone: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("CREDIT_CARD");
  const [promo, setPromo] = useState<PromoState>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof ContactInfo, string>>
  >({});
  const [submitting, setSubmitting] = useState(false);

  const bookedSet = useMemo(() => new Set(bookedSeatIds), [bookedSeatIds]);
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
  const seatsTotal = selectedSeats.reduce((sum, seat) => {
    const ttId = ticketAssignments[seat.id] ?? defaultTicket?.id;
    const tt = ttId ? ticketById.get(ttId) : undefined;
    return (
      sum +
      Math.max(
        0,
        seatBasePrice(showtime.basePrice, seat.type) + (tt?.priceModifier ?? 0)
      )
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
    setSubmitting(true);
    const result = await createBooking({
      showtimeId: showtime.id,
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
      toast("Đặt vé thành công!", "success");
      router.push(`/booking/confirmation/${result.data.code}`);
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
    seats: selectedSeats.length === 0 ? "Chọn ít nhất 1 ghế" : "Tiếp tục →",
    extras: "Tiếp tục thanh toán →",
    checkout: submitting ? "Đang xử lý..." : `Xác nhận đặt vé`,
  };

  function handleContinue() {
    if (step === "seats") setStep("extras");
    else if (step === "extras") setStep("checkout");
    else submitBooking();
  }

  const continueDisabled =
    selectedSeats.length === 0 || submitting;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <BookingProgress current={step} />

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Main panel */}
        <div className="min-w-0 rounded-2xl border border-border bg-surface p-6">
          {step === "seats" && (
            <>
              <h1 className="text-center text-xl font-bold">
                Chọn ghế — {showtime.room.name}
              </h1>
              <p className="mt-1 text-center text-xs text-muted">
                Tối đa {MAX_SEATS_PER_BOOKING} ghế mỗi lần đặt
              </p>
              <div className="mt-8">
                <SeatMap
                  seats={seats}
                  bookedSeatIds={bookedSet}
                  selectedSeatIds={selectedSeatIds}
                  onToggle={toggleSeat}
                />
              </div>
            </>
          )}

          {step === "extras" && (
            <ExtrasStep
              basePrice={showtime.basePrice}
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

        {/* Sticky summary sidebar */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-2xl border border-border bg-surface p-5">
            <div className="flex gap-4">
              <div className="relative aspect-[2/3] w-16 shrink-0 overflow-hidden rounded-lg">
                <Image
                  src={showtime.movie.posterUrl}
                  alt={showtime.movie.title}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0">
                <h2 className="line-clamp-2 font-bold">
                  {showtime.movie.title}
                </h2>
                <p className="mt-1 text-xs text-muted">
                  {showtime.format} · {showtime.movie.ageRating} ·{" "}
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
                      seatBasePrice(showtime.basePrice, seat.type) +
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
              className="mt-5 w-full rounded-xl bg-primary py-3.5 font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-surface-raised disabled:text-muted-dark disabled:shadow-none"
            >
              {continueLabel[step]}
            </button>

            {step !== "seats" && (
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
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
