"use client";

import { getProductById } from "@/data";
import { useCart } from "@/context/cart-context";
import { CartItemRow } from "@/components/cart/cart-item";
import { CartSummary } from "@/components/cart/cart-summary";
import { EmptyState, SectionHeading } from "@/components/ui";

export default function CartPage() {
  const { items, subtotal, hydrated } = useCart();

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 text-surface-400 lg:px-6">
        Đang tải giỏ hàng…
      </div>
    );
  }

  const rows = items
    .map((i) => {
      const product = getProductById(i.productId);
      return product ? { product, qty: i.qty } : null;
    })
    .filter(Boolean) as { product: NonNullable<ReturnType<typeof getProductById>>; qty: number }[];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
      <SectionHeading title="Giỏ hàng" subtitle={`${rows.length} dòng sản phẩm`} />
      {rows.length === 0 ? (
        <EmptyState
          title="Giỏ hàng trống"
          description="Thêm laptop yêu thích để tiếp tục."
          actionHref="/products"
          actionLabel="Mua sắm ngay"
        />
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="rounded-2xl border border-white/5 bg-surface-900/40 px-4">
            {rows.map(({ product, qty }) => (
              <CartItemRow key={product.id} product={product} qty={qty} />
            ))}
          </div>
          <CartSummary subtotal={subtotal} />
        </div>
      )}
    </div>
  );
}
