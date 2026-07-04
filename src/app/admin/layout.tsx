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
        <div className="flex-1 p-4 pt-16 sm:p-6 sm:pt-6 lg:pl-8">{children}</div>
      </div>
    </div>
  );
}
