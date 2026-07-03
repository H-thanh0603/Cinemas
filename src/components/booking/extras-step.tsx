"use client";

import Image from "next/image";
import { SEAT_TYPE_LABELS, formatVnd } from "@/lib/constants";
import { seatBasePrice } from "@/lib/booking";
import type { ComboDto, SeatDto, TicketTypeDto } from "./types";

type ExtrasStepProps = {
  basePrice: number;
  selectedSeats: SeatDto[];
  ticketTypes: TicketTypeDto[];
  ticketAssignments: Record<string, string>;
  onAssignTicket: (seatId: string, ticketTypeId: string) => void;
  combos: ComboDto[];
  comboQuantities: Record<string, number>;
  onComboChange: (comboId: string, quantity: number) => void;
};

const categoryLabels: Record<string, string> = {
  COMBO: "Combo",
  POPCORN: "Bắp rang",
  DRINK: "Nước uống",
  SNACK: "Snack",
};

export function ExtrasStep({
  basePrice,
  selectedSeats,
  ticketTypes,
  ticketAssignments,
  onAssignTicket,
  combos,
  comboQuantities,
  onComboChange,
}: ExtrasStepProps) {
  const categories = [...new Set(combos.map((c) => c.category))];

  return (
    <div>
      <h1 className="text-xl font-bold">Loại vé cho từng ghế</h1>
      <p className="mt-1 text-xs text-muted">
        Vé HSSV/Trẻ em cần xuất trình giấy tờ khi vào rạp
      </p>

      <div className="mt-5 space-y-3">
        {selectedSeats.map((seat) => {
          const assigned = ticketAssignments[seat.id];
          return (
            <div
              key={seat.id}
              className="flex flex-col gap-3 rounded-xl border border-border bg-surface-raised p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <span className="font-bold">
                  Ghế {seat.row}
                  {seat.number}
                </span>{" "}
                <span className="text-xs text-muted">
                  ({SEAT_TYPE_LABELS[seat.type]} ·{" "}
                  {formatVnd(seatBasePrice(basePrice, seat.type))})
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {ticketTypes.map((tt) => {
                  const price = Math.max(
                    0,
                    seatBasePrice(basePrice, seat.type) + tt.priceModifier
                  );
                  const active = assigned === tt.id;
                  return (
                    <button
                      key={tt.id}
                      type="button"
                      onClick={() => onAssignTicket(seat.id, tt.id)}
                      className={`rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
                        active
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted hover:border-border-light hover:text-foreground"
                      }`}
                    >
                      <span className="block font-semibold">{tt.name}</span>
                      <span className="block">{formatVnd(price)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <h2 className="mt-10 text-xl font-bold">Bắp nước & Combo</h2>
      <p className="mt-1 text-xs text-muted">
        Đặt trước để nhận ngay tại quầy, không cần xếp hàng
      </p>

      {categories.map((cat) => (
        <div key={cat} className="mt-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">
            {categoryLabels[cat] ?? cat}
          </h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {combos
              .filter((c) => c.category === cat)
              .map((combo) => {
                const qty = comboQuantities[combo.id] ?? 0;
                return (
                  <div
                    key={combo.id}
                    className={`flex gap-3 rounded-xl border p-3 transition-colors ${
                      qty > 0
                        ? "border-primary/50 bg-primary/5"
                        : "border-border bg-surface-raised"
                    }`}
                  >
                    {combo.imageUrl && (
                      <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg">
                        <Image
                          src={combo.imageUrl}
                          alt={combo.name}
                          fill
                          sizes="96px"
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="text-sm font-semibold">
                        {combo.name}
                      </span>
                      <span className="line-clamp-1 text-xs text-muted">
                        {combo.description}
                      </span>
                      <div className="mt-auto flex items-center justify-between pt-1">
                        <span className="text-sm font-bold text-accent">
                          {formatVnd(combo.price)}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              onComboChange(combo.id, Math.max(0, qty - 1))
                            }
                            disabled={qty === 0}
                            className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-sm font-bold text-muted transition-colors hover:bg-surface-hover disabled:opacity-30"
                            aria-label={`Giảm ${combo.name}`}
                          >
                            −
                          </button>
                          <span className="w-5 text-center text-sm font-bold">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              onComboChange(combo.id, Math.min(10, qty + 1))
                            }
                            disabled={qty >= 10}
                            className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-sm font-bold text-muted transition-colors hover:bg-surface-hover disabled:opacity-30"
                            aria-label={`Tăng ${combo.name}`}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}
