import { prisma } from "@/lib/prisma";
import { ShowtimeForm } from "./showtime-form";

export const dynamic = "force-dynamic";

export default async function NewShowtimePage() {
  const [movies, rooms] = await Promise.all([
    prisma.movie.findMany({
      where: { status: { in: ["NOW_SHOWING", "COMING_SOON"] } },
      orderBy: { title: "asc" },
    }),
    prisma.room.findMany({
      where: { isActive: true },
      orderBy: [{ cinema: { name: "asc" } }, { name: "asc" }],
      include: { cinema: true },
    }),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Thêm suất chiếu mới</h1>
      <ShowtimeForm movies={movies} rooms={rooms} />
    </div>
  );
}
