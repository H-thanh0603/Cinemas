import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { cinemaSchema, parseAdminBody } from "@/lib/admin-schemas";
import { slugify } from "@/lib/slugify";
import { writeAuditLog } from "@/lib/audit-log";

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ error: "Cần tài khoản ADMIN" }, { status: 403 });
  const parsed = parseAdminBody(cinemaSchema, await req.json());
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const body = parsed.data;

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

  await writeAuditLog({ actorId: guard.session.user.id, action: "CREATE", entity: "Cinema", entityId: cinema.id });
  return NextResponse.json(cinema, { status: 201 });
}
