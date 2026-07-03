import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { payment: true },
  });

  if (!booking) {
    return NextResponse.json({ error: "Không tìm thấy đặt vé" }, { status: 404 });
  }

  if (booking.status === "CANCELLED" || booking.status === "EXPIRED") {
    return NextResponse.json({ error: "Đặt vé đã bị hủy hoặc hết hạn" }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.booking.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    if (booking.payment) {
      await tx.payment.update({
        where: { bookingId: booking.id },
        data: { status: booking.payment.status === "PAID" ? "REFUNDED" : "FAILED" },
      });
    }
  });

  return NextResponse.json({ ok: true });
}
