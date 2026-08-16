import { PromotionForm } from "./promotion-form";

export const dynamic = "force-dynamic";

export default async function NewPromotionPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Thêm khuyến mãi mới</h1>
      <PromotionForm />
    </div>
  );
}
