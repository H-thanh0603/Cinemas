import { PrismaClient } from "@prisma/client";
import { createBooking, validatePromotion } from "../src/app/booking/actions";

const prisma = new PrismaClient();

let passed = 0;
let failed = 0;

function check(name: string, cond: boolean, detail?: string) {
  if (cond) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

async function main() {
  const showtime = await prisma.showtime.findFirst({
    where: { startsAt: { gt: new Date(Date.now() + 24 * 3600_000) } },
    include: { room: { include: { seats: true } } },
  });
  if (!showtime) throw new Error("No future showtime found — run seed first");

  const bookedSeatIds = new Set(
    (
      await prisma.bookingSeat.findMany({
        where: {
          booking: {
            showtimeId: showtime.id,
            status: { in: ["PENDING", "CONFIRMED"] },
          },
        },
        select: { seatId: true },
      })
    ).map((b) => b.seatId)
  );

  const freeSeats = showtime.room.seats.filter(
    (s) => s.isActive && !bookedSeatIds.has(s.id)
  );
  const adult = await prisma.ticketType.findUniqueOrThrow({
    where: { code: "ADULT" },
  });
  const student = await prisma.ticketType.findUniqueOrThrow({
    where: { code: "STUDENT" },
  });
  const combo = await prisma.foodCombo.findFirstOrThrow({
    where: { isActive: true },
  });

  const contact = {
    name: "Người Kiểm Thử",
    email: "test@example.com",
    phone: "0912345678",
  };

  console.log("\n[1] Happy path — create booking");
  const r1 = await createBooking({
    showtimeId: showtime.id,
    seats: [
      { seatId: freeSeats[0].id, ticketTypeId: adult.id },
      { seatId: freeSeats[1].id, ticketTypeId: student.id },
    ],
    combos: [{ comboId: combo.id, quantity: 2 }],
    contact,
    paymentMethod: "E_WALLET",
  });
  check("booking created", r1.ok, r1.ok ? "" : r1.error);
  if (r1.ok) {
    const b = await prisma.booking.findUnique({
      where: { code: r1.data.code },
      include: { seats: true, combos: true, payment: true },
    });
    check("booking code format", /^CS-[A-Z0-9]{6}$/.test(r1.data.code));
    check("2 seats stored", b?.seats.length === 2);
    check("combo stored", b?.combos[0]?.quantity === 2);
    check("payment PAID for e-wallet", b?.payment?.status === "PAID");
    const expectSeats =
      Math.max(0, showtime.basePrice + surcharge(freeSeats[0].type) + adult.priceModifier) +
      Math.max(0, showtime.basePrice + surcharge(freeSeats[1].type) + student.priceModifier);
    check(
      "seatsTotal computed correctly",
      b?.seatsTotal === expectSeats,
      `expected ${expectSeats}, got ${b?.seatsTotal}`
    );
    check(
      "finalTotal = seats + combos - discount",
      b?.finalTotal === (b?.seatsTotal ?? 0) + (b?.combosTotal ?? 0) - (b?.discountTotal ?? 0)
    );
  }

  console.log("\n[2] Duplicate seat booking must fail");
  const r2 = await createBooking({
    showtimeId: showtime.id,
    seats: [{ seatId: freeSeats[0].id, ticketTypeId: adult.id }],
    combos: [],
    contact,
    paymentMethod: "CREDIT_CARD",
  });
  check("double booking rejected", !r2.ok);

  console.log("\n[3] Past showtime must fail");
  const past = await prisma.showtime.findFirst({
    where: { startsAt: { lt: new Date() } },
    include: { room: { include: { seats: { take: 1 } } } },
  });
  if (past) {
    const r3 = await createBooking({
      showtimeId: past.id,
      seats: [{ seatId: past.room.seats[0].id, ticketTypeId: adult.id }],
      combos: [],
      contact,
      paymentMethod: "CREDIT_CARD",
    });
    check("past showtime rejected", !r3.ok);
  } else {
    console.log("  (skipped — no past showtime)");
  }

  console.log("\n[4] Validation failures");
  const r4a = await createBooking({
    showtimeId: showtime.id,
    seats: [],
    combos: [],
    contact,
    paymentMethod: "CREDIT_CARD",
  });
  check("empty seats rejected", !r4a.ok);

  const r4b = await createBooking({
    showtimeId: showtime.id,
    seats: [{ seatId: freeSeats[2].id, ticketTypeId: adult.id }],
    combos: [],
    contact: { ...contact, email: "not-an-email" },
    paymentMethod: "CREDIT_CARD",
  });
  check("bad email rejected", !r4b.ok);

  const r4c = await createBooking({
    showtimeId: showtime.id,
    seats: freeSeats.slice(2, 11).map((s) => ({ seatId: s.id, ticketTypeId: adult.id })),
    combos: [],
    contact,
    paymentMethod: "CREDIT_CARD",
  });
  check("9 seats (over limit) rejected", !r4c.ok);

  console.log("\n[5] Promotion validation");
  const p1 = await validatePromotion("WELCOME10", 200000);
  check("valid promo accepted", p1.ok && p1.data.discount === 20000);
  const p2 = await validatePromotion("HETHAN", 200000);
  check("expired promo rejected", !p2.ok);
  const p3 = await validatePromotion("KHONGTONTAI", 200000);
  check("unknown promo rejected", !p3.ok);
  const p4 = await validatePromotion("T2VUIVE", 100000);
  check("min order not met rejected", !p4.ok);

  console.log("\n[6] Booking with promo");
  const r6 = await createBooking({
    showtimeId: showtime.id,
    seats: [{ seatId: freeSeats[3].id, ticketTypeId: adult.id }],
    combos: [{ comboId: combo.id, quantity: 1 }],
    promotionCode: "WELCOME10",
    contact,
    paymentMethod: "AT_COUNTER",
  });
  check("promo booking created", r6.ok, r6.ok ? "" : r6.error);
  if (r6.ok) {
    const b = await prisma.booking.findUnique({
      where: { code: r6.data.code },
      include: { payment: true },
    });
    check("discount applied", (b?.discountTotal ?? 0) > 0);
    check("AT_COUNTER stays UNPAID", b?.payment?.status === "UNPAID");
  }

  // cleanup test bookings
  const cleanup = await prisma.booking.findMany({
    where: { contactEmail: "test@example.com" },
    select: { id: true },
  });
  await prisma.booking.deleteMany({
    where: { id: { in: cleanup.map((b) => b.id) } },
  });
  console.log(`\n🧹 Cleaned up ${cleanup.length} test bookings`);

  console.log(`\nResult: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

function surcharge(type: string) {
  return type === "VIP" ? 30000 : type === "COUPLE" ? 60000 : 0;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
