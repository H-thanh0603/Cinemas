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
    await writeAuditLog({ actorId: guard.session.user.id, action: "CANCEL", entity: "Showtime", entityId: id });
    return NextResponse.json({ ok: true, cancelled: true });
  }

  await prisma.showtime.update({
    where: { id },
    data: { status: "CANCELLED" },
  });

  await writeAuditLog({ actorId: guard.session.user.id, action: "CANCEL", entity: "Showtime", entityId: id });
  return NextResponse.json({ ok: true });
}
