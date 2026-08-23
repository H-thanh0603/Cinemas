import { prisma } from "@/lib/prisma";
import { PromotionEditForm } from "./promotion-edit-form";

export const dynamic = "force-dynamic";

export default async function EditPromotionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const promo = await prisma.promotion.findUnique({ where: { id } });

  if (!promo) {
    return (
      <div className="py-20 text-center">
        <p className="text-lg font-semibold">Không tìm thấy khuyến mãi</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Chỉnh sửa khuyến mãi</h1>
        <p className="text-sm text-muted">{promo.code}</p>
      </div>
      <PromotionEditForm promo={promo} />
    </div>
  );
}
