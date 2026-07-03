import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const showtime = await prisma.showtime.findUnique({ where: { id } });
  if (!showtime) {
    return NextResponse.json({ error: "Không tìm thấy suất chiếu" }, { status: 404 });
  }

  // Check for confirmed bookings
  const confirmedBookings = await prisma.booking.count({
    where: { showtimeId: id, status: "CONFIRMED" },
  });

  if (confirmedBookings > 0) {
    // Mark as cancelled instead of deleting
    await prisma.showtime.update({
      where: { id },
      data: { status: "CANCELLED" },
    });
    return NextResponse.json({ ok: true, cancelled: true });
  }

  await prisma.showtime.update({
    where: { id },
    data: { status: "CANCELLED" },
  });

  return NextResponse.json({ ok: true });
}
