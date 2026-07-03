"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function PromotionForm() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const body = {
      code: (fd.get("code") as string)?.toUpperCase().trim(),
      description: fd.get("description"),
      discountType: fd.get("discountType"),
      discountValue: Number(fd.get("discountValue")),
      startsAt: fd.get("startsAt"),
      expiresAt: fd.get("expiresAt"),
      maxUses: Number(fd.get("maxUses")) || null,
      minOrderValue: Number(fd.get("minOrderValue")) || 0,
    };
    try {
      const res = await fetch("/api/admin/promotions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        router.push("/admin/promotions");
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Tạo khuyến mãi thất bại");
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
          <label className="mb-1 block text-sm font-semibold">Mã khuyến mãi *</label>
          <input name="code" required placeholder="vd: SUMMER50" className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm uppercase outline-none focus:border-primary" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold">Loại giảm giá *</label>
          <select name="discountType" required className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary">
            <option value="PERCENT">Theo phần trăm (%)</option>
            <option value="FIXED">Số tiền cố định (VNĐ)</option>
          </select>
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-semibold">Mô tả *</label>
        <input name="description" required className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-semibold">Giá trị giảm *</label>
          <input name="discountValue" type="number" min={1} required defaultValue={10} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold">Số lần dùng tối đa</label>
          <input name="maxUses" type="number" min={0} placeholder="Không giới hạn" className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-semibold">Ngày bắt đầu *</label>
          <input name="startsAt" type="date" required className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold">Ngày kết thúc *</label>
          <input name="expiresAt" type="date" required className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary" />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-semibold">Giá trị đơn tối thiểu (VNĐ)</label>
        <input name="minOrderValue" type="number" min={0} defaultValue={0} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary" />
      </div>
      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={saving} className="rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-background hover:opacity-90 disabled:opacity-50">
          {saving ? "Đang lưu..." : "Tạo khuyến mãi"}
        </button>
        <button type="button" onClick={() => router.back()} className="rounded-lg border border-border px-6 py-2.5 text-sm font-medium hover:bg-surface">
          Hủy
        </button>
      </div>
    </form>
  );
}
