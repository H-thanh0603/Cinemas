"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Footer() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;

  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-base font-black text-white">
                C
              </span>
              <span className="text-lg font-extrabold">
                Cine<span className="text-primary">Star</span>
              </span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              Hệ thống rạp chiếu phim hiện đại với trải nghiệm đặt vé trực
              tuyến nhanh chóng, tiện lợi và an toàn.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">
              Khám phá
            </h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link href="/movies?status=NOW_SHOWING" className="text-muted hover:text-foreground">
                  Phim đang chiếu
                </Link>
              </li>
              <li>
                <Link href="/movies?status=COMING_SOON" className="text-muted hover:text-foreground">
                  Phim sắp chiếu
                </Link>
              </li>
              <li>
                <Link href="/cinemas" className="text-muted hover:text-foreground">
                  Hệ thống rạp
                </Link>
              </li>
              <li>
                <Link href="/promotions" className="text-muted hover:text-foreground">
                  Khuyến mãi
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">
              Hỗ trợ
            </h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link href="/bookings" className="text-muted hover:text-foreground">
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

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">
              Liên hệ
            </h3>
            <ul className="mt-4 space-y-2 text-sm text-muted">
              <li>Hotline: 1900 0000</li>
              <li>Email: hotro@cinestar.vn</li>
              <li>Giờ hỗ trợ: 8:00 — 22:00 hằng ngày</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-center text-xs text-muted-dark">
          © {new Date().getFullYear()} CineStar. Dự án minh hoạ — mọi bộ phim
          và thương hiệu trong trang đều là hư cấu.
        </div>
      </div>
    </footer>
  );
}
