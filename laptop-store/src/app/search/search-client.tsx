"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { products } from "@/data";
import { searchProducts } from "@/lib/products";
import { ProductGrid } from "@/components/product/product-grid";
import { EmptyState, SectionHeading } from "@/components/ui";

export function SearchClient() {
  const params = useSearchParams();
  const q = params.get("q")?.trim() ?? "";
  const list = q ? searchProducts(products, q) : [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
      <SectionHeading
        title="Tìm kiếm"
        subtitle={
          q
            ? `“${q}” · ${list.length} kết quả`
            : "Nhập từ khóa ở thanh tìm kiếm"
        }
        action={
          <Link href="/products" className="text-sm text-brand-400">
            Catalog đầy đủ →
          </Link>
        }
      />
      {!q ? (
        <EmptyState
          title="Chưa có từ khóa"
          description="Tìm theo tên máy, hãng hoặc CPU."
          actionHref="/products"
          actionLabel="Xem sản phẩm"
        />
      ) : list.length === 0 ? (
        <EmptyState
          title="Không tìm thấy"
          description={`Không có laptop khớp “${q}”.`}
          actionHref="/products"
          actionLabel="Xem tất cả"
        />
      ) : (
        <ProductGrid products={list} />
      )}
    </div>
  );
}
