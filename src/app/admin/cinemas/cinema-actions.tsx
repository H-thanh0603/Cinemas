"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CinemaActions({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Xóa rạp "${name}"?`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/cinemas/${id}`, { method: "DELETE" });
      if (res.ok) router.refresh();
      else alert("Xóa thất bại. Rạp có thể đang có phòng hoặc suất chiếu.");
    } catch {
      alert("Lỗi kết nối");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="rounded px-2 py-1 text-xs font-medium text-red-400 hover:bg-red-500/10 disabled:opacity-50"
    >
      {deleting ? "..." : "Xóa"}
    </button>
  );
}
