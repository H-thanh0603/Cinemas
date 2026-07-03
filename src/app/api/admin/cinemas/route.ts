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

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (!body.name || !body.slug || !body.address || !body.city) {
    return NextResponse.json({ error: "Thiếu trường bắt buộc" }, { status: 400 });
  }

  let slug = slugify(body.slug);
  const existing = await prisma.cinema.findUnique({ where: { slug } });
  if (existing) slug = `${slug}-${Date.now().toString(36)}`;

  const cinema = await prisma.cinema.create({
    data: {
      name: body.name,
      slug,
      address: body.address,
      city: body.city,
      phone: body.phone || "",
      openingHours: body.openingHours || "8:00 - 23:00",
      description: body.description || null,
      isActive: true,
    },
  });

  return NextResponse.json(cinema, { status: 201 });
}
