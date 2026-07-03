import type { Metadata } from "next";
import Link from "next/link";
import { AdminSidebar } from "./admin-sidebar";

export const metadata: Metadata = {
  title: { default: "Quản trị", template: "%s | Quản trị CineStar" },
};

const navItems = [
  { href: "/admin", label: "Tổng quan", icon: "📊" },
  { href: "/admin/movies", label: "Phim", icon: "🎬" },
  { href: "/admin/cinemas", label: "Rạp", icon: "🏢" },
  { href: "/admin/rooms", label: "Phòng & Ghế", icon: "🪑" },
  { href: "/admin/showtimes", label: "Suất chiếu", icon: "🕐" },
  { href: "/admin/bookings", label: "Đặt vé", icon: "🎫" },
  { href: "/admin/promotions", label: "Khuyến mãi", icon: "🎁" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar navItems={navItems} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-2">
            <span className="text-lg font-extrabold">
              Cine<span className="text-primary">Star</span>
            </span>
            <span className="rounded-md bg-surface-raised px-2 py-0.5 text-xs font-semibold text-muted">
              Admin
            </span>
          </div>
          <Link
            href="/"
            className="text-sm font-medium text-muted hover:text-foreground"
          >
            ← Về trang web
          </Link>
        </header>
        <div className="flex-1 p-4 sm:p-6">{children}</div>
      </div>
    </div>
  );
}
