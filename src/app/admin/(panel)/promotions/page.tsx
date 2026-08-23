import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatVnd, formatDate } from "@/lib/constants";
import { PromotionActions } from "./promotion-actions";

export const dynamic = "force-dynamic";

export default async function AdminPromotionsPage() {
  const promos = await prisma.promotion.findMany({
    orderBy: { expiresAt: "desc" },
    include: { _count: { select: { bookings: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản lý khuyến mãi</h1>
          <p className="text-sm text-muted">{promos.length} mã khuyến mãi</p>
        </div>
        <Link
          href="/admin/promotions/new"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-background hover:opacity-90"
        >
          + Thêm khuyến mãi
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface-raised text-left text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3">Mã</th>
              <th className="px-4 py-3">Mô tả</th>
              <th className="px-4 py-3">Giảm giá</th>
              <th className="px-4 py-3">Hạn sử dụng</th>
              <th className="px-4 py-3">Đã dùng</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {promos.map((p) => {
              const expired = p.expiresAt < new Date();
              return (
                <tr key={p.id} className="hover:bg-surface-raised/50">
                  <td className="px-4 py-3 font-mono font-semibold">{p.code}</td>
                  <td className="px-4 py-3 text-muted">{p.description}</td>
                  <td className="px-4 py-3">
                    {p.discountType === "PERCENT"
                      ? `${p.discountValue}%`
                      : formatVnd(p.discountValue)}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">{formatDate(p.expiresAt)}</td>
                  <td className="px-4 py-3">{p._count.bookings}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded px-2 py-0.5 text-xs font-semibold ${
                      !p.isActive ? "bg-gray-500/20 text-gray-400" :
                      expired ? "bg-red-500/20 text-red-400" :
                      "bg-green-500/20 text-green-400"
                    }`}>
                      {!p.isActive ? "Tắt" : expired ? "Hết hạn" : "Hoạt động"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <PromotionActions id={p.id} code={p.code} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
