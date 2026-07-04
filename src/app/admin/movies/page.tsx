import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { MOVIE_STATUS_LABELS, formatDate } from "@/lib/constants";
import { MovieActions } from "./movie-actions";
import { AdminSearch, AdminFilter } from "../admin-search";

export const dynamic = "force-dynamic";

export default async function AdminMoviesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q, status } = await searchParams;

  const movies = await prisma.movie.findMany({
    where: {
      AND: [
        q
          ? {
              OR: [
                { title: { contains: q } },
                { slug: { contains: q } },
                { director: { contains: q } },
              ],
            }
          : {},
        status && status !== "ALL"
          ? { status }
          : {},
      ],
    },
    orderBy: { createdAt: "desc" },
    include: { genres: { include: { genre: true } }, _count: { select: { showtimes: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Quản lý phim</h1>
          <p className="text-sm text-muted">{movies.length} phim</p>
        </div>
        <Link
          href="/admin/movies/new"
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary-hover"
        >
          + Thêm phim
        </Link>
      </div>

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
                        <img
                          src={m.posterUrl}
                          alt={m.title}
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
