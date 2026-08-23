"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Movie = { id: string; title: string; durationMin: number };
type Room = { id: string; name: string; cinema: { name: string } };

export function ShowtimeForm({ movies, rooms }: { movies: Movie[]; rooms: Room[] }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const body = {
      movieId: fd.get("movieId"),
      roomId: fd.get("roomId"),
      startTime: fd.get("startTime"),
      format: fd.get("format"),
      basePrice: Number(fd.get("basePrice")),
    };
    try {
      const res = await fetch("/api/admin/showtimes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        router.push("/admin/showtimes");
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Tạo suất chiếu thất bại");
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
      <div>
        <label className="mb-1 block text-sm font-semibold">Phim *</label>
        <select name="movieId" required className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary">
          {movies.map((m) => (
            <option key={m.id} value={m.id}>{m.title} ({m.durationMin} phút)</option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-semibold">Phòng chiếu *</label>
        <select name="roomId" required className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary">
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>{r.cinema.name} · {r.name}</option>
          ))}
        </select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-semibold">Thời gian bắt đầu *</label>
          <input name="startTime" type="datetime-local" required className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold">Định dạng *</label>
          <select name="format" required className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary">
            <option value="2D">2D</option>
            <option value="3D">3D</option>
            <option value="IMAX">IMAX</option>
          </select>
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-semibold">Giá vé cơ bản (VNĐ) *</label>
        <input name="basePrice" type="number" min={10000} step={1000} required defaultValue={80000} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary" />
      </div>
      <p className="text-xs text-muted">
        Hệ thống sẽ kiểm tra xung đột thời gian với phòng chiếu đã chọn.
      </p>
      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={saving} className="rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-background hover:opacity-90 disabled:opacity-50">
          {saving ? "Đang lưu..." : "Tạo suất chiếu"}
        </button>
        <button type="button" onClick={() => router.back()} className="rounded-lg border border-border px-6 py-2.5 text-sm font-medium hover:bg-surface">
          Hủy
        </button>
      </div>
    </form>
  );
}
