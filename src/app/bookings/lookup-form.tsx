"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LookupForm({ initialEmail }: { initialEmail: string }) {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!EMAIL_RE.test(trimmed)) {
      setError("Vui lòng nhập email hợp lệ");
      return;
    }
    setError("");
    startTransition(() => {
      router.push(`/bookings?email=${encodeURIComponent(trimmed)}`);
    });
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-border bg-surface p-4"
    >
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email đã dùng khi đặt vé (VD: khach@example.com)"
          className={`w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none placeholder:text-muted-dark focus:border-primary ${
            error ? "border-danger" : "border-border"
          }`}
        />
        <button
          type="submit"
          disabled={isPending}
          className="shrink-0 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
        >
          {isPending ? "Đang tìm..." : "Tra cứu"}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </form>
  );
}
