import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

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

  return NextResponse.json(cinema);
}

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
