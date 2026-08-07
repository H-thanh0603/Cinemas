import { prisma } from "@/lib/prisma";
import { getLockedSeatIds } from "@/lib/booking-expire";
import { checkApiRateLimit } from "@/lib/api-rate-limit";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Simple in-memory connection limiter per showtime.
// In a multi-instance deployment, use a shared store (Redis) instead.
const MAX_CONNECTIONS_PER_SHOWTIME = 10;
const connections = new Map<string, number>();

function acquire(showtimeId: string): boolean {
  const current = connections.get(showtimeId) ?? 0;
  if (current >= MAX_CONNECTIONS_PER_SHOWTIME) return false;
  connections.set(showtimeId, current + 1);
  return true;
}

function release(showtimeId: string): void {
  const next = (connections.get(showtimeId) ?? 1) - 1;
  if (next <= 0) {
    connections.delete(showtimeId);
  } else {
    connections.set(showtimeId, next);
  }
}

/**
 * Server-Sent Events stream of locked seat IDs for a showtime.
 * Limited to MAX_CONNECTIONS_PER_SHOWTIME concurrent connections per showtime.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: showtimeId } = await params;
  const rid = req.headers.get("x-request-id") ?? crypto.randomUUID();

  const rateLimited = await checkApiRateLimit(req.headers, "seats-stream", 20, 60_000);
  if (!rateLimited.allowed) {
    logger.warn("seats-stream rate limited", { rid, showtimeId });
    return new Response("Too many requests", {
      status: 429,
      headers: { "Retry-After": String(rateLimited.retryAfterSeconds) },
    });
  }

  const showtime = await prisma.showtime.findUnique({
    where: { id: showtimeId },
    select: { id: true },
  });
  if (!showtime) {
    return new Response("Not found", { status: 404 });
  }

  if (!acquire(showtimeId)) {
    return new Response("Too many connections", { status: 429 });
  }

  let lastKey = "";
  let closed = false;
  let interval: ReturnType<typeof setInterval> | undefined;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const cleanup = () => {
    closed = true;
    if (interval) clearInterval(interval);
    if (timeout) clearTimeout(timeout);
    release(showtimeId);
  };

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
          logger.error("SSE seats error", e, { rid, showtimeId });
        }
      };

      await tick();
      interval = setInterval(() => {
        void tick();
      }, 5000);

      timeout = setTimeout(() => {
        cleanup();
        try {
          controller.close();
        } catch {
          /* ignore */
        }
      }, 10 * 60_000);

      req.signal.addEventListener("abort", () => {
        cleanup();
        try {
          controller.close();
        } catch {
          /* ignore */
        }
      }, { once: true });
    },
    cancel() {
      cleanup();
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
