"use client";

import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/types";
import { Price, Button } from "@/components/ui";
import { useCart } from "@/context/cart-context";

export function CartItemRow({
  product,
  qty,
}: {
  product: Product;
  qty: number;
}) {
  const { setQty, removeItem } = useCart();

  return (
    <div className="flex flex-col gap-4 border-b border-white/5 py-4 sm:flex-row sm:items-center">
      <Link
        href={`/products/${product.slug}`}
        className="relative h-24 w-full shrink-0 overflow-hidden rounded-xl bg-surface-800 sm:w-32"
      >
        {product.images[0] && (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-cover"
            sizes="128px"
          />
        )}
      </Link>
      <div className="min-w-0 flex-1">
        <Link
          href={`/products/${product.slug}`}
          className="font-medium text-white hover:text-brand-300"
        >
          {product.name}
        </Link>
        <div className="mt-1">
          <Price price={product.price} salePrice={product.salePrice} size="sm" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setQty(product.id, qty - 1)}
        >
          −
        </Button>
        <span className="w-8 text-center text-sm">{qty}</span>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setQty(product.id, qty + 1)}
        >
          +
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => removeItem(product.id)}
        >
          Xóa
        </Button>
      </div>
    </div>
  );
}
