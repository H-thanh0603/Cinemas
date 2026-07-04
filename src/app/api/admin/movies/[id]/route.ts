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

  // Update genres: delete old, create new
  if (body.genreIds !== undefined) {
    await prisma.movieGenre.deleteMany({ where: { movieId: id } });
  }

  const movie = await prisma.movie.update({
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

  return NextResponse.json(movie);
}

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
