"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import {
  Film,
  Building2,
  Gift,
  Ticket,
  Home,
  Menu,
  X,
  LogIn,
  LogOut,
  UserPlus,
  Settings,
  Phone,
  Mail,
  Clock,
} from "lucide-react";

const navLinks = [
  { href: "/", label: "Trang chủ", icon: Home },
  { href: "/movies", label: "Phim", icon: Film },
  { href: "/cinemas", label: "Rạp", icon: Building2 },
  { href: "/promotions", label: "Ưu đãi", icon: Gift },
  { href: "/bookings", label: "Vé của tôi", icon: Ticket },
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { data: session, status } = useSession();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (pathname.startsWith("/admin") || pathname.startsWith("/landing")) return null;

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-border/80 bg-background/90 shadow-lg shadow-black/40 backdrop-blur-xl"
          : "border-b border-transparent bg-background/40 backdrop-blur-md"
      }`}
    >
      <div className="hidden border-b border-border/40 bg-surface/40 lg:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-1.5 text-xs text-muted">
          <div className="flex items-center gap-5">
            <span className="inline-flex items-center gap-1.5">
              <Phone className="h-3 w-3 text-accent" /> Hotline: 1900 0000
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Mail className="h-3 w-3 text-accent" /> hotro@cinestar.vn
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3 w-3 text-accent" /> 8:00 — 22:00 hằng ngày
            </span>
            {session?.user?.role === "ADMIN" && (
              <Link
                href="/admin"
                className="inline-flex items-center gap-1 text-muted transition-colors hover:text-primary"
              >
                <Settings className="h-3 w-3" />
                Quản trị
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-xl font-black text-white shadow-lg shadow-primary/30 transition-transform group-hover:scale-105 group-hover:shadow-primary/45">
            C
          </span>
          <span className="font-display text-xl font-extrabold tracking-tight">
            Cine<span className="text-primary">Star</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-0.5 md:flex">
          {navLinks.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "text-primary"
                    : "text-muted hover:bg-surface hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4 opacity-80" />
                {link.label}
                {active && (
                  <span className="absolute bottom-0.5 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-primary shadow-[0_0_8px_rgba(229,9,20,0.8)]" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {status === "authenticated" && session?.user ? (
            <div className="hidden items-center gap-2 sm:flex">
              <span className="max-w-[130px] truncate text-sm text-muted">
                {session.user.name || session.user.email}
              </span>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs font-semibold text-muted transition hover:border-primary/40 hover:bg-surface hover:text-foreground"
              >
                <LogOut className="h-3.5 w-3.5" />
                Đăng xuất
              </button>
            </div>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium text-muted hover:text-foreground"
              >
                <LogIn className="h-4 w-4" />
                Đăng nhập
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-sm font-semibold transition hover:border-primary/40 hover:bg-surface"
              >
                <UserPlus className="h-4 w-4" />
                Đăng ký
              </Link>
            </div>
          )}
          <Link
            href="/movies?status=NOW_SHOWING"
            className="hidden items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/25 transition hover:bg-primary-hover hover:shadow-primary/40 sm:inline-flex"
          >
            <Ticket className="h-4 w-4" />
            Đặt vé
          </Link>
          <button
            className="flex h-10 w-10 items-center justify-center rounded-xl text-muted transition hover:bg-surface hover:text-foreground md:hidden"
            onClick={() => setOpen(!open)}
            aria-label={open ? "Đóng menu" : "Mở menu"}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="animate-fade-in-up border-t border-border bg-surface/95 px-4 py-3 backdrop-blur-xl md:hidden">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-muted transition hover:bg-surface-raised hover:text-foreground"
              >
                <Icon className="h-4 w-4 text-primary" />
                {link.label}
              </Link>
            );
          })}
          {status === "authenticated" ? (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                void signOut({ callbackUrl: "/" });
              }}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-muted hover:bg-surface-raised"
            >
              <LogOut className="h-4 w-4" />
              Đăng xuất
            </button>
          ) : (
            <>
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-muted hover:bg-surface-raised"
              >
                <LogIn className="h-4 w-4" />
                Đăng nhập
              </Link>
              <Link
                href="/register"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-muted hover:bg-surface-raised"
              >
                <UserPlus className="h-4 w-4" />
                Đăng ký
              </Link>
            </>
          )}
          {session?.user?.role === "ADMIN" && (
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-muted hover:bg-surface-raised"
            >
              <Settings className="h-4 w-4" />
              Quản trị
            </Link>
          )}
          <Link
            href="/movies?status=NOW_SHOWING"
            onClick={() => setOpen(false)}
            className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-center text-sm font-bold text-white"
          >
            <Ticket className="h-4 w-4" />
            Đặt vé ngay
          </Link>
        </nav>
      )}
    </header>
  );
}
