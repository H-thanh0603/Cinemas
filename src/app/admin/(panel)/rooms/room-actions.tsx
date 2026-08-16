"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RoomActions({
  id,
  name,
  seatCount,
}: {
  id: string;
  name: string;
  seatCount: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Xóa phòng "${name}"?`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/rooms/${id}`, { method: "DELETE" });
      if (res.ok) router.refresh();
      else alert("Xóa thất bại. Phòng có thể đang có suất chiếu.");
    } catch {
      alert("Lỗi kết nối");
    } finally {
      setBusy(false);
    }
  };

  const handleRegenSeats = async () => {
    if (!confirm(`Tạo lại toàn bộ ghế cho phòng "${name}"?`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/rooms/${id}/seats`, { method: "POST" });
      if (res.ok) router.refresh();
      else alert("Tạo ghế thất bại");
    } catch {
      alert("Lỗi kết nối");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex justify-end gap-2">
      {seatCount === 0 && (
        <button
          onClick={handleRegenSeats}
          disabled={busy}
          className="rounded px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10 disabled:opacity-50"
        >
          Tạo ghế
        </button>
      )}
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
