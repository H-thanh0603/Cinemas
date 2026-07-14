import { describe, it, expect } from "vitest";
import { filterProducts, searchProducts, sortProducts } from "./products";
import type { Product } from "@/types";

const sample: Product[] = [
  {
    id: "1",
    slug: "a",
    name: "ASUS ROG Strix",
    brand: "asus",
    category: "gaming",
    price: 30_000_000,
    salePrice: 28_000_000,
    rating: 4.5,
    reviewCount: 10,
    stock: 5,
    tags: ["gaming"],
    description: "",
    specs: {
      cpu: "i7",
      ram: "16GB",
      storage: "512GB",
      gpu: "RTX",
      display: "15",
      battery: "70Wh",
      weight: "2kg",
    },
    images: [],
  },
  {
    id: "2",
    slug: "b",
    name: "MacBook Air M3",
    brand: "apple",
    category: "ultralight",
    price: 20_000_000,
    rating: 5,
    reviewCount: 20,
    stock: 3,
    tags: [],
    description: "",
    specs: {
      cpu: "M3",
      ram: "8GB",
      storage: "256GB",
      gpu: "GPU 8",
      display: "13",
      battery: "50Wh",
      weight: "1.2kg",
    },
    images: [],
  },
];

describe("filterProducts", () => {
  it("filters by brand", () => {
    expect(filterProducts(sample, { brands: ["apple"] })).toHaveLength(1);
  });
  it("filters by price range using effective price", () => {
    expect(filterProducts(sample, { minPrice: 29_000_000 })).toHaveLength(0);
    expect(filterProducts(sample, { maxPrice: 28_500_000 })).toHaveLength(2);
  });
});

describe("searchProducts", () => {
  it("matches name case-insensitively", () => {
    expect(searchProducts(sample, "macbook")).toHaveLength(1);
  });
});

describe("sortProducts", () => {
  it("sorts price-asc by effective price", () => {
    const sorted = sortProducts(sample, "price-asc");
    expect(sorted[0].id).toBe("2");
  });
});
