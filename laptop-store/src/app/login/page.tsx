"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { Button, Card, Input, SectionHeading } from "@/components/ui";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("demo@techzone.vn");
  const [password, setPassword] = useState("demo");
  const [error, setError] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ok = login(email, password);
    if (!ok) {
      setError("Nhập email và mật khẩu.");
      return;
    }
    router.push("/account");
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12 lg:px-6">
      <SectionHeading title="Đăng nhập" subtitle="Mock auth — mật khẩu bất kỳ" />
      <Card className="p-6">
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-surface-400">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-surface-400">
              Mật khẩu
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button type="submit" className="w-full">
            Đăng nhập
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-surface-400">
          Chưa có tài khoản?{" "}
          <Link href="/register" className="text-brand-400 hover:underline">
            Đăng ký
          </Link>
        </p>
      </Card>
    </div>
  );
}
