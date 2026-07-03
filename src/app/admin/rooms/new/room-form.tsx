"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Cinema = { id: string; name: string };

export function RoomForm({ cinemas }: { cinemas: Cinema[] }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const body = {
      name: fd.get("name"),
      cinemaId: fd.get("cinemaId"),
      rows: Number(fd.get("rows")),
      cols: Number(fd.get("cols")),
    };
    try {
      const res = await fetch("/api/admin/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        router.push("/admin/rooms");
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Tạo phòng thất bại");
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
        <div>
          <label className="mb-1 block text-sm font-semibold">Tên phòng *</label>
          <input name="name" required placeholder="vd: Phòng 1" className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold">Rạp *</label>
          <select name="cinemaId" required className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary">
            {cinemas.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-semibold">Số hàng ghế *</label>
          <input name="rows" type="number" min={3} max={20} required defaultValue={8} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold">Số cột ghế *</label>
          <input name="cols" type="number" min={5} max={25} required defaultValue={12} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary" />
        </div>
      </div>
      <p className="text-xs text-muted">
        Ghế sẽ được tự động tạo. 2 hàng cuối = VIP, 1 hàng cuối = ghế đôi.
      </p>
      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={saving} className="rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-background hover:opacity-90 disabled:opacity-50">
          {saving ? "Đang lưu..." : "Tạo phòng"}
        </button>
        <button type="button" onClick={() => router.back()} className="rounded-lg border border-border px-6 py-2.5 text-sm font-medium hover:bg-surface">
          Hủy
        </button>
      </div>
    </form>
  );
}
