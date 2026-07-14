"use client";

import { brands, categories } from "@/data";
import type { BrandId, CategoryId } from "@/types";
import { cn } from "@/lib/cn";

export interface FilterState {
  brands: BrandId[];
  categories: CategoryId[];
  minPrice: string;
  maxPrice: string;
  minRamGb: string;
}

export function FilterSidebar({
  value,
  onChange,
}: {
  value: FilterState;
  onChange: (next: FilterState) => void;
}) {
  function toggleBrand(id: BrandId) {
    const has = value.brands.includes(id);
    onChange({
      ...value,
      brands: has
        ? value.brands.filter((b) => b !== id)
        : [...value.brands, id],
    });
  }

  function toggleCategory(id: CategoryId) {
    const has = value.categories.includes(id);
    onChange({
      ...value,
      categories: has
        ? value.categories.filter((c) => c !== id)
        : [...value.categories, id],
    });
  }

  return (
    <aside className="space-y-6 rounded-2xl border border-white/5 bg-surface-900/60 p-4">
      <div>
        <h3 className="text-sm font-semibold text-white">Hãng</h3>
        <div className="mt-3 space-y-2">
          {brands.map((b) => (
            <label
              key={b.id}
              className="flex cursor-pointer items-center gap-2 text-sm text-surface-300"
            >
              <input
                type="checkbox"
                checked={value.brands.includes(b.id)}
                onChange={() => toggleBrand(b.id)}
                className="accent-brand-500"
              />
              {b.name}
            </label>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-white">Danh mục</h3>
        <div className="mt-3 space-y-2">
          {categories.map((c) => (
            <label
              key={c.id}
              className="flex cursor-pointer items-center gap-2 text-sm text-surface-300"
            >
              <input
                type="checkbox"
                checked={value.categories.includes(c.id)}
                onChange={() => toggleCategory(c.id)}
                className="accent-brand-500"
              />
              {c.name}
            </label>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-white">Giá (VND)</h3>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <input
            type="number"
            placeholder="Từ"
            value={value.minPrice}
            onChange={(e) =>
              onChange({ ...value, minPrice: e.target.value })
            }
            className={inputCls}
          />
          <input
            type="number"
            placeholder="Đến"
            value={value.maxPrice}
            onChange={(e) =>
              onChange({ ...value, maxPrice: e.target.value })
            }
            className={inputCls}
          />
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-white">RAM tối thiểu</h3>
        <select
          value={value.minRamGb}
          onChange={(e) => onChange({ ...value, minRamGb: e.target.value })}
          className={cn(inputCls, "mt-3")}
        >
          <option value="">Tất cả</option>
          <option value="8">8GB+</option>
          <option value="16">16GB+</option>
          <option value="32">32GB+</option>
        </select>
      </div>
    </aside>
  );
}

const inputCls =
  "w-full rounded-lg border border-white/10 bg-surface-950 px-2 py-2 text-sm text-surface-100 outline-none focus:border-brand-500";
