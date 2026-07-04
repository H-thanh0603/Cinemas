"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type NavItem = { href: string; label: string; icon: string };

export function AdminSidebar({ navItems }: { navItems: NavItem[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed left-4 top-3 z-50 flex items-center gap-2 rounded-lg border border-border bg-surface-raised px-3 py-1.5 text-sm font-semibold shadow-lg lg:hidden"
        aria-label="Toggle sidebar"
      >
        {open ? "✕" : "☰"}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-40 h-full w-64 transform border-r border-border bg-surface-raised/95 backdrop-blur-xl transition-transform duration-300 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo header */}
        <div className="flex h-16 items-center gap-2 border-b border-border px-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-lg font-black text-white shadow-lg shadow-primary/20">
            C
          </span>
          <span className="text-lg font-extrabold tracking-tight">
            Cine<span className="text-primary">Star</span>
          </span>
          <span className="ml-auto rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
            Admin
          </span>
        </div>

        {/* Nav items */}
        <nav className="flex flex-col gap-1 p-3">
          <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-dark">
            Quản lý
          </div>
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted hover:bg-surface hover:text-foreground"
                }`}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary" />
                )}
                <span className={`text-base transition-transform ${active ? "scale-110" : "group-hover:scale-110"}`}>
                  {item.icon}
                </span>
                {item.label}
                {active && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom link */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-border p-3">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-surface hover:text-foreground"
          >
            <span className="text-base">🌐</span>
            Về trang web
          </Link>
        </div>
      </aside>

      {/* Spacer on desktop */}
      <div className="hidden w-64 shrink-0 lg:block" />
    </>
  );
}
