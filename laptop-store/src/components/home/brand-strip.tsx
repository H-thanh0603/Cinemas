import { brands } from "@/data";
import Link from "next/link";

export function BrandStrip() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {brands.map((b) => (
        <Link
          key={b.id}
          href={`/products?brand=${b.id}`}
          className="rounded-xl border border-white/5 bg-surface-900/80 px-5 py-3 text-sm font-medium text-surface-300 transition hover:border-brand-500/40 hover:text-white"
        >
          {b.name}
        </Link>
      ))}
    </div>
  );
}
