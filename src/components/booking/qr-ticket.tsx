"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Sparkles, RotateCw, Ticket, Clock } from "lucide-react";

export function QrTicket({ code, startsAt }: { code: string; startsAt?: string | Date }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    let cancelled = false;
    const payload = JSON.stringify({
      type: "cinestar-ticket",
      code,
      v: 1,
    });
    QRCode.toDataURL(payload, {
      width: 200,
      margin: 1,
      color: { dark: "#0b0c10", light: "#ffffff" },
      errorCorrectionLevel: "M",
    })
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch(console.error);
    return () => {
      cancelled = true;
    };
  }, [code]);

  // Live countdown timer to showtime
  useEffect(() => {
    if (!startsAt) return;
    const targetDate = new Date(startsAt).getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const diff = targetDate - now;

      if (diff <= 0) {
        setTimeLeft("Đang hoặc đã chiếu");
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(`${hours > 0 ? `${hours}h ` : ""}${mins}m ${secs}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [startsAt]);

  return (
    <div className="flex flex-col items-center">
      {/* 🎟️ 3D Metallic Flip Ticket Container */}
      <div
        onClick={() => setIsFlipped(!isFlipped)}
        className="perspective-1000 group cursor-pointer w-full max-w-sm"
        title="Nhấn để xoay xem mã QR hoặc thông tin vé"
      >
        <div
          className={`relative h-64 w-full rounded-3xl transition-transform duration-700 transform-style-3d ${
            isFlipped ? "rotate-y-180" : ""
          }`}
        >
          {/* FRONT SIDE - Metallic VIP Pass */}
          <div className="absolute inset-0 backface-hidden rounded-3xl border border-amber-400/50 bg-gradient-to-br from-amber-500/20 via-surface to-primary/20 p-6 shadow-2xl flex flex-col justify-between overflow-hidden">
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-accent/20 blur-2xl pointer-events-none" />
            <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-primary/30 blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <Ticket className="h-5 w-5 text-accent" />
                <span className="font-black text-xs uppercase tracking-widest text-accent">VÉ VIP ĐIỆN ẢNH</span>
              </div>
              <span className="rounded-full bg-accent/20 px-3 py-0.5 text-[11px] font-bold text-accent">
                3D METALLIC
              </span>
            </div>

            <div className="my-2">
              <span className="block text-[11px] uppercase tracking-wider text-muted font-bold">Mã xác nhận (BOOKING ID)</span>
              <span className="font-mono text-2xl font-black tracking-widest text-foreground drop-shadow">
                {code}
              </span>
              
              {timeLeft && (
                <div className="mt-3 flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs text-primary font-bold">
                  <Clock className="h-3.5 w-3.5 animate-spin text-primary" />
                  Đếm ngược: {timeLeft}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border/60 text-xs text-muted">
              <span className="flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-accent" /> Chạm để quét mã QR
              </span>
              <span className="flex items-center gap-1 font-semibold text-foreground">
                <RotateCw className="h-3.5 w-3.5 text-accent" /> Xoay thẻ 3D
              </span>
            </div>
          </div>

          {/* BACK SIDE - QR Code Display */}
          <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-3xl border border-primary/50 bg-gradient-to-br from-surface-raised via-surface to-background p-6 shadow-2xl flex flex-col items-center justify-center text-center">
            <div className="flex h-36 w-36 items-center justify-center rounded-2xl border-4 border-accent bg-white p-2 shadow-xl">
              {dataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={dataUrl} alt={`QR mã vé ${code}`} className="h-full w-full" />
              ) : (
                <div className="h-full w-full animate-pulse rounded-lg bg-gray-200" />
              )}
            </div>

            <p className="mt-3 font-mono text-sm font-black tracking-widest text-accent">
              {code}
            </p>
            <p className="mt-1 text-xs text-muted">
              Quét mã tại cổng soát vé rạp phim
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
