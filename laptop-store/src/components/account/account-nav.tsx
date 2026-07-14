"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const links = [
  { href: "/account", label: "Tổng quan" },
  { href: "/account/orders", label: "Đơn hàng" },
];

export function AccountNav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1 rounded-2xl border border-white/5 bg-surface-900/60 p-3">
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={cn(
            "rounded-lg px-3 py-2 text-sm",
            pathname === l.href
              ? "bg-brand-600/20 text-brand-300"
              : "text-surface-300 hover:bg-white/5"
          )}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
