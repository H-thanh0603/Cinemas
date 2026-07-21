"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function formatRemain(ms: number): string {
  if (ms <= 0) return "00:00";
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function HoldCountdown({
  expiresAt,
  label = "Thời gian giữ ghế còn lại",
  onExpire,
}: {
  expiresAt: string | Date;
  label?: string;
  onExpire?: () => void;
}) {
  const router = useRouter();
  const end = new Date(expiresAt).getTime();
  const [remain, setRemain] = useState(() => end - Date.now());
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const tick = () => {
      const r = end - Date.now();
      setRemain(r);
      if (r <= 0 && !expired) {
        setExpired(true);
        onExpire?.();
        router.refresh();
      }
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [end, expired, onExpire, router]);

  const urgent = remain > 0 && remain < 60_000;

  if (expired || remain <= 0) {
    return (
      <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-center text-sm font-semibold text-red-300">
        Hết thời gian giữ ghế — đơn đã hết hạn. Vui lòng đặt lại.
      </div>
    );
  }

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 ${
        urgent
          ? "border-amber-500/50 bg-amber-500/10 text-amber-100"
          : "border-primary/40 bg-primary/10 text-foreground"
      }`}
      role="timer"
      aria-live="polite"
      aria-label={`${label}: ${formatRemain(remain)}`}
    >
      <div>
        <p className="text-xs font-medium uppercase tracking-wider opacity-80">
          {label}
        </p>
        <p className="text-xs opacity-70">
          Thanh toán trước khi hết giờ để không mất ghế
        </p>
      </div>
      <div
        className={`font-mono text-3xl font-black tabular-nums tracking-widest ${
          urgent ? "text-amber-300" : "text-primary"
        }`}
      >
        {formatRemain(remain)}
      </div>
    </div>
  );
}
