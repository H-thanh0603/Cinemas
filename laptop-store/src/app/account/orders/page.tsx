import { orders } from "@/data";
import { OrderCard } from "@/components/account/order-card";

export default function OrdersPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Đơn hàng</h1>
      <p className="mt-1 text-sm text-surface-400">
        Dữ liệu mẫu cho tài khoản demo
      </p>
      <div className="mt-6 space-y-3">
        {orders.map((o) => (
          <OrderCard key={o.id} order={o} />
        ))}
      </div>
    </div>
  );
}
