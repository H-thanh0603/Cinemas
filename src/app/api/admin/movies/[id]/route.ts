import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { movieSchema, parseAdminBody } from "@/lib/admin-schemas";
import { slugify } from "@/lib/slugify";
import { writeAuditLog } from "@/lib/audit-log";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ error: "Cần tài khoản ADMIN" }, { status: 403 });
  const { id } = await params;
  const parsed = parseAdminBody(movieSchema, await req.json());
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const body = parsed.data;

  if (!body.title || !body.durationMin || !body.releaseDate) {
    return NextResponse.json(
      { error: "Thiếu trường bắt buộc" },
      { status: 400 }
    );
  }

  const existing = await prisma.movie.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Không tìm thấy phim" }, { status: 404 });
  }

  let slug = body.slug ? slugify(body.slug) : slugify(body.title);
  if (slug !== existing.slug) {
    const conflict = await prisma.movie.findUnique({ where: { slug } });
    if (conflict) slug = `${slug}-${Date.now().toString(36)}`;
  }

  // Update genres: delete old, create new — wrapped in transaction so
  // partial failure doesn't leave movie with zero genres
  const movie = await prisma.$transaction(async (tx) => {
    if (body.genreIds !== undefined) {
      await tx.movieGenre.deleteMany({ where: { movieId: id } });
    }
    return tx.movie.update({
      where: { id },
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
        status: body.status || existing.status,
        director: body.director || "",
        cast: body.cast || "",
        genres: body.genreIds?.length
          ? { create: body.genreIds.map((gid: string) => ({ genre: { connect: { id: gid } } })) }
          : undefined,
      },
    });
  });

  await writeAuditLog({ actorId: guard.session.user.id, action: "UPDATE", entity: "Movie", entityId: id });
  return NextResponse.json(movie);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ error: "Cần tài khoản ADMIN" }, { status: 403 });
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
  await writeAuditLog({ actorId: guard.session.user.id, action: "DELETE", entity: "Movie", entityId: id });
  return NextResponse.json({ ok: true });
}
