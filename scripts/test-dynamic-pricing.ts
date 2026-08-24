// Self-check for time-slot pricing: npx tsx scripts/test-dynamic-pricing.ts
import {
  effectiveBasePrice,
  timeSlotMultiplier,
  WEEKEND_MULTIPLIER,
  PEAK_EVENING_MULTIPLIER,
} from "../src/lib/booking-pricing";

let failures = 0;
function check(name: string, cond: boolean) {
  if (!cond) {
    failures++;
    console.error(`FAIL: ${name}`);
  } else {
    console.log(`ok: ${name}`);
  }
}

// Fixed dates: 2026-08-22 is a Saturday, 2026-08-26 a Wednesday (Asia/Ho_Chi_Minh = UTC+7).
const d = (isoUtc: string) => new Date(isoUtc);

// Saturday 10:00 VN = 03:00 UTC
check("weekend gets weekend multiplier", timeSlotMultiplier(d("2026-08-22T03:00:00Z")) === WEEKEND_MULTIPLIER);
// Wednesday 20:00 VN = 13:00 UTC
check("weekday evening gets peak multiplier", timeSlotMultiplier(d("2026-08-26T13:00:00Z")) === PEAK_EVENING_MULTIPLIER);
// Wednesday 14:00 VN = 07:00 UTC
check("weekday afternoon gets base multiplier", timeSlotMultiplier(d("2026-08-26T07:00:00Z")) === 1);
// Wednesday 02:00 VN = 19:00 UTC previous day — must NOT count as evening in VN
check("VN hour used, not UTC hour", timeSlotMultiplier(d("2026-08-25T19:00:00Z")) === 1);

// Price rounding: 87_500 * 1.1 = 96_250 -> 96_000; 90_000 * 1.2 = 108_000 exact
check("rounds to nearest 1000", effectiveBasePrice(87500, d("2026-08-26T13:00:00Z")) === 96000);
check("exact multiplication unchanged", effectiveBasePrice(90000, d("2026-08-22T03:00:00Z")) === 108000);

if (failures > 0) {
  console.error(`${failures} failure(s)`);
  process.exit(1);
}
console.log("all dynamic-pricing checks passed");
