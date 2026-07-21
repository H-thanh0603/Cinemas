"use client";

import Link from "next/link";
import { Ticket, Sparkles } from "lucide-react";

const items = [
  "Đặt vé online — nhận mã QR ngay",
  "Ưu đãi WELCOME10 cho đơn từ 200.000đ",
  "Suất chiếu sớm dành cho hội viên",
  "Thanh toán tại quầy · giữ ghế 8 phút",
  "Hệ thống rạp toàn quốc · trải nghiệm 2D · 3D · IMAX",
];

export function PromoTicker() {
  const line = [...items, ...items];
  return (
    <div className="relative z-[60] overflow-hidden border-b border-primary/30 bg-gradient-to-r from-primary via-primary-dark to-primary text-white">
      <div className="absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-primary to-transparent" />
      <div className="absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-primary to-transparent" />
      <div className="flex animate-ticker whitespace-nowrap py-2 text-xs font-semibold tracking-wide sm:text-sm">
        {line.map((t, i) => (
          <span key={i} className="mx-6 inline-flex items-center gap-2">
            {i % 2 === 0 ? (
              <Ticket className="h-3.5 w-3.5 shrink-0 opacity-90" />
            ) : (
              <Sparkles className="h-3.5 w-3.5 shrink-0 text-accent" />
            )}
            {t}
            <span className="text-white/40">•</span>
          </span>
        ))}
      </div>
      <Link
        href="/promotions"
        className="absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/30 px-3 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur hover:bg-black/50 sm:right-6"
      >
        Ưu đãi
      </Link>
    </div>
  );
}
