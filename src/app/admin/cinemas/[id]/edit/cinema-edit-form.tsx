"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type CinemaData = {
  id: string;
  name: string;
  slug: string;
  address: string;
  city: string;
  phone: string;
  openingHours: string;
  description: string | null;
  isActive: boolean;
};

export function CinemaEditForm({ cinema }: { cinema: CinemaData }) {
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
      slug: fd.get("slug"),
      address: fd.get("address"),
      city: fd.get("city"),
      phone: fd.get("phone"),
      openingHours: fd.get("openingHours"),
      description: fd.get("description"),
      isActive: fd.get("isActive") === "true",
    };
    try {
      const res = await fetch(`/api/admin/cinemas/${cinema.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        router.push("/admin/cinemas");
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Cập nhật rạp thất bại");
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
          <label className="mb-1 block text-sm font-semibold">Tên rạp *</label>
          <input name="name" required defaultValue={cinema.name} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold">Slug *</label>
          <input name="slug" required defaultValue={cinema.slug} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary" />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-semibold">Địa chỉ *</label>
        <input name="address" required defaultValue={cinema.address} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-semibold">Thành phố *</label>
          <input name="city" required defaultValue={cinema.city} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold">Điện thoại</label>
          <input name="phone" defaultValue={cinema.phone} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-semibold">Giờ mở cửa</label>
          <input name="openingHours" defaultValue={cinema.openingHours} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold">Mô tả</label>
          <input name="description" defaultValue={cinema.description ?? ""} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary" />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-semibold">Trạng thái</label>
        <select name="isActive" defaultValue={cinema.isActive ? "true" : "false"} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary">
          <option value="true">Hoạt động</option>
          <option value="false">Tạm ngưng</option>
        </select>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={saving} className="rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-background hover:opacity-90 disabled:opacity-50">
          {saving ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
        <button type="button" onClick={() => router.back()} className="rounded-lg border border-border px-6 py-2.5 text-sm font-medium hover:bg-surface">
          Hủy
        </button>
      </div>
    </form>
  );
}
