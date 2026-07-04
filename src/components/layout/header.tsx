"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navLinks = [
  { href: "/", label: "Trang chủ", icon: "🏠" },
  { href: "/movies", label: "Phim", icon: "🎬" },
  { href: "/cinemas", label: "Rạp", icon: "🏢" },
  { href: "/promotions", label: "Ưu đãi", icon: "🎁" },
  { href: "/bookings", label: "Vé của tôi", icon: "🎫" },
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  if (pathname.startsWith("/admin") || pathname.startsWith("/landing")) return null;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      {/* Top bar */}
      <div className="hidden border-b border-border/50 bg-surface/30 lg:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-1.5 text-xs text-muted">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="text-accent">📞</span> Hotline: 1900 0000
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-accent">✉</span> hotro@cinestar.vn
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="text-accent">🕐</span> 8:00 — 22:00 hằng ngày
            </span>
            <Link href="/admin" className="text-muted transition-colors hover:text-primary">
              Quản trị
            </Link>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-xl font-black text-white shadow-lg shadow-primary/20 transition-transform hover:scale-105">
            C
          </span>
          <span className="text-xl font-extrabold tracking-tight">
            Cine<span className="text-primary">Star</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "text-primary"
                    : "text-muted hover:bg-surface hover:text-foreground"
                }`}
              >
                {link.label}
                {active && (
                  <span className="absolute bottom-0 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/movies?status=NOW_SHOWING"
            className="hidden rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary-hover hover:shadow-primary/30 sm:block"
          >
            🎫 Đặt vé ngay
          </Link>
          <button
            className="flex h-10 w-10 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface hover:text-foreground md:hidden"
            onClick={() => setOpen(!open)}
            aria-label="Mở menu"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              {open ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <nav className="border-t border-border bg-surface px-4 py-3 md:hidden">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-muted transition-colors hover:bg-surface-raised hover:text-foreground"
            >
              <span>{link.icon}</span>
              {link.label}
            </Link>
          ))}
          <Link
            href="/admin"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-muted transition-colors hover:bg-surface-raised hover:text-foreground"
          >
            <span>⚙</span>
            Quản trị
          </Link>
          <Link
            href="/movies?status=NOW_SHOWING"
            onClick={() => setOpen(false)}
            className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-center text-sm font-bold text-white"
          >
            🎫 Đặt vé ngay
          </Link>
        </nav>
      )}
    </header>
  );
}
