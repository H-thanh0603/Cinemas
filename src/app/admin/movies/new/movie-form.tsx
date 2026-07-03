"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Genre = { id: string; name: string };

export function MovieForm({ genres }: { genres: Genre[] }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

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
      const res = await fetch("/api/admin/movies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        router.push("/admin/movies");
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Tạo phim thất bại");
      }
    } catch {
      setError("Lỗi kết nối");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tên phim" name="title" required />
        <Field label="Slug (URL)" name="slug" required hint="vd: avengers-endgame" />
      </div>
      <Field label="Mô tả" name="synopsis" textarea />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="URL Poster" name="posterUrl" />
        <Field label="URL Backdrop" name="backdropUrl" />
      </div>
      <Field label="URL Trailer (YouTube)" name="trailerUrl" />
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Thời lượng (phút)" name="durationMin" type="number" required />
        <Field label="Ngày khởi chiếu" name="releaseDate" type="date" required />
        <SelectField label="Giới hạn tuổi" name="ageRating" required options={[
          { value: "P", label: "P" },
          { value: "K", label: "K" },
          { value: "T13", label: "T13" },
          { value: "T16", label: "T16" },
          { value: "T18", label: "T18" },
        ]} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField label="Trạng thái" name="status" required options={[
          { value: "NOW_SHOWING", label: "Đang chiếu" },
          { value: "COMING_SOON", label: "Sắp chiếu" },
          { value: "ARCHIVED", label: "Ngừng chiếu" },
        ]} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Đạo diễn" name="director" />
        <Field label="Diễn viên" name="cast" hint="Phân tách bằng dấu phẩy" />
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
          {saving ? "Đang lưu..." : "Tạo phim"}
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
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  hint?: string;
  textarea?: boolean;
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
          rows={4}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
        />
      ) : (
        <input
          name={name}
          type={type}
          required={required}
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
}: {
  label: string;
  name: string;
  required?: boolean;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-semibold">
        {label} {required && <span className="text-primary">*</span>}
      </label>
      <select
        name={name}
        required={required}
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
