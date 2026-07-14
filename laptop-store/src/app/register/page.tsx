"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { Button, Card, Input, SectionHeading } from "@/components/ui";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ok = register(name, email, password);
    if (!ok) {
      setError("Điền đầy đủ họ tên, email và mật khẩu.");
      return;
    }
    router.push("/account");
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12 lg:px-6">
      <SectionHeading title="Đăng ký" subtitle="Tạo tài khoản demo" />
      <Card className="p-6">
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-surface-400">Họ tên</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
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
            Tạo tài khoản
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-surface-400">
          Đã có tài khoản?{" "}
          <Link href="/login" className="text-brand-400 hover:underline">
            Đăng nhập
          </Link>
        </p>
      </Card>
    </div>
  );
}
