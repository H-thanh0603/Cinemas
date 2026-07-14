import type { OrderStatus } from "@/types";
import { cn } from "@/lib/cn";

const steps: { key: OrderStatus; label: string }[] = [
  { key: "pending", label: "Chờ xác nhận" },
  { key: "confirmed", label: "Đã xác nhận" },
  { key: "shipping", label: "Đang giao" },
  { key: "delivered", label: "Đã giao" },
];

const orderIndex: Record<OrderStatus, number> = {
  pending: 0,
  confirmed: 1,
  shipping: 2,
  delivered: 3,
  cancelled: -1,
};

export function OrderTimeline({ status }: { status: OrderStatus }) {
  if (status === "cancelled") {
    return (
      <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
        Đơn hàng đã hủy
      </p>
    );
  }
  const current = orderIndex[status];
  return (
    <ol className="space-y-3">
      {steps.map((step, i) => {
        const done = i <= current;
        return (
          <li key={step.key} className="flex items-center gap-3">
            <span
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold",
                done
                  ? "bg-brand-600 text-white"
                  : "bg-surface-800 text-surface-500"
              )}
            >
              {i + 1}
            </span>
            <span
              className={cn(
                "text-sm",
                done ? "text-white font-medium" : "text-surface-500"
              )}
            >
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
