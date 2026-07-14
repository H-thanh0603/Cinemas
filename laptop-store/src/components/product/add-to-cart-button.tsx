"use client";

import { useState } from "react";
import { useCart } from "@/context/cart-context";
import { Button } from "@/components/ui";

export function AddToCartButton({
  productId,
  size = "md",
  className,
}: {
  productId: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  return (
    <Button
      size={size}
      className={className}
      onClick={() => {
        addItem(productId);
        setAdded(true);
        setTimeout(() => setAdded(false), 1500);
      }}
    >
      {added ? "Đã thêm ✓" : "Thêm giỏ"}
    </Button>
  );
}
