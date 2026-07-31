import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { parseAdminBody, promotionSchema } from "@/lib/admin-schemas";
import { writeAuditLog } from "@/lib/audit-log";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ error: "Cần tài khoản ADMIN" }, { status: 403 });
  const { id } = await params;
  const parsed = parseAdminBody(promotionSchema, await req.json());
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const body = parsed.data;

  if (!body.code || !body.description || !body.discountType || !body.discountValue || !body.startsAt || !body.expiresAt) {
    return NextResponse.json({ error: "Thiếu trường bắt buộc" }, { status: 400 });
  }

  const existing = await prisma.promotion.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Không tìm thấy khuyến mãi" }, { status: 404 });
  }

  if (body.code !== existing.code) {
    const conflict = await prisma.promotion.findUnique({ where: { code: body.code } });
    if (conflict) {
      return NextResponse.json({ error: "Mã khuyến mãi đã tồn tại" }, { status: 409 });
    }
  }

  const startsAt = new Date(body.startsAt);
  const expiresAt = new Date(body.expiresAt);
  if (expiresAt <= startsAt) {
    return NextResponse.json({ error: "Ngày kết thúc phải sau ngày bắt đầu" }, { status: 400 });
  }

  const promo = await prisma.promotion.update({
    where: { id },
    data: {
      code: body.code,
      description: body.description,
      discountType: body.discountType,
      discountValue: Number(body.discountValue),
      startsAt,
      expiresAt,
      usageLimit: body.maxUses || null,
      minOrderValue: Number(body.minOrderValue) || 0,
      isActive: body.isActive ?? existing.isActive,
    },
  });

  await writeAuditLog({ actorId: guard.session.user.id, action: "UPDATE", entity: "Promotion", entityId: id });
  return NextResponse.json(promo);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ error: "Cần tài khoản ADMIN" }, { status: 403 });
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
    await writeAuditLog({ actorId: guard.session.user.id, action: "DEACTIVATE", entity: "Promotion", entityId: id });
    return NextResponse.json({ ok: true, deactivated: true });
  }

  await prisma.promotion.delete({ where: { id } });
  await writeAuditLog({ actorId: guard.session.user.id, action: "DELETE", entity: "Promotion", entityId: id });
  return NextResponse.json({ ok: true });
}
