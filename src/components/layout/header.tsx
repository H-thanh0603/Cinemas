"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navLinks = [
  { href: "/", label: "Trang chủ" },
  { href: "/movies", label: "Phim" },
  { href: "/cinemas", label: "Rạp" },
  { href: "/promotions", label: "Ưu đãi" },
  { href: "/bookings", label: "Vé của tôi" },
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  if (pathname.startsWith("/admin")) return null;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-lg font-black text-white">
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
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-surface-raised text-foreground"
                    : "text-muted hover:bg-surface hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="hidden rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface hover:text-foreground lg:block"
          >
            Quản trị
          </Link>
          <Link
            href="/movies?status=NOW_SHOWING"
            className="hidden rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover sm:block"
          >
            Đặt vé ngay
          </Link>
          <button
            className="flex h-10 w-10 items-center justify-center rounded-lg text-muted hover:bg-surface hover:text-foreground md:hidden"
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

      {open && (
        <nav className="border-t border-border bg-surface px-4 py-3 md:hidden">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-4 py-3 text-sm font-medium text-muted hover:bg-surface-raised hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/admin"
            onClick={() => setOpen(false)}
            className="block rounded-lg px-4 py-3 text-sm font-medium text-muted hover:bg-surface-raised hover:text-foreground"
          >
            Quản trị
          </Link>
          <Link
            href="/movies?status=NOW_SHOWING"
            onClick={() => setOpen(false)}
            className="mt-2 block rounded-lg bg-primary px-4 py-3 text-center text-sm font-semibold text-white"
          >
            Đặt vé ngay
          </Link>
        </nav>
      )}
    </header>
  );
}
