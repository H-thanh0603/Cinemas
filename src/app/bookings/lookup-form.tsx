"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_RE = /^CS-[A-HJ-NP-Z2-9]{6,10}$/;

export function LookupForm({
  initialEmail,
  initialCode,
}: {
  initialEmail: string;
  initialCode: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState(initialCode);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    const normalizedCode = code.trim().toUpperCase();
    if (!EMAIL_RE.test(trimmed)) {
      setError("Vui lòng nhập email hợp lệ");
      return;
    }
    if (!CODE_RE.test(normalizedCode)) {
      setError("Mã đặt vé không hợp lệ");
      return;
    }
    setError("");
    startTransition(() => {
      router.push(
        `/bookings?email=${encodeURIComponent(trimmed)}&code=${encodeURIComponent(normalizedCode)}`
      );
    });
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-border bg-surface p-4"
    >
      <div className="grid gap-2 sm:grid-cols-[1fr_12rem_auto]">
        <label className="sr-only" htmlFor="booking-email">
          Email đã dùng khi đặt vé
        </label>
        <input
          id="booking-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email đã dùng khi đặt vé (VD: khach@example.com)"
          className={`w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none placeholder:text-muted-dark focus:border-primary ${
            error ? "border-danger" : "border-border"
          }`}
        />
        <label className="sr-only" htmlFor="booking-code">
          Mã đặt vé
        </label>
        <input
          id="booking-code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Mã vé (VD: CS-ABC234)"
          autoComplete="off"
          className={`w-full rounded-lg border bg-background px-4 py-2.5 font-mono text-sm uppercase outline-none placeholder:font-sans placeholder:normal-case placeholder:text-muted-dark focus:border-primary ${
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
