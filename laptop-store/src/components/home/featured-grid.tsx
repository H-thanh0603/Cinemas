import Link from "next/link";
import { products } from "@/data";
import { ProductGrid } from "@/components/product/product-grid";
import { SectionHeading } from "@/components/ui";

export function FeaturedGrid() {
  const featured = products.filter((p) => p.featured).slice(0, 4);
  return (
    <section>
      <SectionHeading
        title="Nổi bật"
        subtitle="Lựa chọn được quan tâm nhiều"
        action={
          <Link
            href="/products"
            className="text-sm text-brand-400 hover:text-brand-300"
          >
            Danh mục →
          </Link>
        }
      />
      <ProductGrid products={featured} />
    </section>
  );
}
