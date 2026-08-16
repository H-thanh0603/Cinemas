import { prisma } from "@/lib/prisma";
import { MovieForm } from "./movie-edit-form";

export const dynamic = "force-dynamic";

export default async function EditMoviePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [movie, genres] = await Promise.all([
    prisma.movie.findUnique({
      where: { id },
      include: { genres: true },
    }),
    prisma.genre.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!movie) {
    return (
      <div className="py-20 text-center">
        <p className="text-lg font-semibold">Không tìm thấy phim</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Chỉnh sửa phim</h1>
        <p className="text-sm text-muted">{movie.title}</p>
      </div>
      <MovieForm
        movie={movie}
        genres={genres}
        selectedGenreIds={movie.genres.map((g) => g.genreId)}
      />
    </div>
  );
}
