import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLockedSeatIds } from "@/lib/booking-expire";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: showtimeId } = await params;

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
