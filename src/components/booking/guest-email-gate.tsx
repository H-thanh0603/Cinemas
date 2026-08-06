"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { verifyGuestAccess } from "@/app/booking/actions";

/**
 * For guest bookings (no userId), require email verification before showing
 * booking details. This prevents anyone with the booking code from viewing
 * sensitive information like phone, email, seats, and payment status.
 */
export function GuestEmailGate({
  code,
  error: initialError,
}: {
  code: string;
  error?: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState(initialError ?? "");

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setVerifying(true);
    setError("");
    const result = await verifyGuestAccess(code, email);
    if (result.ok) {
      router.replace(`/booking/confirmation/${encodeURIComponent(code)}?email=${encodeURIComponent(email.trim().toLowerCase())}`);
      router.refresh();
    } else {
      setError(result.error);
    }
    setVerifying(false);
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <span className="text-5xl">🔒</span>
      <h1 className="mt-4 text-2xl font-bold">Xác minh để xem vé</h1>
      <p className="mt-2 text-sm text-muted">
        Nhập email bạn đã dùng khi đặt vé để xem chi tiết.
      </p>
      <form onSubmit={verify} className="mt-6 space-y-4">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none ring-primary/40 focus:ring-2"
          placeholder="email@example.com"
        />
        {error && (
          <p className="text-sm text-danger">{error}</p>
        )}
        <button
          disabled={verifying}
          type="submit"
          className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-on-primary disabled:opacity-50"
        >
          {verifying ? "Đang xác minh..." : "Xác minh"}
        </button>
      </form>
    </div>
  );
}
