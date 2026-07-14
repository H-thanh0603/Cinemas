import { notFound } from "next/navigation";
import { getOrderById, orders } from "@/data";
import { OrderTimeline } from "@/components/account/order-timeline";
import { Card } from "@/components/ui";
import { formatVnd } from "@/lib/format";

export function generateStaticParams() {
  return orders.map((o) => ({ id: o.id }));
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = getOrderById(id);
  if (!order) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Đơn #{order.code}</h1>
      <p className="mt-1 text-sm text-surface-400">
        {new Date(order.createdAt).toLocaleString("vi-VN")}
      </p>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-semibold text-white">Trạng thái</h2>
          <div className="mt-4">
            <OrderTimeline status={order.status} />
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="font-semibold text-white">Giao hàng</h2>
          <p className="mt-3 text-sm text-surface-300">{order.customerName}</p>
          <p className="text-sm text-surface-400">{order.phone}</p>
          <p className="mt-2 text-sm text-surface-400">{order.shippingAddress}</p>
        </Card>
      </div>
      <Card className="mt-6 p-5">
        <h2 className="font-semibold text-white">Sản phẩm</h2>
        <ul className="mt-4 divide-y divide-white/5">
          {order.items.map((item) => (
            <li
              key={item.productId + item.name}
              className="flex justify-between gap-4 py-3 text-sm"
            >
              <span className="text-surface-200">
                {item.name} × {item.qty}
              </span>
              <span className="text-brand-400">
                {formatVnd(item.unitPrice * item.qty)}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex justify-between border-t border-white/5 pt-4 font-semibold">
          <span className="text-white">Tổng</span>
          <span className="text-brand-400">{formatVnd(order.total)}</span>
        </div>
      </Card>
    </div>
  );
}
