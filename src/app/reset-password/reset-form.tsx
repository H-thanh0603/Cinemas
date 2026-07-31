"use client";

import { useState } from "react";
import { resetPassword } from "@/app/password-reset/actions";

export function ResetForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    const result = await resetPassword(token, password);
    setLoading(false);
    setMessage(result.ok ? "Đổi mật khẩu thành công. Bạn có thể đăng nhập." : result.error);
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-4">
      <label className="block text-sm font-medium" htmlFor="new-password">Mật khẩu mới</label>
      <input id="new-password" type="password" minLength={8} maxLength={128} required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none ring-primary/40 focus:ring-2" />
      <button disabled={loading} className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{loading ? "Đang lưu..." : "Đặt lại mật khẩu"}</button>
      {message && <p className="text-sm text-muted">{message}</p>}
    </form>
  );
}
