"use client";

import { useEffect, useState } from "react";

/**
 * Realtime booked seats via SSE (preferred) with polling fallback.
 */
export function useSeatRealtime(
  showtimeId: string,
  initialBooked: string[]
): Set<string> {
  const [booked, setBooked] = useState(() => new Set(initialBooked));

  useEffect(() => {
    setBooked(new Set(initialBooked));
  }, [initialBooked]);

  useEffect(() => {
    let cancelled = false;
    let es: EventSource | null = null;
    let pollTimer: ReturnType<typeof setInterval> | null = null;

    const apply = (ids: string[]) => {
      if (cancelled) return;
      setBooked(new Set(ids));
    };

    const poll = async () => {
      try {
        const res = await fetch(`/api/showtimes/${showtimeId}/seats`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = (await res.json()) as { bookedSeatIds: string[] };
        apply(data.bookedSeatIds ?? []);
      } catch {
        /* ignore transient errors */
      }
    };

    try {
      es = new EventSource(`/api/showtimes/${showtimeId}/seats/stream`);
      es.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data) as { bookedSeatIds: string[] };
          apply(data.bookedSeatIds ?? []);
        } catch {
          /* ignore parse errors */
        }
      };
      es.onerror = () => {
        es?.close();
        es = null;
        // fallback polling every 5s
        if (!pollTimer) {
          void poll();
          pollTimer = setInterval(() => void poll(), 5000);
        }
      };
    } catch {
      void poll();
      pollTimer = setInterval(() => void poll(), 5000);
    }

    return () => {
      cancelled = true;
      es?.close();
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [showtimeId]);

  return booked;
}
