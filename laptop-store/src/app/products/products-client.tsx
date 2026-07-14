"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { products } from "@/data";
import {
  filterProducts,
  sortProducts,
  type ProductSort,
} from "@/lib/products";
import type { BrandId, CategoryId } from "@/types";
import {
  FilterSidebar,
  type FilterState,
} from "@/components/product/filter-sidebar";
import { SortSelect } from "@/components/product/sort-select";
import { ProductGrid } from "@/components/product/product-grid";
import { EmptyState, SectionHeading } from "@/components/ui";

export function ProductsClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [filters, setFilters] = useState<FilterState>({
    brands: [],
    categories: [],
    minPrice: "",
    maxPrice: "",
    minRamGb: "",
  });
  const [sort, setSort] = useState<ProductSort>("newest");
  const [q, setQ] = useState("");

  useEffect(() => {
    const brand = searchParams.get("brand") as BrandId | null;
    const category = searchParams.get("category") as CategoryId | null;
    const query = searchParams.get("q") ?? "";
    const s = (searchParams.get("sort") as ProductSort) || "newest";
    setQ(query);
    setSort(
      ["price-asc", "price-desc", "newest", "rating"].includes(s)
        ? s
        : "newest"
    );
    setFilters((prev) => ({
      ...prev,
      brands: brand ? [brand] : [],
      categories: category ? [category] : [],
      minPrice: searchParams.get("min") ?? "",
      maxPrice: searchParams.get("max") ?? "",
    }));
  }, [searchParams]);

  const list = useMemo(() => {
    const filtered = filterProducts(products, {
      q,
      brands: filters.brands.length ? filters.brands : undefined,
      categories: filters.categories.length ? filters.categories : undefined,
      minPrice: filters.minPrice ? Number(filters.minPrice) : undefined,
      maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
      minRamGb: filters.minRamGb ? Number(filters.minRamGb) : undefined,
    });
    return sortProducts(filtered, sort);
  }, [filters, sort, q]);

  function syncUrl(nextFilters: FilterState, nextSort: ProductSort) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    nextFilters.brands.forEach((b) => params.append("brand", b));
    nextFilters.categories.forEach((c) => params.append("category", c));
    if (nextFilters.minPrice) params.set("min", nextFilters.minPrice);
    if (nextFilters.maxPrice) params.set("max", nextFilters.maxPrice);
    if (nextSort !== "newest") params.set("sort", nextSort);
    const qs = params.toString();
    router.replace(qs ? `/products?${qs}` : "/products");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
      <SectionHeading
        title="Sản phẩm"
        subtitle={
          q
            ? `Kết quả cho “${q}” · ${list.length} laptop`
            : `${list.length} laptop trong catalog`
        }
      />
      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <FilterSidebar
          value={filters}
          onChange={(f) => {
            setFilters(f);
            syncUrl(f, sort);
          }}
        />
        <div>
          <div className="mb-4 flex justify-end">
            <SortSelect
              value={sort}
              onChange={(s) => {
                setSort(s);
                syncUrl(filters, s);
              }}
            />
          </div>
          {list.length === 0 ? (
            <EmptyState
              title="Không có sản phẩm phù hợp"
              description="Thử bỏ bớt bộ lọc hoặc tìm từ khóa khác."
              actionHref="/products"
              actionLabel="Xóa lọc"
            />
          ) : (
            <ProductGrid products={list} />
          )}
        </div>
      </div>
    </div>
  );
}
