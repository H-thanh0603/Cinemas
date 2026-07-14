"use client";

import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { AccountNav } from "@/components/account/account-nav";
import { Button } from "@/components/ui";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoggedIn, hydrated } = useAuth();

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 text-surface-400 lg:px-6">
        Đang tải…
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center lg:px-6">
        <h1 className="text-2xl font-bold text-white">Vui lòng đăng nhập</h1>
        <p className="mt-2 text-surface-400">
          Khu vực tài khoản cần phiên đăng nhập mock.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/login">
            <Button>Đăng nhập</Button>
          </Link>
          <Link href="/register">
            <Button variant="secondary">Đăng ký</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        <AccountNav />
        <div>{children}</div>
      </div>
    </div>
  );
}
