"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Genre = { id: string; name: string };
type MovieData = {
  id: string;
  title: string;
  slug: string;
  description: string;
  posterUrl: string;
  backdropUrl: string | null;
  trailerUrl: string | null;
  durationMin: number;
  releaseDate: Date;
  ageRating: string;
  status: string;
  director: string;
  cast: string;
};

export function MovieForm({
  movie,
  genres,
  selectedGenreIds,
}: {
  movie: MovieData;
  genres: Genre[];
  selectedGenreIds: string[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedGenres, setSelectedGenres] = useState<string[]>(selectedGenreIds);

  const toggleGenre = (id: string) =>
    setSelectedGenres((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const body = {
      title: fd.get("title"),
      slug: fd.get("slug"),
      description: fd.get("description"),
      posterUrl: fd.get("posterUrl"),
      backdropUrl: fd.get("backdropUrl"),
      trailerUrl: fd.get("trailerUrl"),
      durationMin: Number(fd.get("durationMin")),
      releaseDate: fd.get("releaseDate"),
      ageRating: fd.get("ageRating"),
      status: fd.get("status"),
      director: fd.get("director"),
      cast: fd.get("cast"),
      genreIds: selectedGenres,
    };
    try {
      const res = await fetch(`/api/admin/movies/${movie.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        router.push("/admin/movies");
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Cập nhật phim thất bại");
      }
    } catch {
      setError("Lỗi kết nối");
    } finally {
      setSaving(false);
    }
  };

  const releaseDateStr = new Date(movie.releaseDate).toISOString().split("T")[0];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tên phim" name="title" required defaultValue={movie.title} />
        <Field label="Slug (URL)" name="slug" required hint="vd: avengers-endgame" defaultValue={movie.slug} />
      </div>
      <Field label="Mô tả" name="description" textarea defaultValue={movie.description} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="URL Poster" name="posterUrl" defaultValue={movie.posterUrl} />
        <Field label="URL Backdrop" name="backdropUrl" defaultValue={movie.backdropUrl ?? ""} />
      </div>
      <Field label="URL Trailer (YouTube)" name="trailerUrl" defaultValue={movie.trailerUrl ?? ""} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Thời lượng (phút)" name="durationMin" type="number" required defaultValue={movie.durationMin} />
        <Field label="Ngày khởi chiếu" name="releaseDate" type="date" required defaultValue={releaseDateStr} />
        <SelectField label="Giới hạn tuổi" name="ageRating" required defaultValue={movie.ageRating} options={[
          { value: "P", label: "P" },
          { value: "K", label: "K" },
          { value: "T13", label: "T13" },
          { value: "T16", label: "T16" },
          { value: "T18", label: "T18" },
        ]} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField label="Trạng thái" name="status" required defaultValue={movie.status} options={[
          { value: "NOW_SHOWING", label: "Đang chiếu" },
          { value: "COMING_SOON", label: "Sắp chiếu" },
          { value: "ARCHIVED", label: "Ngừng chiếu" },
        ]} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Đạo diễn" name="director" defaultValue={movie.director} />
        <Field label="Diễn viên" name="cast" hint="Phân tách bằng dấu phẩy" defaultValue={movie.cast} />
      </div>
      <div>
        <label className="mb-2 block text-sm font-semibold">Thể loại</label>
        <div className="flex flex-wrap gap-2">
          {genres.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => toggleGenre(g.id)}
              className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                selectedGenres.includes(g.id)
                  ? "border-primary bg-primary text-background"
                  : "border-border bg-surface hover:border-primary"
              }`}
            >
              {g.name}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-background hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-border px-6 py-2.5 text-sm font-medium hover:bg-surface"
        >
          Hủy
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  hint,
  textarea,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  hint?: string;
  textarea?: boolean;
  defaultValue?: string | number;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-semibold">
        {label} {required && <span className="text-primary">*</span>}
      </label>
      {textarea ? (
        <textarea
          name={name}
          required={required}
          defaultValue={defaultValue}
          rows={4}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
        />
      ) : (
        <input
          name={name}
          type={type}
          required={required}
          defaultValue={defaultValue}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
        />
      )}
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

function SelectField({
  label,
  name,
  required,
  options,
  defaultValue,
}: {
  label: string;
  name: string;
  required?: boolean;
  options: { value: string; label: string }[];
  defaultValue?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-semibold">
        {label} {required && <span className="text-primary">*</span>}
      </label>
      <select
        name={name}
        required={required}
        defaultValue={defaultValue}
        className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
