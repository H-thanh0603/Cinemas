"use client";

import type { ProductSort } from "@/lib/products";

export function SortSelect({
  value,
  onChange,
}: {
  value: ProductSort;
  onChange: (v: ProductSort) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as ProductSort)}
      className="h-10 rounded-lg border border-white/10 bg-surface-900 px-3 text-sm text-surface-100 outline-none focus:border-brand-500"
    >
      <option value="newest">Mới nhất</option>
      <option value="price-asc">Giá tăng dần</option>
      <option value="price-desc">Giá giảm dần</option>
      <option value="rating">Đánh giá cao</option>
    </select>
  );
}
