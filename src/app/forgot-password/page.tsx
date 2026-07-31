"use client";

import Link from "next/link";
import { useState } from "react";
import { requestPasswordReset } from "@/app/password-reset/actions";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    await requestPasswordReset(email);
    setLoading(false);
    setSent(true);
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <div className="rounded-2xl border border-border bg-surface-raised p-8 shadow-xl">
        <h1 className="text-center text-2xl font-extrabold">Quên mật khẩu</h1>
        {sent ? (
          <p className="mt-6 text-center text-sm text-muted">Nếu email tồn tại, hướng dẫn đặt lại mật khẩu đã được gửi.</p>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block text-sm font-medium" htmlFor="reset-email">Email</label>
            <input id="reset-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none ring-primary/40 focus:ring-2" />
            <button disabled={loading} className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{loading ? "Đang gửi..." : "Gửi liên kết"}</button>
          </form>
        )}
        <p className="mt-6 text-center text-sm text-muted"><Link href="/login" className="text-primary hover:underline">Quay lại đăng nhập</Link></p>
      </div>
    </div>
  );
}
