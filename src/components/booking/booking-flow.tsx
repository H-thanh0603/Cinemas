"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useToast } from "@/components/ui/toast";
import {
  MAX_SEATS_PER_BOOKING,
  SEAT_TYPE_LABELS,
  formatDateTime,
  formatVnd,
} from "@/lib/constants";
import { seatBasePrice } from "@/lib/booking";
import { BookingProgress } from "./progress";
import { SeatMap } from "./seat-map";
import type { ComboDto, SeatDto, ShowtimeDto, TicketTypeDto } from "./types";

type BookingFlowProps = {
  showtime: ShowtimeDto;
  seats: SeatDto[];
  bookedSeatIds: string[];
  ticketTypes: TicketTypeDto[];
  combos: ComboDto[];
};

export function BookingFlow({
  showtime,
  seats,
  bookedSeatIds,
  ticketTypes,
  combos,
}: BookingFlowProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<"seats" | "extras" | "checkout">("seats");
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);

  const bookedSet = useMemo(() => new Set(bookedSeatIds), [bookedSeatIds]);
  const seatById = useMemo(
    () => new Map(seats.map((s) => [s.id, s])),
    [seats]
  );

  const selectedSeats = selectedSeatIds
    .map((id) => seatById.get(id))
    .filter((s): s is SeatDto => Boolean(s));

  const seatsTotal = selectedSeats.reduce(
    (sum, s) => sum + seatBasePrice(showtime.basePrice, s.type),
    0
  );

  function toggleSeat(seat: SeatDto) {
    setSelectedSeatIds((prev) => {
      if (prev.includes(seat.id)) {
        return prev.filter((id) => id !== seat.id);
      }
      if (prev.length >= MAX_SEATS_PER_BOOKING) {
        toast(
          `Bạn chỉ có thể chọn tối đa ${MAX_SEATS_PER_BOOKING} ghế mỗi lần đặt`,
          "error"
        );
        return prev;
      }
      return [...prev, seat.id];
    });
  }

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
              ticketTypes={ticketTypes}
              combos={combos}
              selectedSeats={selectedSeats}
              showtime={showtime}
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
              <div className="flex justify-between">
                <dt className="text-muted">Rạp</dt>
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
                  {selectedSeats.map((seat) => (
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
                          ({SEAT_TYPE_LABELS[seat.type]})
                        </span>
                      </span>
                      <span className="font-medium">
                        {formatVnd(seatBasePrice(showtime.basePrice, seat.type))}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
              <span className="font-semibold">Tạm tính</span>
              <span className="text-lg font-bold text-accent">
                {formatVnd(seatsTotal)}
              </span>
            </div>

            {step === "seats" && (
              <button
                type="button"
                disabled={selectedSeats.length === 0}
                onClick={() => setStep("extras")}
                className="mt-5 w-full rounded-xl bg-primary py-3.5 font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-surface-raised disabled:text-muted-dark disabled:shadow-none"
              >
                {selectedSeats.length === 0
                  ? "Chọn ít nhất 1 ghế"
                  : "Tiếp tục →"}
              </button>
            )}

            {step === "extras" && (
              <button
                type="button"
                onClick={() => setStep("seats")}
                className="mt-5 w-full rounded-xl border border-border py-3 text-sm font-semibold text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
              >
                ← Quay lại chọn ghế
              </button>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function ExtrasStep(_props: {
  ticketTypes: TicketTypeDto[];
  combos: ComboDto[];
  selectedSeats: SeatDto[];
  showtime: ShowtimeDto;
}) {
  return (
    <div className="py-12 text-center">
      <span className="text-5xl">🎟️</span>
      <h2 className="mt-4 text-xl font-bold">Chọn loại vé & combo</h2>
      <p className="mt-2 text-sm text-muted">
        Bước này đang được hoàn thiện trong giai đoạn tiếp theo.
      </p>
    </div>
  );
}
