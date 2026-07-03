import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.json();

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

  return NextResponse.json(room, { status: 201 });
}
