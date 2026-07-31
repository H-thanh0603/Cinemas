import assert from "node:assert/strict";
import { buildRoomSchedule } from "../src/lib/showtime-schedule";

const day = new Date("2035-01-01T00:00:00");
const movies = [
  { id: "short", durationMin: 90 },
  { id: "long", durationMin: 150 },
];

const slots = buildRoomSchedule(day, movies, {
  openingHour: 10,
  closingHour: 24,
  cleanupMinutes: 15,
  rotation: 0,
});

assert.ok(slots.length > 0, "schedule should contain showtimes");
for (let index = 1; index < slots.length; index++) {
  assert.ok(
    slots[index].startsAt >= slots[index - 1].endsAt,
    "showtimes must not overlap"
  );
}
const closing = new Date(day);
closing.setHours(24, 0, 0, 0);
assert.ok(slots.every((slot) => slot.endsAt <= closing), "showtimes must finish before closing");
assert.deepEqual(
  buildRoomSchedule(day, [], {
    openingHour: 10,
    closingHour: 24,
    cleanupMinutes: 15,
    rotation: 0,
  }),
  []
);

console.log("showtime scheduling checks passed");
