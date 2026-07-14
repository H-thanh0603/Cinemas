import Link from "next/link";
import type { Order } from "@/types";
import { Badge, Card } from "@/components/ui";
import { formatVnd } from "@/lib/format";

const statusLabel: Record<Order["status"], string> = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  shipping: "Đang giao",
  delivered: "Đã giao",
  cancelled: "Đã hủy",
};

const statusTone: Record<
  Order["status"],
  "muted" | "brand" | "success" | "warn"
> = {
  pending: "warn",
  confirmed: "brand",
  shipping: "brand",
  delivered: "success",
  cancelled: "muted",
};

export function OrderCard({ order }: { order: Order }) {
  return (
    <Link href={`/account/orders/${order.id}`}>
      <Card className="p-4 transition hover:border-brand-500/30">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="font-semibold text-white">#{order.code}</p>
            <p className="text-xs text-surface-500">
              {new Date(order.createdAt).toLocaleString("vi-VN")}
            </p>
          </div>
          <Badge tone={statusTone[order.status]}>
            {statusLabel[order.status]}
          </Badge>
        </div>
        <p className="mt-3 text-sm text-surface-400">
          {order.items.length} sản phẩm ·{" "}
          <span className="text-brand-400 font-medium">
            {formatVnd(order.total)}
          </span>
        </p>
      </Card>
    </Link>
  );
}
