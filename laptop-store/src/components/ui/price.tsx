import { formatVnd } from "@/lib/format";
import { cn } from "@/lib/cn";

export function Price({
  price,
  salePrice,
  className,
  size = "md",
}: {
  price: number;
  salePrice?: number;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-xl",
  };
  const current = salePrice ?? price;
  return (
    <div className={cn("flex flex-wrap items-baseline gap-2", className)}>
      <span className={cn("font-semibold text-brand-400", sizes[size])}>
        {formatVnd(current)}
      </span>
      {salePrice != null && salePrice < price && (
        <span className="text-sm text-surface-500 line-through">
          {formatVnd(price)}
        </span>
      )}
    </div>
  );
}
