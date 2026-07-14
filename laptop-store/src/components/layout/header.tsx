"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/context/cart-context";
import { useAuth } from "@/context/auth-context";
import { useCompare } from "@/context/compare-context";
import { SearchBar } from "./search-bar";
import { cn } from "@/lib/cn";

const nav = [
  { href: "/products", label: "Sản phẩm" },
  { href: "/compare", label: "So sánh" },
  { href: "/blog", label: "Blog" },
];

export function Header() {
  const { count } = useCart();
  const { ids } = useCompare();
  const { isLoggedIn, hydrated } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-surface-950/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 lg:px-6">
        <Link href="/" className="shrink-0 font-bold tracking-tight">
          <span className="text-xl text-white">Tech</span>
          <span className="text-xl text-brand-400">Zone</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm text-surface-300 transition hover:bg-white/5 hover:text-white"
            >
              {item.label}
              {item.href === "/compare" && ids.length > 0 && (
                <span className="ml-1 text-xs text-brand-400">
                  ({ids.length})
                </span>
              )}
            </Link>
          ))}
        </nav>

        <div className="hidden flex-1 md:block md:max-w-md lg:max-w-lg">
          <SearchBar />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href={hydrated && isLoggedIn ? "/account" : "/login"}
            className="hidden rounded-lg px-3 py-2 text-sm text-surface-300 hover:bg-white/5 hover:text-white sm:inline"
          >
            {hydrated && isLoggedIn ? "Tài khoản" : "Đăng nhập"}
          </Link>
          <Link
            href="/cart"
            className="relative rounded-lg border border-white/10 bg-surface-900 px-3 py-2 text-sm text-surface-100 hover:border-brand-500/40"
          >
            Giỏ
            {count > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-[11px] font-semibold text-white">
                {count}
              </span>
            )}
          </Link>
          <button
            type="button"
            className="rounded-lg border border-white/10 p-2 text-surface-300 md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            <span className="block h-0.5 w-5 bg-current mb-1" />
            <span className="block h-0.5 w-5 bg-current mb-1" />
            <span className="block h-0.5 w-5 bg-current" />
          </button>
        </div>
      </div>

      <div
        className={cn(
          "border-t border-white/5 px-4 py-3 md:hidden",
          !open && "hidden"
        )}
      >
        <SearchBar className="mb-3" />
        <div className="flex flex-col gap-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2 text-sm text-surface-200 hover:bg-white/5"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href={hydrated && isLoggedIn ? "/account" : "/login"}
            onClick={() => setOpen(false)}
            className="rounded-lg px-3 py-2 text-sm text-surface-200 hover:bg-white/5"
          >
            {hydrated && isLoggedIn ? "Tài khoản" : "Đăng nhập"}
          </Link>
        </div>
      </div>
    </header>
  );
}
