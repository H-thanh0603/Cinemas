import { prisma } from "@/lib/prisma";
import { MovieForm } from "./movie-form";

export const dynamic = "force-dynamic";

export default async function NewMoviePage() {
  const genres = await prisma.genre.findMany({ orderBy: { name: "asc" } });
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Thêm phim mới</h1>
      <MovieForm genres={genres} />
    </div>
  );
}
