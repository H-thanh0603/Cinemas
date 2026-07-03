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

  return NextResponse.json(movie, { status: 201 });
}
