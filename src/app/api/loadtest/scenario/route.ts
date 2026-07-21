import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLockedSeatIds } from "@/lib/booking-expire";
import {
  createBooking,
  completeSandboxPayment,
} from "@/app/booking/actions";
import { SANDBOX_CARD_SUCCESS } from "@/lib/payment-sandbox";

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h;
}

/**
 * Load-test helpers. Disabled unless LOADTEST_SECRET is set and matches
 * header: x-loadtest-secret
 */
function authorized(req: NextRequest): boolean {
  const secret = process.env.LOADTEST_SECRET;
  if (!secret) return false;
  return req.headers.get("x-loadtest-secret") === secret;
}

/** GET — pick a future showtime + free seats for VUs */
export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json(
      { error: "Load test disabled (set LOADTEST_SECRET)" },
      { status: 403 }
    );
  }

  const showtime = await prisma.showtime.findFirst({
    where: {
      status: "SCHEDULED",
      startsAt: { gt: new Date(Date.now() + 3600_000) },
    },
    orderBy: { startsAt: "asc" },
    include: {
      movie: { select: { slug: true, title: true } },
      room: { include: { seats: { where: { isActive: true }, take: 80 } } },
    },
  });

  if (!showtime) {
    return NextResponse.json({ error: "No future showtime" }, { status: 404 });
  }

  const locked = new Set(await getLockedSeatIds(showtime.id));
  const free = showtime.room.seats.filter((s) => !locked.has(s.id));
  const adult = await prisma.ticketType.findFirst({
    where: { code: "ADULT", isActive: true },
  });

  return NextResponse.json({
    showtimeId: showtime.id,
    movieSlug: showtime.movie.slug,
    movieTitle: showtime.movie.title,
    freeSeatIds: free.slice(0, 40).map((s) => s.id),
    freeCount: free.length,
    ticketTypeId: adult?.id ?? null,
    basePrice: showtime.basePrice,
  });
}

/** POST — hold (+ optional sandbox pay) one seat for load test */
export async function POST(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json(
      { error: "Load test disabled (set LOADTEST_SECRET)" },
      { status: 403 }
    );
  }

  let body: {
    showtimeId?: string;
    seatId?: string;
    ticketTypeId?: string;
    pay?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.showtimeId || !body.seatId || !body.ticketTypeId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const vuRaw = req.headers.get("x-vu") ?? String(Date.now());
  const vuSafe = vuRaw.replace(/[^a-zA-Z0-9]/g, "").slice(0, 12) || "0";
  const phoneTail = String(
    100000000 + (Math.abs(hashCode(vuSafe)) % 899999999)
  ).slice(0, 9);
  const result = await createBooking({
    showtimeId: body.showtimeId,
    seats: [{ seatId: body.seatId, ticketTypeId: body.ticketTypeId }],
    combos: [],
    contact: {
      name: `Load VU ${vuSafe}`,
      email: `loadtest+${vuSafe}@example.com`,
      phone: `0${phoneTail}`, // 10 digits
    },
    paymentMethod: "CREDIT_CARD",
  });

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: 409 }
    );
  }

  if (body.pay) {
    const paid = await completeSandboxPayment({
      code: result.data.code,
      cardNumber: SANDBOX_CARD_SUCCESS,
    });
    if (!paid.ok) {
      return NextResponse.json(
        { ok: false, stage: "pay", error: paid.error, code: result.data.code },
        { status: 402 }
      );
    }
    return NextResponse.json({
      ok: true,
      code: result.data.code,
      status: "CONFIRMED",
    });
  }

  return NextResponse.json({
    ok: true,
    code: result.data.code,
    status: result.data.status,
    needsPayment: result.data.needsPayment,
  });
}
