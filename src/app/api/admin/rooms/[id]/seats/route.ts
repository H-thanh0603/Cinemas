import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { writeAuditLog } from "@/lib/audit-log";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ error: "Cần tài khoản ADMIN" }, { status: 403 });
  const { id } = await params;

  const room = await prisma.room.findUnique({ where: { id } });
  if (!room) {
    return NextResponse.json({ error: "Không tìm thấy phòng" }, { status: 404 });
  }

  const existingSeats = await prisma.seat.count({ where: { roomId: id } });
  if (existingSeats > 0) {
    return NextResponse.json(
      { error: "Phòng đã có ghế. Xóa ghế cũ trước khi tạo lại." },
      { status: 409 }
    );
  }

  // Use room's configured rows/cols
  const rows = room.rows;
  const cols = room.cols;

  const seats: { roomId: string; row: string; number: number; type: string }[] = [];
  for (let r = 0; r < rows; r++) {
    const rowLabel = String.fromCharCode(65 + r);
    const seatType = r >= rows - 1 ? "COUPLE" : r >= rows - 3 ? "VIP" : "NORMAL";
    for (let c = 1; c <= cols; c++) {
      seats.push({ roomId: id, row: rowLabel, number: c, type: seatType });
    }
  }
  await prisma.seat.createMany({ data: seats });

  await writeAuditLog({ actorId: guard.session.user.id, action: "CREATE_SEATS", entity: "Room", entityId: id, metadata: { count: seats.length } });
  return NextResponse.json({ ok: true, count: seats.length });
}
