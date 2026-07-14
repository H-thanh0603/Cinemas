"use client";

import Link from "next/link";
import { useCompare } from "@/context/compare-context";
import { Button } from "@/components/ui";

export function CompareBar() {
  const { ids, clear } = useCompare();
  if (ids.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-brand-500/30 bg-surface-900/95 px-4 py-3 shadow-2xl shadow-brand-900/40 backdrop-blur">
      <span className="text-sm text-surface-200">
        Đã chọn <strong className="text-white">{ids.length}</strong>/3 so sánh
      </span>
      <Link href="/compare">
        <Button size="sm">Xem so sánh</Button>
      </Link>
      <Button size="sm" variant="ghost" onClick={clear}>
        Xóa
      </Button>
    </div>
  );
}
