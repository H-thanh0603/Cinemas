import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Badge, EmptyState } from "@/components/ui";
import { formatDate, formatVnd } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Ưu đãi",
};

export const dynamic = "force-dynamic";

export default async function PromotionsPage() {
  const promotions = await prisma.promotion.findMany({
    where: { isActive: true },
    orderBy: { expiresAt: "asc" },
  });

  const now = new Date();
  const active = promotions.filter((p) => p.expiresAt > now && p.startsAt <= now);
  const expired = promotions.filter((p) => p.expiresAt <= now);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">Ưu đãi & Khuyến mãi</h1>
      <p className="mt-1 text-sm text-muted">
        Nhập mã ưu đãi ở bước thanh toán để được giảm giá
      </p>

      {active.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon="🎁"
            title="Hiện chưa có ưu đãi nào"
            description="Các chương trình khuyến mãi mới sẽ sớm được cập nhật."
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {active.map((promo) => (
            <div
              key={promo.id}
              className="relative overflow-hidden rounded-2xl border border-accent/25 bg-gradient-to-br from-surface to-surface-raised p-6"
            >
              <span className="absolute -right-5 -top-5 text-8xl opacity-10">
                🎁
              </span>
              <div className="flex items-center justify-between">
                <span className="inline-block rounded-lg border border-dashed border-accent/60 bg-accent/10 px-3 py-1.5 font-mono text-base font-bold tracking-wider text-accent">
                  {promo.code}
                </span>
                <Badge color="success">Đang diễn ra</Badge>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted">
                {promo.description}
              </p>
              <dl className="mt-4 space-y-1.5 text-xs text-muted-dark">
                <div className="flex justify-between">
                  <dt>Mức giảm</dt>
                  <dd className="font-semibold text-foreground">
                    {promo.discountType === "PERCENT"
                      ? `${promo.discountValue}%${promo.maxDiscount ? ` (tối đa ${formatVnd(promo.maxDiscount)})` : ""}`
                      : formatVnd(promo.discountValue)}
                  </dd>
                </div>
                {promo.minOrderValue > 0 && (
                  <div className="flex justify-between">
                    <dt>Đơn tối thiểu</dt>
                    <dd className="font-semibold text-foreground">
                      {formatVnd(promo.minOrderValue)}
                    </dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt>Hạn sử dụng</dt>
                  <dd className="font-semibold text-foreground">
                    {formatDate(promo.expiresAt)}
                  </dd>
                </div>
                {promo.usageLimit && (
                  <div className="flex justify-between">
                    <dt>Lượt còn lại</dt>
                    <dd className="font-semibold text-foreground">
                      {Math.max(0, promo.usageLimit - promo.usedCount)}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          ))}
        </div>
      )}

      {expired.length > 0 && (
        <div className="mt-12">
          <h2 className="text-lg font-bold text-muted">Đã kết thúc</h2>
          <div className="mt-4 grid gap-4 opacity-60 sm:grid-cols-2 lg:grid-cols-3">
            {expired.map((promo) => (
              <div
                key={promo.id}
                className="rounded-2xl border border-border bg-surface p-5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-bold tracking-wider text-muted line-through">
                    {promo.code}
                  </span>
                  <Badge>Hết hạn</Badge>
                </div>
                <p className="mt-2 text-xs text-muted">{promo.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
