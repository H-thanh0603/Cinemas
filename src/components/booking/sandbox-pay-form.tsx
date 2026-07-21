"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { completeSandboxPayment } from "@/app/booking/actions";
import {
  SANDBOX_CARD_FAIL,
  SANDBOX_CARD_SUCCESS,
} from "@/lib/payment-sandbox";
import { formatVnd } from "@/lib/constants";

export function SandboxPayForm({
  code,
  method,
  amount,
}: {
  code: string;
  method: string;
  amount: number;
}) {
  const router = useRouter();
  const [cardNumber, setCardNumber] = useState(SANDBOX_CARD_SUCCESS);
  const [exp, setExp] = useState("12/30");
  const [cvc, setCvc] = useState("123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function pay(outcome: "success" | "fail" = "success") {
    setLoading(true);
    setError("");
    // Simulate gateway latency
    await new Promise((r) => setTimeout(r, 900));
    const result = await completeSandboxPayment({
      code,
      cardNumber: method === "CREDIT_CARD" ? cardNumber : undefined,
      outcome,
    });
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.replace(`/booking/confirmation/${code}`);
    router.refresh();
  }

  async function onCardSubmit(e: FormEvent) {
    e.preventDefault();
    await pay("success");
  }

  if (method === "CREDIT_CARD") {
    return (
      <form onSubmit={onCardSubmit} className="space-y-4">
        <p className="text-xs text-muted">
          Thẻ test:{" "}
          <button
            type="button"
            className="font-mono text-accent underline"
            onClick={() => setCardNumber(SANDBOX_CARD_SUCCESS)}
          >
            {SANDBOX_CARD_SUCCESS}
          </button>{" "}
          (OK) ·{" "}
          <button
            type="button"
            className="font-mono text-red-400 underline"
            onClick={() => setCardNumber(SANDBOX_CARD_FAIL)}
          >
            {SANDBOX_CARD_FAIL}
          </button>{" "}
          (từ chối)
        </p>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-muted">
            Số thẻ
          </label>
          <input
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value.replace(/[^\d ]/g, ""))}
            className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 font-mono text-sm outline-none focus:ring-2 focus:ring-primary/40"
            inputMode="numeric"
            autoComplete="cc-number"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-muted">
              MM/YY
            </label>
            <input
              value={exp}
              onChange={(e) => setExp(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 font-mono text-sm outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-muted">
              CVC
            </label>
            <input
              value={cvc}
              onChange={(e) => setCvc(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 font-mono text-sm outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        {error && (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-white shadow-lg shadow-primary/25 transition hover:brightness-110 disabled:opacity-50"
        >
          {loading ? "Đang xử lý cổng thanh toán…" : `Thanh toán ${formatVnd(amount)}`}
        </button>
      </form>
    );
  }

  // E_WALLET / BANK_TRANSFER
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-dashed border-border bg-surface p-6 text-center">
        <div className="mx-auto mb-3 flex h-36 w-36 items-center justify-center rounded-lg bg-white p-2">
          <div className="grid h-full w-full grid-cols-5 gap-0.5">
            {Array.from({ length: 25 }).map((_, i) => (
              <div
                key={i}
                className={`${
                  (i * 7 + code.charCodeAt(i % code.length)) % 3 === 0
                    ? "bg-black"
                    : "bg-white"
                }`}
              />
            ))}
          </div>
        </div>
        <p className="text-sm font-semibold">
          {method === "E_WALLET" ? "Quét QR ví điện tử (sandbox)" : "QR chuyển khoản (sandbox)"}
        </p>
        <p className="mt-1 text-xs text-muted">
          Nội dung CK: <span className="font-mono text-accent">{code}</span>
        </p>
        {method === "BANK_TRANSFER" && (
          <p className="mt-2 text-xs text-muted">
            STK demo: 0123456789 · NH TCB · CINESTAR JSC
          </p>
        )}
      </div>

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      <button
        type="button"
        disabled={loading}
        onClick={() => void pay("success")}
        className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-white shadow-lg shadow-primary/25 disabled:opacity-50"
      >
        {loading ? "Đang xác nhận…" : `Tôi đã thanh toán ${formatVnd(amount)}`}
      </button>
      <button
        type="button"
        disabled={loading}
        onClick={() => void pay("fail")}
        className="w-full rounded-xl border border-border py-2.5 text-xs font-medium text-muted hover:bg-surface"
      >
        Mô phỏng thanh toán thất bại
      </button>
    </div>
  );
}
