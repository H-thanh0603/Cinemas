import { prisma } from "@/lib/prisma";
import { RoomForm } from "./room-form";

export const dynamic = "force-dynamic";

export default async function NewRoomPage() {
  const cinemas = await prisma.cinema.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Thêm phòng chiếu mới</h1>
      <RoomForm cinemas={cinemas} />
    </div>
  );
}
