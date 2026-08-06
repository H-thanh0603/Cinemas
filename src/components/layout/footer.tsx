"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Phone, Mail, MapPin, Share2, Heart } from "lucide-react";

export function Footer() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin") || pathname.startsWith("/landing")) return null;

  return (
    <footer className="relative overflow-hidden border-t border-border/40 bg-surface">
      {/* Top gradient line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      {/* Ambient glow */}
      <div className="absolute -left-32 bottom-0 h-72 w-72 rounded-full bg-primary/4 blur-[120px]" />
      <div className="absolute -right-32 top-0 h-72 w-72 rounded-full bg-accent/3 blur-[120px]" />

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-dark text-lg font-black text-on-primary shadow-lg shadow-primary/20">
                C
              </span>
              <span className="font-display text-xl font-extrabold">
                Cine<span className="text-primary">Star</span>
              </span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              Hệ thống rạp chiếu phim hiện đại — đặt vé online, QR check-in, ưu
              đãi mỗi tuần.
            </p>
            <div className="mt-6 flex items-center gap-2.5">
              {["Facebook", "Instagram", "YouTube"].map((label) => (
                <a
                  key={label}
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 bg-surface-raised/50 text-muted transition-all duration-300 hover:border-primary/30 hover:bg-primary/8 hover:text-primary"
                  aria-label={label}
                >
                  <Share2 className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Explore */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground/80">Khám phá</h3>
            <ul className="mt-5 space-y-3 text-sm">
              {[
                { href: "/movies?status=NOW_SHOWING", label: "Phim đang chiếu" },
                { href: "/movies?status=COMING_SOON", label: "Phim sắp chiếu" },
                { href: "/cinemas", label: "Hệ thống rạp" },
                { href: "/promotions", label: "Khuyến mãi" },
              ].map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-muted transition-colors duration-300 hover:text-primary"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground/80">Hỗ trợ</h3>
            <ul className="mt-5 space-y-3 text-sm text-muted">
              <li>
                <Link href="/bookings" className="transition-colors duration-300 hover:text-primary">
                  Tra cứu vé
                </Link>
              </li>
              <li>
                <Link href="/login" className="transition-colors duration-300 hover:text-primary">
                  Tài khoản
                </Link>
              </li>
              <li className="transition-colors duration-300 hover:text-foreground cursor-default">FAQ &amp; chính sách</li>
              <li className="transition-colors duration-300 hover:text-foreground cursor-default">Điều khoản sử dụng</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground/80">Liên hệ</h3>
            <ul className="mt-5 space-y-4 text-sm text-muted">
              <li className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary-light" />
                1900 0000
              </li>
              <li className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary-light" />
                hotro@cinestar.vn
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary-light" />
                Hệ thống rạp toàn quốc
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-14 flex flex-col items-center justify-between gap-3 border-t border-border/40 pt-7 text-xs text-muted-dark sm:flex-row">
          <p className="flex items-center gap-1">
            © {new Date().getFullYear()} CineStar. Made with <Heart className="h-3 w-3 text-primary fill-primary" /> in Vietnam.
          </p>
          <p className="text-center text-muted/60">
            This product uses TMDB and the TMDB APIs but is not endorsed, certified,
            or otherwise approved by TMDB.
          </p>
        </div>
      </div>
    </footer>
  );
}
