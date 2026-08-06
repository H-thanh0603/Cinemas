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
  const [progress, setProgress] = useState(0);
  const { data: session, status } = useSession();

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 12);
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (pathname.startsWith("/admin") || pathname.startsWith("/landing")) return null;

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-500 ease-out ${
        scrolled
          ? "border-b border-border/60 bg-background/85 shadow-lg shadow-black/30 backdrop-blur-2xl"
          : "border-b border-transparent bg-background/30 backdrop-blur-lg"
      }`}
    >
      {/* Top info bar */}
      <div className="hidden border-b border-border/30 bg-surface/30 lg:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-2 text-xs text-muted">
          <div className="flex items-center gap-6">
            <span className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground">
              <Phone className="h-3 w-3 text-primary-light" /> Hotline: 1900 0000
            </span>
            <span className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground">
              <Mail className="h-3 w-3 text-primary-light" /> hotro@cinestar.vn
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3 w-3 text-primary-light" /> 8:00 — 22:00 hằng ngày
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

      {/* Main nav */}
      <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-3" onClick={() => setOpen(false)}>
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-dark text-xl font-black text-on-primary shadow-lg shadow-primary/25 transition-all duration-300 group-hover:shadow-primary/40 group-hover:scale-105">
            C
          </span>
          <span className="font-display text-xl font-extrabold tracking-tight">
            Cine<span className="text-primary">Star</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
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
                className={`relative flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-300 ${
                  active
                    ? "text-primary bg-primary/8"
                    : "text-muted hover:bg-surface-hover/60 hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4 opacity-70" />
                {link.label}
                {active && (
                  <span className="absolute bottom-1 left-1/2 h-0.5 w-7 -translate-x-1/2 rounded-full bg-gradient-to-r from-primary to-primary-light shadow-[0_0_10px_rgba(0,255,135,0.5)]" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {status === "authenticated" && session?.user ? (
            <div className="hidden items-center gap-2.5 sm:flex">
              <span className="max-w-[130px] truncate text-sm text-muted">
                {session.user.name || session.user.email}
              </span>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3.5 py-2 text-xs font-semibold text-muted transition-all duration-300 hover:border-primary/40 hover:bg-surface hover:text-foreground"
              >
                <LogOut className="h-3.5 w-3.5" />
                Đăng xuất
              </button>
            </div>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium text-muted transition-all duration-300 hover:text-foreground hover:bg-surface-hover/40"
              >
                <LogIn className="h-4 w-4" />
                Đăng nhập
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3.5 py-2 text-sm font-semibold transition-all duration-300 hover:border-primary/40 hover:bg-surface hover:text-foreground"
              >
                <UserPlus className="h-4 w-4" />
                Đăng ký
              </Link>
            </div>
          )}
          <Link
            href="/movies?status=NOW_SHOWING"
            className="btn-sheen hidden items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-dark px-5 py-2.5 text-sm font-bold text-on-primary shadow-lg shadow-primary/20 transition-all duration-300 hover:shadow-primary/35 hover:scale-[1.02] sm:inline-flex"
          >
            <Ticket className="h-4 w-4" />
            Đặt vé
          </Link>
          <button
            className="flex h-10 w-10 items-center justify-center rounded-xl text-muted transition-all duration-300 hover:bg-surface-hover/60 hover:text-foreground md:hidden"
            onClick={() => setOpen(!open)}
            aria-label={open ? "Đóng menu" : "Mở menu"}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <nav className="animate-fade-in-up border-t border-border/50 bg-surface/95 backdrop-blur-2xl md:hidden">
          <div className="px-4 py-3">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium text-muted transition-all duration-300 hover:bg-surface-hover/60 hover:text-foreground"
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
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium text-muted transition-all duration-300 hover:bg-surface-hover/60"
              >
                <LogOut className="h-4 w-4" />
                Đăng xuất
              </button>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium text-muted transition-all duration-300 hover:bg-surface-hover/60 hover:text-foreground"
                >
                  <LogIn className="h-4 w-4" />
                  Đăng nhập
                </Link>
                <Link
                  href="/register"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium text-muted transition-all duration-300 hover:bg-surface-hover/60 hover:text-foreground"
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
                className="flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium text-muted transition-all duration-300 hover:bg-surface-hover/60 hover:text-foreground"
              >
                <Settings className="h-4 w-4" />
                Quản trị
              </Link>
            )}
            <Link
              href="/movies?status=NOW_SHOWING"
              onClick={() => setOpen(false)}
              className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-dark px-4 py-3.5 text-center text-sm font-bold text-on-primary shadow-lg shadow-primary/20"
            >
              <Ticket className="h-4 w-4" />
              Đặt vé ngay
            </Link>
          </div>
        </nav>
      )}

      {/* Scroll progress (gold → rose, mỏng dưới header) */}
      <div className="absolute inset-x-0 bottom-0 h-[2px] -translate-y-px bg-transparent">
        <div
          className="h-full bg-gradient-to-r from-accent via-primary to-primary-jewel shadow-[0_0_8px_rgba(0,255,135,0.5)] transition-[width] duration-100 ease-out"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </header>
  );
}
