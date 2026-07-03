"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ShowtimeActions({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const handleCancel = async () => {
    if (!confirm("Hủy suất chiếu này?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/showtimes/${id}`, { method: "DELETE" });
      if (res.ok) router.refresh();
      else alert("Hủy thất bại");
    } catch {
      alert("Lỗi kết nối");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={handleCancel}
      disabled={busy}
      className="rounded px-2 py-1 text-xs font-medium text-red-400 hover:bg-red-500/10 disabled:opacity-50"
    >
      {busy ? "..." : "Hủy suất"}
    </button>
  );
}
