"use client";

import type { SeatDto } from "./types";

type SeatMapProps = {
  seats: SeatDto[];
  bookedSeatIds: Set<string>;
  selectedSeatIds: string[];
  onToggle: (seat: SeatDto) => void;
};

function seatClasses(state: string, type: string): string {
  const base =
    "flex items-center justify-center rounded-t-lg rounded-b-sm text-[10px] font-bold transition-all select-none";
  const size = type === "COUPLE" ? "h-8 w-16" : "h-8 w-8";

  switch (state) {
    case "selected":
      return `${base} ${size} cursor-pointer bg-primary text-white shadow-lg shadow-primary/40 scale-105`;
    case "booked":
      return `${base} ${size} cursor-not-allowed bg-muted-dark/40 text-muted-dark line-through`;
    case "disabled":
      return `${base} ${size} cursor-not-allowed border border-dashed border-border text-muted-dark opacity-40`;
    default:
      // available
      if (type === "VIP")
        return `${base} ${size} cursor-pointer border border-accent/50 bg-accent/10 text-accent hover:bg-accent/25`;
      if (type === "COUPLE")
        return `${base} ${size} cursor-pointer border border-pink-400/50 bg-pink-400/10 text-pink-300 hover:bg-pink-400/25`;
      return `${base} ${size} cursor-pointer border border-border-light bg-surface-raised text-muted hover:bg-surface-hover hover:text-foreground`;
  }
}

export function SeatMap({
  seats,
  bookedSeatIds,
  selectedSeatIds,
  onToggle,
}: SeatMapProps) {
  // group seats by row
  const rows = new Map<string, SeatDto[]>();
  for (const seat of seats) {
    if (!rows.has(seat.row)) rows.set(seat.row, []);
    rows.get(seat.row)!.push(seat);
  }
  const sortedRows = [...rows.entries()].sort(([a], [b]) =>
    a.localeCompare(b)
  );
  for (const [, rowSeats] of sortedRows) {
    rowSeats.sort((a, b) => a.number - b.number);
  }

  return (
    <div className="overflow-x-auto">
      <div className="mx-auto w-fit min-w-0 px-4">
        {/* Screen */}
        <div className="mb-8">
          <div className="screen-glow mx-auto h-2 w-4/5 rounded-full bg-gradient-to-r from-transparent via-primary/80 to-transparent" />
          <p className="mt-2 text-center text-[11px] font-semibold uppercase tracking-[0.35em] text-muted">
            Màn hình
          </p>
        </div>

        {/* Rows */}
        <div className="space-y-2">
          {sortedRows.map(([rowLabel, rowSeats]) => (
            <div key={rowLabel} className="flex items-center gap-2">
              <span className="w-5 text-center text-xs font-bold text-muted">
                {rowLabel}
              </span>
              <div className="flex gap-1.5">
                {rowSeats.map((seat) => {
                  const state = !seat.isActive
                    ? "disabled"
                    : bookedSeatIds.has(seat.id)
                      ? "booked"
                      : selectedSeatIds.includes(seat.id)
                        ? "selected"
                        : "available";
                  const clickable = state === "available" || state === "selected";
                  return (
                    <button
                      key={seat.id}
                      type="button"
                      disabled={!clickable}
                      onClick={() => clickable && onToggle(seat)}
                      className={seatClasses(state, seat.type)}
                      aria-label={`Ghế ${rowLabel}${seat.number} (${seat.type})`}
                      title={`${rowLabel}${seat.number}`}
                    >
                      {rowLabel}
                      {seat.number}
                    </button>
                  );
                })}
              </div>
              <span className="w-5 text-center text-xs font-bold text-muted">
                {rowLabel}
              </span>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <span className="h-4 w-4 rounded-t-md rounded-b-sm border border-border-light bg-surface-raised" />
            Ghế thường
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-4 w-4 rounded-t-md rounded-b-sm border border-accent/50 bg-accent/10" />
            Ghế VIP
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-4 w-7 rounded-t-md rounded-b-sm border border-pink-400/50 bg-pink-400/10" />
            Ghế đôi
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-4 w-4 rounded-t-md rounded-b-sm bg-primary" />
            Đang chọn
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-4 w-4 rounded-t-md rounded-b-sm bg-muted-dark/40" />
            Đã bán
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-4 w-4 rounded-t-md rounded-b-sm border border-dashed border-border opacity-50" />
            Không khả dụng
          </span>
        </div>
      </div>
    </div>
  );
}
