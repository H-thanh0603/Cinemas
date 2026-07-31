"use client";

import { useState } from "react";
import { createStripeCheckout } from "@/app/booking/payment-actions";
import { formatVnd } from "@/lib/constants";

export function StripeCheckoutButton({
  code,
  amount,
}: {
  code: string;
  amount: number;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function startCheckout() {
    setLoading(true);
    setError("");
    const result = await createStripeCheckout(code);
    if (result.ok) {
      window.location.assign(result.data.url);
      return;
    }
    setLoading(false);
    setError(result.error);
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={() => void startCheckout()}
        disabled={loading}
        className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-white shadow-lg shadow-primary/25 disabled:opacity-50"
      >
        {loading ? "Đang mở cổng thanh toán…" : `Thanh toán ${formatVnd(amount)}`}
      </button>
      <p className="text-center text-xs text-muted">
        Thanh toán bảo mật qua Stripe Checkout
      </p>
    </div>
  );
}
