"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/cn";

export function ProductGallery({
  images,
  name,
}: {
  images: string[];
  name: string;
}) {
  const [active, setActive] = useState(0);
  const list = images.length ? images : [];

  return (
    <div>
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/5 bg-surface-900">
        {list[active] ? (
          <Image
            src={list[active]}
            alt={name}
            fill
            className="object-cover"
            sizes="(max-width:1024px) 100vw, 50vw"
            priority
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-brand-900/30 to-surface-950 text-surface-500">
            TechZone
          </div>
        )}
      </div>
      {list.length > 1 && (
        <div className="mt-3 flex gap-2">
          {list.map((src, i) => (
            <button
              key={src + i}
              type="button"
              onClick={() => setActive(i)}
              className={cn(
                "relative h-16 w-20 overflow-hidden rounded-lg border",
                i === active ? "border-brand-500" : "border-white/10"
              )}
            >
              <Image src={src} alt="" fill className="object-cover" sizes="80px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
