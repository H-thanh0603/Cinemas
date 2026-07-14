import Link from "next/link";
import { products } from "@/data";
import { ProductGrid } from "@/components/product/product-grid";
import { SectionHeading } from "@/components/ui";

export function DealSection() {
  const deals = products.filter((p) => p.deal).slice(0, 4);
  return (
    <section>
      <SectionHeading
        title="Hot deals"
        subtitle="Giảm giá đang diễn ra"
        action={
          <Link
            href="/products"
            className="text-sm text-brand-400 hover:text-brand-300"
          >
            Xem tất cả →
          </Link>
        }
      />
      <ProductGrid products={deals} />
    </section>
  );
}
