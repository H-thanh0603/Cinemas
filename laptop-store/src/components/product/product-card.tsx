"use client";

import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/types";
import { Badge, Card, Price, Rating } from "@/components/ui";
import { getBrandName } from "@/data";
import { AddToCartButton } from "./add-to-cart-button";
import { CompareToggle } from "./compare-toggle";

export function ProductCard({ product }: { product: Product }) {
  const discount =
    product.salePrice != null && product.salePrice < product.price
      ? Math.round((1 - product.salePrice / product.price) * 100)
      : 0;

  return (
    <Card className="group flex h-full flex-col overflow-hidden transition hover:-translate-y-0.5 hover:border-brand-500/30">
      <Link href={`/products/${product.slug}`} className="relative block">
        <div className="relative aspect-[4/3] overflow-hidden bg-surface-800">
          {product.images[0] ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-cover transition duration-500 group-hover:scale-105"
              sizes="(max-width:768px) 100vw, 25vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-brand-900/40 to-surface-900 text-surface-500">
              TechZone
            </div>
          )}
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            {discount > 0 && <Badge tone="warn">-{discount}%</Badge>}
            {product.deal && <Badge>Deal</Badge>}
          </div>
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs uppercase tracking-wide text-surface-500">
          {getBrandName(product.brand)}
        </p>
        <Link href={`/products/${product.slug}`}>
          <h3 className="mt-1 line-clamp-2 text-sm font-semibold text-white hover:text-brand-300">
            {product.name}
          </h3>
        </Link>
        <div className="mt-2">
          <Rating value={product.rating} count={product.reviewCount} />
        </div>
        <div className="mt-3">
          <Price price={product.price} salePrice={product.salePrice} />
        </div>
        <div className="mt-auto flex gap-2 pt-4">
          <AddToCartButton productId={product.id} size="sm" className="flex-1" />
          <CompareToggle productId={product.id} />
        </div>
      </div>
    </Card>
  );
}
