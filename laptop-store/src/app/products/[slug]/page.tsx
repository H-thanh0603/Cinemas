import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getProductBySlug,
  getRelatedProducts,
  getBrandName,
  products,
} from "@/data";
import { ProductGallery } from "@/components/product/product-gallery";
import { SpecTable } from "@/components/product/spec-table";
import { AddToCartButton } from "@/components/product/add-to-cart-button";
import { CompareToggle } from "@/components/product/compare-toggle";
import { ProductGrid } from "@/components/product/product-grid";
import { Badge, Price, Rating, SectionHeading } from "@/components/ui";

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return { title: "Không tìm thấy" };
  return { title: product.name, description: product.description };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) notFound();

  const related = getRelatedProducts(product);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
      <div className="grid gap-10 lg:grid-cols-2">
        <ProductGallery images={product.images} name={product.name} />
        <div>
          <p className="text-sm uppercase tracking-wide text-surface-500">
            {getBrandName(product.brand)}
          </p>
          <h1 className="mt-1 text-3xl font-bold text-white">{product.name}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Rating value={product.rating} count={product.reviewCount} />
            {product.deal && <Badge>Deal sốc</Badge>}
            <Badge tone="muted">
              {product.stock > 0 ? `Còn ${product.stock} máy` : "Hết hàng"}
            </Badge>
          </div>
          <div className="mt-6">
            <Price
              price={product.price}
              salePrice={product.salePrice}
              size="lg"
            />
          </div>
          <p className="mt-4 text-surface-300 leading-relaxed">
            {product.description}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <AddToCartButton productId={product.id} size="lg" />
            <CompareToggle productId={product.id} size="md" />
          </div>
          <div className="mt-10">
            <h2 className="mb-3 text-lg font-semibold text-white">
              Thông số kỹ thuật
            </h2>
            <SpecTable specs={product.specs} />
          </div>
        </div>
      </div>
      {related.length > 0 && (
        <div className="mt-16">
          <SectionHeading title="Sản phẩm liên quan" />
          <ProductGrid products={related} />
        </div>
      )}
    </div>
  );
}
