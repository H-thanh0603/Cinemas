import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { cinemaSchema, parseAdminBody } from "@/lib/admin-schemas";
import { slugify } from "@/lib/slugify";
import { writeAuditLog } from "@/lib/audit-log";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ error: "Cần tài khoản ADMIN" }, { status: 403 });
  const { id } = await params;
  const parsed = parseAdminBody(cinemaSchema, await req.json());
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const body = parsed.data;

  if (!body.name || !body.address || !body.city) {
    return NextResponse.json({ error: "Thiếu trường bắt buộc" }, { status: 400 });
  }

  const existing = await prisma.cinema.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Không tìm thấy rạp" }, { status: 404 });
  }

  let slug = body.slug ? slugify(body.slug) : slugify(body.name);
  if (slug !== existing.slug) {
    const conflict = await prisma.cinema.findUnique({ where: { slug } });
    if (conflict) slug = `${slug}-${Date.now().toString(36)}`;
  }

  const cinema = await prisma.cinema.update({
    where: { id },
    data: {
      name: body.name,
      slug,
      address: body.address,
      city: body.city,
      phone: body.phone || "",
      openingHours: body.openingHours || "8:00 - 23:00",
      description: body.description || null,
      isActive: body.isActive ?? existing.isActive,
    },
  });

  await writeAuditLog({ actorId: guard.session.user.id, action: "UPDATE", entity: "Cinema", entityId: id });
  return NextResponse.json(cinema);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ error: "Cần tài khoản ADMIN" }, { status: 403 });
  const { id } = await params;

  const roomCount = await prisma.room.count({ where: { cinemaId: id } });
  if (roomCount > 0) {
    return NextResponse.json(
      { error: "Không thể xóa rạp đang có phòng chiếu" },
      { status: 409 }
    );
  }

  await prisma.cinema.delete({ where: { id } });
  await writeAuditLog({ actorId: guard.session.user.id, action: "DELETE", entity: "Cinema", entityId: id });
  return NextResponse.json({ ok: true });
}
