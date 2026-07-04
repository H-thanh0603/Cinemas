import { prisma } from "@/lib/prisma";
import { CinemaEditForm } from "./cinema-edit-form";

export const dynamic = "force-dynamic";

export default async function EditCinemaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cinema = await prisma.cinema.findUnique({ where: { id } });

  if (!cinema) {
    return (
      <div className="py-20 text-center">
        <p className="text-lg font-semibold">Không tìm thấy rạp</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Chỉnh sửa rạp</h1>
        <p className="text-sm text-muted">{cinema.name}</p>
      </div>
      <CinemaEditForm cinema={cinema} />
    </div>
  );
}
