"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Footer() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin") || pathname.startsWith("/landing")) return null;

  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-lg font-black text-white shadow-lg shadow-primary/20">
                C
              </span>
              <span className="text-xl font-extrabold">
                Cine<span className="text-primary">Star</span>
              </span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              Hệ thống rạp chiếu phim hiện đại với trải nghiệm đặt vé trực
              tuyến nhanh chóng, tiện lợi và an toàn.
            </p>
            {/* Social */}
            <div className="mt-5 flex items-center gap-3">
              {[
                { icon: "📘", label: "Facebook" },
                { icon: "📸", label: "Instagram" },
                { icon: "▶️", label: "YouTube" },
                { icon: "🎵", label: "TikTok" },
              ].map((s) => (
                <a
                  key={s.label}
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface-raised text-sm transition-all hover:border-primary/40 hover:bg-primary/10"
                  aria-label={s.label}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Khám phá */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Khám phá
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link href="/movies?status=NOW_SHOWING" className="text-muted transition-colors hover:text-primary">
                  Phim đang chiếu
                </Link>
              </li>
              <li>
                <Link href="/movies?status=COMING_SOON" className="text-muted transition-colors hover:text-primary">
                  Phim sắp chiếu
                </Link>
              </li>
              <li>
                <Link href="/cinemas" className="text-muted transition-colors hover:text-primary">
                  Hệ thống rạp
                </Link>
              </li>
              <li>
                <Link href="/promotions" className="text-muted transition-colors hover:text-primary">
                  Khuyến mãi
                </Link>
              </li>
            </ul>
          </div>

          {/* Hỗ trợ */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Hỗ trợ
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link href="/bookings" className="text-muted transition-colors hover:text-primary">
                  Tra cứu vé
                </Link>
              </li>
              <li>
                <span className="text-muted">Câu hỏi thường gặp</span>
              </li>
              <li>
                <span className="text-muted">Điều khoản sử dụng</span>
              </li>
              <li>
                <span className="text-muted">Chính sách bảo mật</span>
              </li>
            </ul>
          </div>

          {/* Liên hệ */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Liên hệ
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-muted">
              <li className="flex items-start gap-2.5">
                <span className="text-accent">📞</span>
                <div>
                  <div className="font-medium text-foreground">Hotline</div>
                  <div>1900 0000</div>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-accent">✉</span>
                <div>
                  <div className="font-medium text-foreground">Email</div>
                  <div>hotro@cinestar.vn</div>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-accent">🕐</span>
                <div>
                  <div className="font-medium text-foreground">Giờ hỗ trợ</div>
                  <div>8:00 — 22:00 hằng ngày</div>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
          <p className="text-xs text-muted-dark">
            © {new Date().getFullYear()} CineStar. Dự án minh hoạ — mọi bộ phim
            và thương hiệu trong trang đều là hư cấu.
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-dark">
            <span>Điều khoản</span>
            <span>·</span>
            <span>Bảo mật</span>
            <span>·</span>
            <span>Cookie</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
