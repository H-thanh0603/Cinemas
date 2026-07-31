import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { movieSchema, parseAdminBody } from "@/lib/admin-schemas";
import { writeAuditLog } from "@/lib/audit-log";

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
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ error: "Cần tài khoản ADMIN" }, { status: 403 });
  const parsed = parseAdminBody(movieSchema, await req.json());
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const body = parsed.data;

  if (!body.title || !body.durationMin || !body.releaseDate) {
    return NextResponse.json(
      { error: "Thiếu trường bắt buộc" },
      { status: 400 }
    );
  }

  let slug = body.slug ? slugify(body.slug) : slugify(body.title);
  const existing = await prisma.movie.findUnique({ where: { slug } });
  if (existing) slug = `${slug}-${Date.now().toString(36)}`;

  const movie = await prisma.movie.create({
    data: {
      title: body.title,
      slug,
      description: body.description || "",
      posterUrl: body.posterUrl || "",
      backdropUrl: body.backdropUrl || null,
      trailerUrl: body.trailerUrl || null,
      durationMin: Number(body.durationMin),
      releaseDate: new Date(body.releaseDate),
      ageRating: body.ageRating || "T13",
      status: body.status || "COMING_SOON",
      director: body.director || "",
      cast: body.cast || "",
      genres: body.genreIds?.length
        ? { create: body.genreIds.map((id: string) => ({ genre: { connect: { id } } })) }
        : undefined,
    },
  });

  await writeAuditLog({ actorId: guard.session.user.id, action: "CREATE", entity: "Movie", entityId: movie.id });
  return NextResponse.json(movie, { status: 201 });
}
