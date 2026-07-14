import { Suspense } from "react";
import { ProductsClient } from "./products-client";

export const metadata = { title: "Sản phẩm" };

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-8 text-surface-400 lg:px-6">
          Đang tải catalog…
        </div>
      }
    >
      <ProductsClient />
    </Suspense>
  );
}
