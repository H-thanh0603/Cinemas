import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { parseAdminBody, roomSchema } from "@/lib/admin-schemas";
import { writeAuditLog } from "@/lib/audit-log";

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ error: "Cần tài khoản ADMIN" }, { status: 403 });
  const parsed = parseAdminBody(roomSchema, await req.json());
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const body = parsed.data;

  if (!body.name || !body.cinemaId || !body.rows || !body.cols) {
    return NextResponse.json({ error: "Thiếu trường bắt buộc" }, { status: 400 });
  }

  const rows = Number(body.rows);
  const cols = Number(body.cols);
  if (rows < 3 || rows > 20 || cols < 5 || cols > 25) {
    return NextResponse.json({ error: "Kích thước phòng không hợp lệ" }, { status: 400 });
  }

  const room = await prisma.room.create({
    data: {
      name: body.name,
      cinemaId: body.cinemaId,
      rows,
      cols,
      isActive: true,
    },
  });

  // Auto-generate seats
  const seats: { roomId: string; row: string; number: number; type: string }[] = [];
  for (let r = 0; r < rows; r++) {
    const rowLabel = String.fromCharCode(65 + r);
    const seatType = r >= rows - 1 ? "COUPLE" : r >= rows - 3 ? "VIP" : "NORMAL";
    for (let c = 1; c <= cols; c++) {
      seats.push({ roomId: room.id, row: rowLabel, number: c, type: seatType });
    }
  }
  await prisma.seat.createMany({ data: seats });

  await writeAuditLog({ actorId: guard.session.user.id, action: "CREATE", entity: "Room", entityId: room.id });
  return NextResponse.json(room, { status: 201 });
}
