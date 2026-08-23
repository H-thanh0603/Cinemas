import type { Metadata } from "next";
import { AdminShell } from "./admin-shell";

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
  return <AdminShell navItems={navItems}>{children}</AdminShell>;
}
