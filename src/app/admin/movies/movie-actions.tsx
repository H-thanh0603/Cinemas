"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function MovieActions({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Xóa phim "${title}"? Hành động này không thể hoàn tác.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/movies/${id}`, { method: "DELETE" });
      if (res.ok) router.refresh();
      else alert("Xóa thất bại. Có thể phim đang có suất chiếu.");
    } catch {
      alert("Lỗi kết nối");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex justify-end gap-2">
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="rounded px-2 py-1 text-xs font-medium text-red-400 hover:bg-red-500/10 disabled:opacity-50"
      >
        {deleting ? "Đang xóa..." : "Xóa"}
      </button>
    </div>
  );
}
