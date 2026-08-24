// Self-check for seat-scoring lib: npx tsx scripts/test-seat-scoring.ts
import { pickBestSeats, scoreSeat } from "../src/lib/seat-scoring";
import type { SeatDto } from "../src/components/booking/types";

let failures = 0;
function check(name: string, cond: boolean) {
  if (!cond) {
    failures++;
    console.error(`FAIL: ${name}`);
  } else {
    console.log(`ok: ${name}`);
  }
}

const seat = (row: string, number: number, type = "NORMAL", isActive = true): SeatDto => ({
  id: `${row}${number}`,
  row,
  number,
  type,
  isActive,
});

// Room 4 rows (A-D) x 10 cols; booked/inactive by seat label like "B5"
const room = (_bookedIds: string[] = [], inactiveIds: string[] = []) =>
  ["A", "B", "C", "D"].flatMap((r) =>
    Array.from({ length: 10 }, (_, i) => {
      const s = seat(r, i + 1);
      return { ...s, isActive: !inactiveIds.includes(s.id) };
    })
  );

// 1. Middle-center preferred over front row / edge
{
  const best = pickBestSeats(room(), 2, new Set());
  const labels = best.map((s) => `${s.row}${s.number}`).join(",");
  check(
    `picks middle-center pair, got ${labels}`,
    best.length === 2 && (best[0].row === "B" || best[0].row === "C")
  );
}

// 2. Skips booked seats — contiguous group must avoid them
{
  const booked = new Set(["B5", "B6"]);
  const all = room();
  const best = pickBestSeats(all, 2, booked);
  check(`no overlap with booked seats`, best.length === 2 && !best.some((s) => booked.has(s.id)));
  check(`booked pair B5-B6 excluded from pick`, !best.some((s) => s.row === "B" && (s.number === 5 || s.number === 6)));
}

// 3. Gap from inactive seat breaks contiguity
{
  const best = pickBestSeats(room([], ["B6"]), 2, new Set());
  check(`never spans a gap`, !best.some((s) => s.row === "B" && s.number === 5));
}

// 4. Returns [] when nothing fits
{
  const seats = [seat("A", 1), seat("A", 2)];
  check(`returns [] when too few seats`, pickBestSeats(seats, 5, new Set()).length === 0);
}

// 5. Score shape: center beats edge on same row, VIP bonus applies
check(`center beats edge`, scoreSeat(seat("B", 5), 4, 10) > scoreSeat(seat("B", 1), 4, 10));
check(`VIP bonus applies`, scoreSeat(seat("B", 5, "VIP"), 4, 10) > scoreSeat(seat("B", 5), 4, 10));

if (failures > 0) {
  console.error(`${failures} failure(s)`);
  process.exit(1);
}
console.log("all seat-scoring checks passed");
