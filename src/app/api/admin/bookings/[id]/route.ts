import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { writeAuditLog } from "@/lib/audit-log";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ error: "Cần tài khoản ADMIN" }, { status: 403 });
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
    // Release seat inventory
    await tx.showtimeSeatLock.deleteMany({ where: { bookingId: id } });

    await tx.booking.update({
      where: { id },
      data: { status: "CANCELLED", expiresAt: null },
    });

    if (booking.payment) {
      await tx.payment.update({
        where: { bookingId: booking.id },
        data: { status: booking.payment.status === "PAID" ? "REFUNDED" : "FAILED" },
      });
    }
  });

  await writeAuditLog({ actorId: guard.session.user.id, action: "CANCEL", entity: "Booking", entityId: id });
  return NextResponse.json({ ok: true });
}
