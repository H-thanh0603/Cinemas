"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Phone, Mail, MapPin, Share2 } from "lucide-react";

export function Footer() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin") || pathname.startsWith("/landing")) return null;

  return (
    <footer className="relative overflow-hidden border-t border-border bg-surface">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      <div className="absolute -left-32 bottom-0 h-64 w-64 rounded-full bg-primary/5 blur-[100px]" />

      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-lg font-black text-white shadow-lg shadow-primary/25">
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
            <div className="mt-5 flex items-center gap-2">
              {["Facebook", "Instagram", "YouTube"].map((label) => (
                <a
                  key={label}
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface-raised text-muted transition hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
                  aria-label={label}
                >
                  <Share2 className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider">Khám phá</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {[
                { href: "/movies?status=NOW_SHOWING", label: "Phim đang chiếu" },
                { href: "/movies?status=COMING_SOON", label: "Phim sắp chiếu" },
                { href: "/cinemas", label: "Hệ thống rạp" },
                { href: "/promotions", label: "Khuyến mãi" },
              ].map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-muted transition hover:text-primary"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider">Hỗ trợ</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-muted">
              <li>
                <Link href="/bookings" className="transition hover:text-primary">
                  Tra cứu vé
                </Link>
              </li>
              <li>
                <Link href="/login" className="transition hover:text-primary">
                  Tài khoản
                </Link>
              </li>
              <li>FAQ &amp; chính sách</li>
              <li>Điều khoản sử dụng</li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider">Liên hệ</h3>
            <ul className="mt-4 space-y-3 text-sm text-muted">
              <li className="flex items-start gap-2">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                1900 0000
              </li>
              <li className="flex items-start gap-2">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                hotro@cinestar.vn
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                Hệ thống rạp toàn quốc
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-xs text-muted-dark sm:flex-row">
          <p>© {new Date().getFullYear()} CineStar. All rights reserved.</p>
          <p className="text-muted">Đặt vé · Giữ ghế · QR điện tử</p>
        </div>
      </div>
    </footer>
  );
}
