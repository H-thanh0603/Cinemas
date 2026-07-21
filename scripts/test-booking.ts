import { PrismaClient } from "@prisma/client";
import {
  createBooking,
  completeSandboxPayment,
  validatePromotion,
} from "../src/app/booking/actions";
import { SANDBOX_CARD_FAIL, SANDBOX_CARD_SUCCESS } from "../src/lib/payment-sandbox";

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

  const locked = new Set(
    (
      await prisma.showtimeSeatLock.findMany({
        where: { showtimeId: showtime.id },
        select: { seatId: true },
      })
    ).map((b) => b.seatId)
  );

  const freeSeats = showtime.room.seats.filter(
    (s) => s.isActive && !locked.has(s.id)
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

  console.log("\n[1] Happy path — hold + sandbox pay");
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
      include: { seats: true, combos: true, payment: true, seatLocks: true },
    });
    check("status PENDING after create", b?.status === "PENDING");
    check("needsPayment true for e-wallet", r1.data.needsPayment === true);
    check("seat locks created", (b?.seatLocks.length ?? 0) === 2);
    check("payment UNPAID until sandbox", b?.payment?.status === "UNPAID");
    check("expiresAt set", b?.expiresAt != null);

    const paid = await completeSandboxPayment({
      code: r1.data.code,
      outcome: "success",
    });
    check("sandbox pay ok", paid.ok, paid.ok ? "" : paid.error);
    const b2 = await prisma.booking.findUnique({
      where: { code: r1.data.code },
      include: { payment: true },
    });
    check("status CONFIRMED after pay", b2?.status === "CONFIRMED");
    check("payment PAID", b2?.payment?.status === "PAID");
    check("sandboxTxnId set", !!b2?.payment?.sandboxTxnId);

    const expectSeats =
      Math.max(0, showtime.basePrice + surcharge(freeSeats[0].type) + adult.priceModifier) +
      Math.max(0, showtime.basePrice + surcharge(freeSeats[1].type) + student.priceModifier);
    check("seatsTotal computed correctly", b?.seatsTotal === expectSeats);
  }

  console.log("\n[2] Duplicate seat booking must fail (DB lock)");
  const r2 = await createBooking({
    showtimeId: showtime.id,
    seats: [{ seatId: freeSeats[0].id, ticketTypeId: adult.id }],
    combos: [],
    contact,
    paymentMethod: "CREDIT_CARD",
  });
  check("double booking rejected", !r2.ok);

  console.log("\n[3] Card sandbox fail");
  const r3 = await createBooking({
    showtimeId: showtime.id,
    seats: [{ seatId: freeSeats[4].id, ticketTypeId: adult.id }],
    combos: [],
    contact,
    paymentMethod: "CREDIT_CARD",
  });
  check("card hold created", r3.ok, r3.ok ? "" : r3.error);
  if (r3.ok) {
    const fail = await completeSandboxPayment({
      code: r3.data.code,
      cardNumber: SANDBOX_CARD_FAIL,
    });
    check("fail card rejected", !fail.ok);
    const ok = await completeSandboxPayment({
      code: r3.data.code,
      cardNumber: SANDBOX_CARD_SUCCESS,
    });
    check("success card accepted", ok.ok, ok.ok ? "" : ok.error);
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
    seats: [{ seatId: freeSeats[5].id, ticketTypeId: adult.id }],
    combos: [],
    contact: { ...contact, email: "not-an-email" },
    paymentMethod: "CREDIT_CARD",
  });
  check("bad email rejected", !r4b.ok);

  console.log("\n[5] AT_COUNTER hold");
  const r5 = await createBooking({
    showtimeId: showtime.id,
    seats: [{ seatId: freeSeats[6].id, ticketTypeId: adult.id }],
    combos: [{ comboId: combo.id, quantity: 1 }],
    promotionCode: "WELCOME10",
    contact,
    paymentMethod: "AT_COUNTER",
  });
  check("counter booking created", r5.ok, r5.ok ? "" : r5.error);
  if (r5.ok) {
    check("needsPayment false", r5.data.needsPayment === false);
    const b = await prisma.booking.findUnique({
      where: { code: r5.data.code },
      include: { payment: true, seatLocks: true },
    });
    check("PENDING hold", b?.status === "PENDING");
    check("UNPAID", b?.payment?.status === "UNPAID");
    check("lock exists", (b?.seatLocks.length ?? 0) === 1);
    check("discount applied", (b?.discountTotal ?? 0) > 0);
  }

  console.log("\n[6] Promo validation");
  const p1 = await validatePromotion("WELCOME10", 200000);
  check("valid promo", p1.ok === true);

  // cleanup
  const cleanup = await prisma.booking.findMany({
    where: { contactEmail: "test@example.com" },
    select: { id: true },
  });
  await prisma.showtimeSeatLock.deleteMany({
    where: { bookingId: { in: cleanup.map((b) => b.id) } },
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
