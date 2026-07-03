"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Genre = { id: string; name: string; slug: string };

type Current = {
  q?: string;
  status?: string;
  genre?: string;
  rating?: string;
  sort?: string;
};

const statusOptions = [
  { value: "", label: "Tất cả" },
  { value: "NOW_SHOWING", label: "Đang chiếu" },
  { value: "COMING_SOON", label: "Sắp chiếu" },
];

const ratingOptions = ["", "P", "K", "T13", "T16", "T18"];

const sortOptions = [
  { value: "", label: "Phổ biến nhất" },
  { value: "newest", label: "Mới thêm" },
  { value: "release", label: "Ngày khởi chiếu" },
];

export function MovieFilters({
  genres,
  current,
}: {
  genres: Genre[];
  current: Current;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [q, setQ] = useState(current.q ?? "");

  function apply(patch: Partial<Current>) {
    const next = { ...current, ...patch };
    const sp = new URLSearchParams();
    if (next.q) sp.set("q", next.q);
    if (next.status) sp.set("status", next.status);
    if (next.genre) sp.set("genre", next.genre);
    if (next.rating) sp.set("rating", next.rating);
    if (next.sort) sp.set("sort", next.sort);
    startTransition(() => {
      router.push(`/movies?${sp.toString()}`);
    });
  }

  return (
    <div
      className={`rounded-2xl border border-border bg-surface p-4 transition-opacity ${
        isPending ? "opacity-60" : ""
      }`}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          apply({ q });
        }}
        className="flex gap-2"
      >
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm phim theo tên..."
          className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none placeholder:text-muted-dark focus:border-primary"
        />
        <button
          type="submit"
          className="shrink-0 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
        >
          Tìm
        </button>
      </form>

      <div className="mt-4 flex flex-wrap gap-x-8 gap-y-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
            Trạng thái
          </p>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => apply({ status: opt.value })}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  (current.status ?? "") === opt.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted hover:border-border-light hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
            Độ tuổi
          </p>
          <div className="flex flex-wrap gap-2">
            {ratingOptions.map((r) => (
              <button
                key={r || "all"}
                onClick={() => apply({ rating: r })}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  (current.rating ?? "") === r
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted hover:border-border-light hover:text-foreground"
                }`}
              >
                {r || "Tất cả"}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
            Sắp xếp
          </p>
          <select
            value={current.sort ?? ""}
            onChange={(e) => apply({ sort: e.target.value })}
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium outline-none focus:border-primary"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
          Thể loại
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => apply({ genre: "" })}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
              !current.genre
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted hover:border-border-light hover:text-foreground"
            }`}
          >
            Tất cả
          </button>
          {genres.map((g) => (
            <button
              key={g.id}
              onClick={() => apply({ genre: g.slug })}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                current.genre === g.slug
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted hover:border-border-light hover:text-foreground"
              }`}
            >
              {g.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
