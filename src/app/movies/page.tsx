import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { MovieCard } from "@/components/movies/movie-card";
import { EmptyState } from "@/components/ui";
import { MovieFilters } from "./movie-filters";
import type { Prisma } from "@prisma/client";

export const metadata: Metadata = {
  title: "Danh sách phim",
};

export const dynamic = "force-dynamic";

const PAGE_SIZE = 15;

type SearchParams = {
  q?: string;
  status?: string;
  genre?: string;
  rating?: string;
  sort?: string;
  page?: string;
};

export default async function MoviesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);

  const where: Prisma.MovieWhereInput = {
    status: { not: "ARCHIVED" },
  };

  if (params.q) {
    where.title = { contains: params.q };
  }
  if (params.status === "NOW_SHOWING" || params.status === "COMING_SOON") {
    where.status = params.status;
  }
  if (params.genre) {
    where.genres = { some: { genre: { slug: params.genre } } };
  }
  if (params.rating) {
    where.ageRating = params.rating;
  }

  let orderBy: Prisma.MovieOrderByWithRelationInput = { popularity: "desc" };
  if (params.sort === "newest") orderBy = { createdAt: "desc" };
  if (params.sort === "release") orderBy = { releaseDate: "desc" };

  const [movies, total, genres] = await Promise.all([
    prisma.movie.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { genres: { include: { genre: true } } },
    }),
    prisma.movie.count({ where }),
    prisma.genre.findMany({ orderBy: { name: "asc" } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">Danh sách phim</h1>
      <p className="mt-1 text-sm text-muted">
        {total} phim được tìm thấy
      </p>

      <div className="mt-6">
        <MovieFilters genres={genres} current={params} />
      </div>

      <div className="mt-8">
        {movies.length === 0 ? (
          <EmptyState
            title="Không tìm thấy phim nào"
            description="Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm của bạn."
            actionHref="/movies"
            actionLabel="Xóa bộ lọc"
          />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {movies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <nav className="mt-10 flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
            const sp = new URLSearchParams(
              Object.entries(params).filter(([k, v]) => v && k !== "page") as [
                string,
                string
              ][]
            );
            sp.set("page", String(p));
            return (
              <a
                key={p}
                href={`/movies?${sp.toString()}`}
                className={`flex h-10 w-10 items-center justify-center rounded-lg border text-sm font-semibold transition-colors ${
                  p === page
                    ? "border-primary bg-primary text-white"
                    : "border-border bg-surface text-muted hover:border-border-light hover:text-foreground"
                }`}
              >
                {p}
              </a>
            );
          })}
        </nav>
      )}
    </div>
  );
}
