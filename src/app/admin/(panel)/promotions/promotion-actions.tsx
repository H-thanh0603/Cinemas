"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function PromotionActions({ id, code }: { id: string; code: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Xóa mã khuyến mãi "${code}"?`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/promotions/${id}`, { method: "DELETE" });
      if (res.ok) router.refresh();
      else alert("Xóa thất bại");
    } catch {
      alert("Lỗi kết nối");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex justify-end gap-2">
      <Link
        href={`/admin/promotions/${id}/edit`}
        className="rounded px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10"
      >
        Sửa
      </Link>
      <button
        onClick={handleDelete}
        disabled={busy}
        className="rounded px-2 py-1 text-xs font-medium text-red-400 hover:bg-red-500/10 disabled:opacity-50"
      >
        {busy ? "..." : "Xóa"}
      </button>
    </div>
  );
}
