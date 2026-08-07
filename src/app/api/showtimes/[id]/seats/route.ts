import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLockedSeatIds } from "@/lib/booking-expire";
import { checkApiRateLimit } from "@/lib/api-rate-limit";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: showtimeId } = await params;

  const rateLimited = await checkApiRateLimit(req.headers, "seats", 60, 60_000);
  if (!rateLimited.allowed) {
    return NextResponse.json(
      { error: "Too many requests", retryAfterSeconds: rateLimited.retryAfterSeconds },
      { status: 429, headers: { "Retry-After": String(rateLimited.retryAfterSeconds) } }
    );
  }

  const showtime = await prisma.showtime.findUnique({
    where: { id: showtimeId },
    select: { id: true, status: true },
  });
  if (!showtime) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const bookedSeatIds = await getLockedSeatIds(showtimeId);

  return NextResponse.json({
    showtimeId,
    bookedSeatIds,
    serverTime: new Date().toISOString(),
  });
}
