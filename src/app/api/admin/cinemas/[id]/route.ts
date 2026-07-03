import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const roomCount = await prisma.room.count({ where: { cinemaId: id } });
  if (roomCount > 0) {
    return NextResponse.json(
      { error: "Không thể xóa rạp đang có phòng chiếu" },
      { status: 409 }
    );
  }

  await prisma.cinema.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
