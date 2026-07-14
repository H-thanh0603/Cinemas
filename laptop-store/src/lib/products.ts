import type { BrandId, CategoryId, Product } from "@/types";

export type ProductSort = "price-asc" | "price-desc" | "newest" | "rating";

export interface ProductFilter {
  q?: string;
  brands?: BrandId[];
  categories?: CategoryId[];
  minPrice?: number;
  maxPrice?: number;
  minRamGb?: number;
}

export function effectivePrice(p: Product): number {
  return p.salePrice ?? p.price;
}

export function filterProducts(
  list: Product[],
  f: ProductFilter
): Product[] {
  return list.filter((p) => {
    if (f.brands?.length && !f.brands.includes(p.brand)) return false;
    if (f.categories?.length && !f.categories.includes(p.category))
      return false;
    const price = effectivePrice(p);
    if (f.minPrice != null && price < f.minPrice) return false;
    if (f.maxPrice != null && price > f.maxPrice) return false;
    if (f.minRamGb != null) {
      const ram = parseInt(p.specs.ram, 10);
      if (Number.isNaN(ram) || ram < f.minRamGb) return false;
    }
    if (f.q?.trim()) {
      const q = f.q.trim().toLowerCase();
      const hay =
        `${p.name} ${p.brand} ${p.tags.join(" ")} ${p.specs.cpu}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function searchProducts(list: Product[], q: string): Product[] {
  return filterProducts(list, { q });
}

export function sortProducts(
  list: Product[],
  sort: ProductSort
): Product[] {
  const copy = [...list];
  switch (sort) {
    case "price-asc":
      return copy.sort((a, b) => effectivePrice(a) - effectivePrice(b));
    case "price-desc":
      return copy.sort((a, b) => effectivePrice(b) - effectivePrice(a));
    case "rating":
      return copy.sort((a, b) => b.rating - a.rating);
    case "newest":
    default:
      return copy;
  }
}
