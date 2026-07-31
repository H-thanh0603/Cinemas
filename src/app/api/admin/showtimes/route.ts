import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { parseAdminBody, showtimeSchema } from "@/lib/admin-schemas";
import { writeAuditLog } from "@/lib/audit-log";

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ error: "Cần tài khoản ADMIN" }, { status: 403 });
  const parsed = parseAdminBody(showtimeSchema, await req.json());
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const body = parsed.data;

  if (!body.movieId || !body.roomId || !body.startTime || !body.basePrice || !body.format) {
    return NextResponse.json({ error: "Thiếu trường bắt buộc" }, { status: 400 });
  }

  const startsAt = new Date(body.startTime);
  if (startsAt < new Date()) {
    return NextResponse.json({ error: "Không thể tạo suất chiếu trong quá khứ" }, { status: 400 });
  }

  const movie = await prisma.movie.findUnique({ where: { id: body.movieId } });
  if (!movie) {
    return NextResponse.json({ error: "Không tìm thấy phim" }, { status: 404 });
  }

  const room = await prisma.room.findUnique({ where: { id: body.roomId } });
  if (!room) {
    return NextResponse.json({ error: "Không tìm thấy phòng" }, { status: 404 });
  }

  const endsAt = new Date(startsAt.getTime() + movie.durationMin * 60000);

  // Check for conflicts in the same room
  const conflicts = await prisma.showtime.findMany({
    where: {
      roomId: body.roomId,
      status: "SCHEDULED",
      startsAt: {
        lt: endsAt,
      },
    },
    select: { startsAt: true, movie: { select: { title: true, durationMin: true } } },
  });

  for (const c of conflicts) {
    const cEnd = new Date(c.startsAt.getTime() + c.movie.durationMin * 60000);
    if (cEnd > startsAt) {
      return NextResponse.json(
        {
          error: `Xung đột lịch chiếu: phòng đã có "${c.movie.title}" lúc ${c.startsAt.toLocaleString("vi-VN")}`,
        },
        { status: 409 }
      );
    }
  }

  const showtime = await prisma.showtime.create({
    data: {
      movieId: body.movieId,
      cinemaId: room.cinemaId,
      roomId: body.roomId,
      startsAt,
      endsAt,
      format: body.format,
      basePrice: Number(body.basePrice),
      status: "SCHEDULED",
    },
  });

  await writeAuditLog({ actorId: guard.session.user.id, action: "CREATE", entity: "Showtime", entityId: showtime.id });
  return NextResponse.json(showtime, { status: 201 });
}
