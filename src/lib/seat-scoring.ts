import type { SeatDto } from "@/components/booking/types";

/**
 * Score one seat by viewing quality: distance to screen + horizontal angle.
 * Peak at middle row, center column. Pure function.
 */
export function scoreSeat(seat: SeatDto, rowsCount: number, colsCount: number): number {
  const rowIndex = Math.max(0, Math.min(rowsCount - 1, seat.row.charCodeAt(0) - 65)); // "A" = 0
  const rowProgress = rowsCount <= 1 ? 0.5 : rowIndex / (rowsCount - 1);
  const rowScore = 1 - Math.abs(rowProgress - 0.5) * 2;

  const colProgress = colsCount <= 1 ? 0.5 : (seat.number - 1) / (colsCount - 1);
  const colScore = 1 - Math.abs(colProgress - 0.5) * 2;

  let score = rowScore * 2 + colScore;
  if (seat.type === "VIP") score += 0.25;
  return score;
}

/**
 * Pick the best contiguous group of `count` free seats in one row.
 * Returns [] when nothing fits.
 */
export function pickBestSeats(
  seats: SeatDto[],
  count: number,
  bookedSeatIds: Set<string>
): SeatDto[] {
  if (count <= 0 || seats.length === 0) return [];

  const colsCount = new Set(seats.map((s) => s.number)).size;
  const rows = [...new Set(seats.map((s) => s.row))].sort();
  const isFree = (s: SeatDto) => s.isActive && !bookedSeatIds.has(s.id);

  let best: { group: SeatDto[]; score: number } | null = null;

  for (const row of rows) {
    const fullRow = seats.filter((s) => s.row === row).sort((a, b) => a.number - b.number);
    for (let i = 0; i + count <= fullRow.length; i++) {
      const window = fullRow.slice(i, i + count);
      // physically contiguous (no gap from inactive/removed seats) AND all free
      if (!window.every((s, j) => j === 0 || s.number === window[j - 1].number + 1)) continue;
      if (!window.every(isFree)) continue;

      const avg =
        window.reduce((sum, s) => sum + scoreSeat(s, rows.length, colsCount), 0) / count;
      if (!best || avg > best.score) best = { group: window, score: avg };
      break; // first valid run per row suffices — later runs sit closer to the aisle
    }
  }

  return best ? best.group : [];
}
