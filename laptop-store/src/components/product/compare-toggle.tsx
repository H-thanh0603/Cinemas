"use client";

import { useCompare } from "@/context/compare-context";
import { Button } from "@/components/ui";

export function CompareToggle({
  productId,
  size = "sm",
}: {
  productId: string;
  size?: "sm" | "md" | "lg";
}) {
  const { ids, toggle } = useCompare();
  const active = ids.includes(productId);
  const full = ids.length >= 3 && !active;

  return (
    <Button
      size={size}
      variant={active ? "primary" : "secondary"}
      disabled={full}
      onClick={() => toggle(productId)}
      title={full ? "Tối đa 3 sản phẩm" : undefined}
    >
      {active ? "Bỏ so sánh" : "So sánh"}
    </Button>
  );
}
