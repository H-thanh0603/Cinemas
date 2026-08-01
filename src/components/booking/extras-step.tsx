"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { SEAT_TYPE_LABELS, formatVnd } from "@/lib/constants";
import { seatBasePrice } from "@/lib/booking";
import { PosterImage } from "@/components/ui/poster-image";
import type { ComboDto, SeatDto, TicketTypeDto } from "./types";
import { Popcorn, Ticket, Sparkles, Plus, Minus, Check } from "lucide-react";

type ExtrasStepProps = {
  basePrice: number;
  selectedSeats: SeatDto[];
  ticketTypes: TicketTypeDto[];
  ticketAssignments: Record<string, string>;
  onAssignTicket: (seatId: string, ticketTypeId: string) => void;
  combos: ComboDto[];
  comboQuantities: Record<string, number>;
  onComboChange: (comboId: string, quantity: number) => void;
};

const categoryLabels: Record<string, string> = {
  COMBO: "🍿 Combo Tiết Kiệm",
  POPCORN: "🍿 Bắp Rang Bơ",
  DRINK: "🥤 Nước Uống Giải Khát",
  SNACK: "🍪 Mon Ăn Vặt",
};

type Particle = {
  id: string;
  emoji: string;
  startX: number;
  startY: number;
  deltaX: number;
  deltaY: number;
  offsetX: number;
  delayMs: number;
};

export function ExtrasStep({
  basePrice,
  selectedSeats,
  ticketTypes,
  ticketAssignments,
  onAssignTicket,
  combos,
  comboQuantities,
  onComboChange,
}: ExtrasStepProps) {
  const categories = [...new Set(combos.map((c) => c.category))];
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [popcornFlavors, setPopcornFlavors] = useState<Record<string, string>>({});
  const [flavorModalComboId, setFlavorModalComboId] = useState<string | null>(null);
  const [flyingParticles, setFlyingParticles] = useState<Particle[]>([]);

  const filteredCategories = selectedCategory === "ALL" ? categories : categories.filter(c => c === selectedCategory);

  function spawnFlyParticle(mainEmoji: string, e: React.MouseEvent<HTMLButtonElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const startX = rect.left + rect.width / 2;
    const startY = rect.top + rect.height / 2;
    const targetX = window.innerWidth / 2;
    const targetY = window.innerHeight - 70;

    const particleStream = [
      { emoji: mainEmoji, offsetX: -35, delayMs: 0 },
      { emoji: "✨", offsetX: 0, delayMs: 60 },
      { emoji: mainEmoji, offsetX: 35, delayMs: 120 },
    ];

    const newParticles: Particle[] = particleStream.map((item) => ({
      id: Math.random().toString(),
      emoji: item.emoji,
      startX,
      startY,
      deltaX: targetX - startX,
      deltaY: targetY - startY,
      offsetX: item.offsetX,
      delayMs: item.delayMs,
    }));

    setFlyingParticles((prev) => [...prev, ...newParticles]);
  }

  const flavorOptions = ["50% Phô mai 🧀 + 50% Caramel 🍯", "50% Bơ Tỏi 🧄 + 50% Phô mai 🧀", "100% Phô mai 🧀", "100% Caramel 🍯"];

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="space-y-10">
      {/* 🎟️ Ticket Types Section */}
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <Ticket className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold tracking-tight">Loại vé cho từng ghế</h2>
        </div>
        <p className="text-xs text-muted">
          Chọn loại vé phù hợp cho mỗi ghế (Vé Học sinh/Sinh viên & Trẻ em cần xuất trình giấy tờ khi vào rạp)
        </p>

        <div className="mt-5 space-y-4">
          {selectedSeats.map((seat) => {
            const assigned = ticketAssignments[seat.id];
            return (
              <div
                key={seat.id}
                className="rounded-2xl border border-border/80 bg-surface-raised/60 p-4 sm:p-5 shadow-sm transition-all hover:border-border"
              >
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 font-black text-xs text-primary">
                      {seat.row}
                    </span>
                    <span className="font-extrabold text-sm sm:text-base">
                      Ghế {seat.row}{seat.number}
                    </span>
                    <span className="rounded-md border border-border-light bg-surface px-2 py-0.5 text-xs text-muted font-medium">
                      {SEAT_TYPE_LABELS[seat.type]}
                    </span>
                  </div>
                  <div className="text-xs text-muted">
                    Giá ghế gốc: <strong className="text-foreground">{formatVnd(seatBasePrice(basePrice, seat.type))}</strong>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {ticketTypes.map((tt) => {
                    const price = Math.max(
                      0,
                      seatBasePrice(basePrice, seat.type) + tt.priceModifier
                    );
                    const active = assigned === tt.id;
                    return (
                      <button
                        key={tt.id}
                        type="button"
                        onClick={(e) => {
                          spawnFlyParticle("🎟️", e);
                          onAssignTicket(seat.id, tt.id);
                        }}
                        className={`relative flex flex-col justify-between rounded-xl border p-3.5 text-left min-h-[52px] transition-all ${
                          active
                            ? "border-primary bg-primary/10 text-foreground ring-2 ring-primary/40 shadow-md"
                            : "border-border/70 bg-surface/80 text-muted hover:border-border-light hover:bg-surface-hover hover:text-foreground"
                        }`}
                      >
                        {active && (
                          <span className="absolute top-2.5 right-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-white">
                            <Check className="h-3 w-3 stroke-[3]" />
                          </span>
                        )}
                        <div>
                          <span className="block font-bold text-xs sm:text-sm text-foreground pr-5">{tt.name}</span>
                          <span className="block text-[11px] text-muted line-clamp-1 mt-0.5">
                            {tt.code === "ADULT" ? "Vé người lớn tiêu chuẩn" : "Ưu đãi theo quy định"}
                          </span>
                        </div>
                        <span className="mt-2 block font-extrabold text-sm text-accent">
                          {formatVnd(price)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 🍿 Combos & Refreshments Section */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2.5">
            <Popcorn className="h-5 w-5 text-accent" />
            <h2 className="text-xl font-bold tracking-tight">Bắp nước & Combo ưu đãi</h2>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-bold text-accent">
            <Sparkles className="h-3 w-3" /> Nhận ngay không xếp hàng
          </span>
        </div>
        <p className="text-xs text-muted">
          Thêm bắp rang bơ giòn rụm & nước uống mát lạnh vào đơn hàng với giá ưu đãi đặc quyền khi đặt trước online
        </p>

        {/* 🧠 Hick's & Miller's Law: Chunking Category Tabs (4-5 items max) */}
        <div className="mt-4 flex flex-wrap items-center gap-2 border-b border-border/40 pb-3">
          <button
            type="button"
            onClick={() => setSelectedCategory("ALL")}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
              selectedCategory === "ALL"
                ? "bg-accent text-black shadow-lg shadow-accent/20"
                : "bg-surface-raised border border-border text-muted hover:text-foreground hover:bg-surface-hover"
            }`}
          >
            🍿 Tất cả dịch vụ
          </button>

          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                selectedCategory === cat
                  ? "bg-accent text-black shadow-lg shadow-accent/20"
                  : "bg-surface-raised border border-border text-muted hover:text-foreground hover:bg-surface-hover"
              }`}
            >
              {categoryLabels[cat] ?? cat}
            </button>
          ))}
        </div>

        {/* 👥 Smart Group Bundle Banner */}
        {selectedSeats.length >= 3 && (
          <div className="mt-4 flex items-center justify-between rounded-2xl border border-primary/40 bg-primary/10 p-3.5 text-xs text-foreground shadow-md animate-fade-in">
            <div className="flex items-center gap-2.5">
              <span className="text-lg">🎉</span>
              <div>
                <strong className="text-primary font-bold">Gợi ý cho Nhóm {selectedSeats.length} người:</strong> Bạn đang chọn {selectedSeats.length} ghế! Chọn Combo Bắp Nước Nhóm bên dưới để tiết kiệm đến 25%.
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 space-y-8">
          {filteredCategories.map((cat) => (
            <div key={cat} className="space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-accent border-b border-border/40 pb-2">
                {categoryLabels[cat] ?? cat}
              </h3>

              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                {combos
                  .filter((c) => c.category === cat)
                  .map((combo) => {
                    const qty = comboQuantities[combo.id] ?? 0;
                    return (
                      <div
                        key={combo.id}
                        className={`flex items-start gap-3 sm:gap-4 rounded-2xl border p-3.5 sm:p-4 transition-all ${
                          qty > 0
                            ? "border-accent/60 bg-accent/5 ring-1 ring-accent/30 shadow-lg shadow-accent/5"
                            : "border-border/80 bg-surface-raised/70 hover:border-border-light"
                        }`}
                      >
                        <div className="relative h-16 w-16 sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-xl border border-border-light/60 bg-surface shadow-sm">
                          <PosterImage
                            src={combo.imageUrl || "/images/combo-placeholder.png"}
                            alt={combo.name}
                            fill
                            sizes="80px"
                            quality={90}
                          />
                        </div>

                        <div className="flex min-w-0 flex-1 flex-col justify-between self-stretch">
                          <div>
                            <span className="font-bold text-xs sm:text-sm text-foreground line-clamp-1">
                              {combo.name}
                            </span>
                            <span className="mt-0.5 line-clamp-2 text-[11px] sm:text-xs text-muted leading-snug">
                              {combo.description}
                            </span>
                          </div>

                          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/40">
                            <span className="text-xs sm:text-sm font-extrabold text-accent shrink-0">
                              {formatVnd(combo.price)}
                            </span>

                            {/* 🎯 Fitts's Law: Quantity Counter Buttons - Minimum 44x44px Touch Targets */}
                            <div className="flex items-center gap-1 shrink-0 rounded-xl border border-border bg-surface p-1 shadow-inner">
                              <button
                                type="button"
                                onClick={() =>
                                  onComboChange(combo.id, Math.max(0, qty - 1))
                                }
                                disabled={qty === 0}
                                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-border/60 bg-surface-raised text-muted transition-all hover:bg-surface-hover hover:text-foreground disabled:opacity-30 disabled:hover:bg-surface-raised"
                                aria-label={`Giảm số lượng ${combo.name}`}
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                              <span className="w-6 text-center text-xs font-black text-foreground">
                                {qty}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  spawnFlyParticle("🍿", e);
                                  onComboChange(combo.id, Math.min(10, qty + 1));
                                }}
                                disabled={qty >= 10}
                                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg bg-primary text-white font-bold transition-all hover:bg-primary-hover shadow-sm disabled:opacity-30"
                                aria-label={`Tăng số lượng ${combo.name}`}
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 🍿 Fly-to-Cart Particle Stream Animation Overlay Mounted directly on Body (z-[9999]) */}
      {mounted &&
        createPortal(
          <div className="pointer-events-none fixed inset-0 z-[9999] overflow-visible">
            {flyingParticles.map((p) => (
              <div
                key={p.id}
                className="fixed pointer-events-none text-4xl animate-fly-particle drop-shadow-[0_0_25px_rgba(255,193,7,1)]"
                style={{
                  left: `${p.startX}px`,
                  top: `${p.startY}px`,
                  animationDelay: `${p.delayMs}ms`,
                  "--delta-x": `${p.deltaX}px`,
                  "--delta-y": `${p.deltaY}px`,
                  "--offset-x": `${p.offsetX}px`,
                } as React.CSSProperties}
                onAnimationEnd={() => {
                  setFlyingParticles((prev) =>
                    prev.filter((item) => item.id !== p.id)
                  );
                }}
              >
                {p.emoji}
              </div>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
}
