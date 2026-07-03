"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function BookingActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const handleCancel = async () => {
    if (!confirm("Hủy đặt vé này? Ghế sẽ được giải phóng.")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/bookings/${id}`, { method: "DELETE" });
      if (res.ok) router.refresh();
      else alert("Hủy thất bại");
    } catch {
      alert("Lỗi kết nối");
    } finally {
      setBusy(false);
    }
  };

  if (status === "CANCELLED" || status === "EXPIRED") {
    return <span className="text-xs text-muted">—</span>;
  }

  return (
    <button
      onClick={handleCancel}
      disabled={busy}
      className="rounded px-2 py-1 text-xs font-medium text-red-400 hover:bg-red-500/10 disabled:opacity-50"
    >
      {busy ? "..." : "Hủy vé"}
    </button>
  );
}
