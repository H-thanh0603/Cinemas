"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type StatsData = Record<string, unknown>;

type StatCard = {
  key: string;
  subKey?: string;
  label: string;
  subLabel: string;
  icon: string;
  href: string;
  color: string;
  iconBg: string;
};

function useCountUp(target: number, duration = 800) {
  const [value, setValue] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);

  return value;
}

function StatCardItem({ card, stats }: { card: StatCard; stats: StatsData }) {
  const target = Number(stats[card.key] ?? 0);
  const animated = useCountUp(target);
  const subValue = card.subKey ? Number(stats[card.subKey] ?? 0) : null;

  return (
    <Link
      href={card.href}
      className={`group relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br ${card.color} p-5 transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5`}
    >
      <div className="flex items-start justify-between">
        <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.iconBg} text-xl transition-transform group-hover:scale-110`}>
          {card.icon}
        </span>
      </div>
      <div className="mt-3 text-2xl font-extrabold tabular-nums sm:text-3xl">
        {animated}
      </div>
      <div className="text-xs font-medium text-muted">{card.label}</div>
      {subValue !== null && (
        <div className="mt-1 text-[10px] text-muted-dark">
          {subValue} {card.subLabel}
        </div>
      )}
    </Link>
  );
}

export function AnimatedStats({
  cards,
  stats,
}: {
  cards: readonly StatCard[];
  stats: StatsData;
}) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((card) => (
        <StatCardItem key={card.key} card={card} stats={stats} />
      ))}
    </div>
  );
}
