import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (!body.code || !body.description || !body.discountType || !body.discountValue || !body.startsAt || !body.expiresAt) {
    return NextResponse.json({ error: "Thiếu trường bắt buộc" }, { status: 400 });
  }

  const existing = await prisma.promotion.findUnique({ where: { code: body.code } });
  if (existing) {
    return NextResponse.json({ error: "Mã khuyến mãi đã tồn tại" }, { status: 409 });
  }

  const startsAt = new Date(body.startsAt);
  const expiresAt = new Date(body.expiresAt);
  if (expiresAt <= startsAt) {
    return NextResponse.json({ error: "Ngày kết thúc phải sau ngày bắt đầu" }, { status: 400 });
  }

  const promo = await prisma.promotion.create({
    data: {
      code: body.code,
      description: body.description,
      discountType: body.discountType,
      discountValue: Number(body.discountValue),
      startsAt,
      expiresAt,
      usageLimit: body.maxUses || null,
      minOrderValue: Number(body.minOrderValue) || 0,
      isActive: true,
    },
  });

  return NextResponse.json(promo, { status: 201 });
}
