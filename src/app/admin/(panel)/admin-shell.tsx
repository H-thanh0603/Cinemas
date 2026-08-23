"use client";

import { usePathname } from "next/navigation";
import { AdminSidebar } from "./admin-sidebar";

type NavItem = { href: string; label: string; icon: string };

export function AdminShell({
  navItems,
  children,
}: {
  navItems: NavItem[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Login page: no chrome
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar navItems={navItems} />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex-1 p-4 pt-16 sm:p-6 sm:pt-6 lg:pl-8">{children}</div>
      </div>
    </div>
  );
}
