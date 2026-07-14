"use client";

import { useAuth } from "@/context/auth-context";
import { Button, Card } from "@/components/ui";
import Link from "next/link";

export default function AccountPage() {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Tài khoản</h1>
      <Card className="mt-6 space-y-3 p-6">
        <p>
          <span className="text-surface-500">Họ tên:</span>{" "}
          <span className="text-white">{user.name}</span>
        </p>
        <p>
          <span className="text-surface-500">Email:</span>{" "}
          <span className="text-white">{user.email}</span>
        </p>
        <p>
          <span className="text-surface-500">SĐT:</span>{" "}
          <span className="text-white">{user.phone}</span>
        </p>
        <div className="flex flex-wrap gap-3 pt-4">
          <Link href="/account/orders">
            <Button>Đơn hàng của tôi</Button>
          </Link>
          <Button variant="secondary" onClick={logout}>
            Đăng xuất
          </Button>
        </div>
      </Card>
    </div>
  );
}
