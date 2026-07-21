import { prisma } from "@/lib/prisma";
import { getLockedSeatIds } from "@/lib/booking-expire";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Server-Sent Events stream of locked seat IDs for a showtime.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: showtimeId } = await params;

  const showtime = await prisma.showtime.findUnique({
    where: { id: showtimeId },
    select: { id: true },
  });
  if (!showtime) {
    return new Response("Not found", { status: 404 });
  }

  let lastKey = "";
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (data: unknown) => {
        if (closed) return;
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
        );
      };

      const tick = async () => {
        if (closed) return;
        try {
          const ids = (await getLockedSeatIds(showtimeId)).sort();
          const key = ids.join(",");
          if (key !== lastKey) {
            lastKey = key;
            send({
              showtimeId,
              bookedSeatIds: ids,
              serverTime: new Date().toISOString(),
            });
          } else {
            controller.enqueue(encoder.encode(`: ping\n\n`));
          }
        } catch (e) {
          console.error("SSE seats error:", e);
        }
      };

      await tick();
      const interval = setInterval(() => {
        void tick();
      }, 3000);

      const timeout = setTimeout(() => {
        closed = true;
        clearInterval(interval);
        try {
          controller.close();
        } catch {
          /* ignore */
        }
      }, 10 * 60_000);

      void timeout;
    },
    cancel() {
      closed = true;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
