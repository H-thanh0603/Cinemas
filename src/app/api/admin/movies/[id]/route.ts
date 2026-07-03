import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const showtimeCount = await prisma.showtime.count({
    where: { movieId: id },
  });

  if (showtimeCount > 0) {
    return NextResponse.json(
      { error: "Không thể xóa phim đang có suất chiếu" },
      { status: 409 }
    );
  }

  await prisma.movie.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
