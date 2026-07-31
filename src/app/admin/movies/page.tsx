import Link from "next/link";
import Image from "next/image";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { escapeLikePattern } from "@/lib/search-utils";
import { MOVIE_STATUS_LABELS, formatDate } from "@/lib/constants";
import { MovieActions } from "./movie-actions";
import { AdminSearch, AdminFilter } from "../admin-search";
import { AdminPagination } from "../admin-pagination";

export const dynamic = "force-dynamic";

export default async function AdminMoviesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const { q, status, page: pageParam } = await searchParams;
  const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);
  const pageSize = 25;
  const safeQ = q ? escapeLikePattern(q) : "";
  const where: Prisma.MovieWhereInput = {
    AND: [
      safeQ ? { OR: [{ title: { contains: safeQ, mode: "insensitive" as const } }, { slug: { contains: safeQ, mode: "insensitive" as const } }, { director: { contains: safeQ, mode: "insensitive" as const } }] } : {},
      status && status !== "ALL" ? { status } : {},
    ],
  };

  const [movies, total] = await Promise.all([
    prisma.movie.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
    include: { genres: { include: { genre: true } }, _count: { select: { showtimes: true } } },
    }),
    prisma.movie.count({ where }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Quản lý phim</h1>
          <p className="text-sm text-muted">{total} phim</p>
        </div>
        <Link
          href="/admin/movies/new"
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary-hover"
        >
          + Thêm phim
        </Link>
      </div>
      <AdminPagination page={page} totalPages={Math.max(1, Math.ceil(total / pageSize))} query={{ q, status }} />

      {/* Search & filter */}
      <div className="flex flex-wrap items-center gap-3">
        <AdminSearch param="q" placeholder="Tìm theo tên, slug, đạo diễn..." />
        <AdminFilter
          param="status"
          label="Tất cả trạng thái"
          options={[
            { value: "NOW_SHOWING", label: "Đang chiếu" },
            { value: "COMING_SOON", label: "Sắp chiếu" },
            { value: "ARCHIVED", label: "Ngừng chiếu" },
          ]}
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface-raised text-left text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3">Phim</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Thể loại</th>
              <th className="px-4 py-3">Thời lượng</th>
              <th className="px-4 py-3">Suất chiếu</th>
              <th className="px-4 py-3">Khởi chiếu</th>
              <th className="px-4 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {movies.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-muted">
                  Không tìm thấy phim nào
                </td>
              </tr>
            ) : (
              movies.map((m) => (
                <tr key={m.id} className="transition-colors hover:bg-surface-raised/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {m.posterUrl && (
                        <Image
                          src={m.posterUrl}
                          alt={m.title}
                          width={40}
                          height={56}
                          className="h-14 w-10 shrink-0 rounded-lg object-cover"
                        />
                      )}
                      <div className="min-w-0">
                        <div className="truncate font-semibold">{m.title}</div>
                        <div className="truncate text-xs text-muted">{m.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                      m.status === "NOW_SHOWING" ? "bg-green-500/20 text-green-400" :
                      m.status === "COMING_SOON" ? "bg-blue-500/20 text-blue-400" :
                      "bg-gray-500/20 text-gray-400"
                    }`}>
                      {MOVIE_STATUS_LABELS[m.status as keyof typeof MOVIE_STATUS_LABELS]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">
                    {m.genres.map((mg) => mg.genre.name).join(", ")}
                  </td>
                  <td className="px-4 py-3">{m.durationMin} phút</td>
                  <td className="px-4 py-3">{m._count.showtimes}</td>
                  <td className="px-4 py-3 text-xs text-muted">{formatDate(m.releaseDate)}</td>
                  <td className="px-4 py-3 text-right">
                    <MovieActions id={m.id} title={m.title} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
