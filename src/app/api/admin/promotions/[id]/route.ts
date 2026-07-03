import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const usageCount = await prisma.booking.count({
    where: { promotionId: id },
  });

  if (usageCount > 0) {
    // Deactivate instead of delete
    await prisma.promotion.update({
      where: { id },
      data: { isActive: false },
    });
    return NextResponse.json({ ok: true, deactivated: true });
  }

  await prisma.promotion.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
