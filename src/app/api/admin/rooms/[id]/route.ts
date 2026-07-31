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

  const showtimeCount = await prisma.showtime.count({ where: { roomId: id } });
  if (showtimeCount > 0) {
    return NextResponse.json(
      { error: "Không thể xóa phòng đang có suất chiếu" },
      { status: 409 }
    );
  }

  await prisma.room.delete({ where: { id } });
  await writeAuditLog({ actorId: guard.session.user.id, action: "DELETE", entity: "Room", entityId: id });
  return NextResponse.json({ ok: true });
}
