"use client";

import { useState } from "react";
import { validatePromotion } from "@/app/booking/actions";
import { formatVnd } from "@/lib/constants";

export type ContactInfo = { name: string; email: string; phone: string };
export type PromoState = {
  code: string;
  discount: number;
  description: string;
} | null;

type CheckoutStepProps = {
  orderValue: number;
  contact: ContactInfo;
  onContactChange: (contact: ContactInfo) => void;
  paymentMethod: string;
  onPaymentMethodChange: (method: string) => void;
  promo: PromoState;
  onPromoChange: (promo: PromoState) => void;
  fieldErrors: Partial<Record<keyof ContactInfo, string>>;
};

const paymentOptions = [
  {
    value: "CREDIT_CARD",
    label: "Thẻ tín dụng / ghi nợ",
    icon: "💳",
    note: "Sandbox: thẻ 4242… → OK · 4000…0002 → fail",
  },
  {
    value: "E_WALLET",
    label: "Ví điện tử",
    icon: "📱",
    note: "Sandbox: QR giả + xác nhận đã thanh toán",
  },
  {
    value: "BANK_TRANSFER",
    label: "Chuyển khoản ngân hàng",
    icon: "🏦",
    note: "Sandbox: STK demo + QR CK",
  },
  {
    value: "AT_COUNTER",
    label: "Thanh toán tại quầy",
    icon: "🎫",
    note: "Giữ ghế 8 phút · thanh toán tại rạp",
  },
];

export function CheckoutStep({
  orderValue,
  contact,
  onContactChange,
  paymentMethod,
  onPaymentMethodChange,
  promo,
  onPromoChange,
  fieldErrors,
}: CheckoutStepProps) {
  const [promoInput, setPromoInput] = useState(promo?.code ?? "");
  const [promoError, setPromoError] = useState("");
  const [checkingPromo, setCheckingPromo] = useState(false);

  async function applyPromo() {
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    setCheckingPromo(true);
    setPromoError("");
    const result = await validatePromotion(code, orderValue);
    setCheckingPromo(false);
    if (result.ok) {
      onPromoChange({
        code,
        discount: result.data.discount,
        description: result.data.description,
      });
    } else {
      onPromoChange(null);
      setPromoError(result.error);
    }
  }

  return (
    <div>
      <h1 className="text-xl font-bold">Thông tin liên hệ</h1>
      <p className="mt-1 text-xs text-muted">
        Vé điện tử sẽ được gửi về email và số điện thoại của bạn
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="contact-name" className="text-xs font-semibold uppercase tracking-wider text-muted">
            Họ và tên *
          </label>
          <input
            id="contact-name"
            type="text"
            value={contact.name}
            onChange={(e) => onContactChange({ ...contact, name: e.target.value })}
            placeholder="Nguyễn Văn A"
            className={`mt-1.5 w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none placeholder:text-muted-dark focus:border-primary ${
              fieldErrors.name ? "border-danger" : "border-border"
            }`}
          />
          {fieldErrors.name && (
            <p className="mt-1 text-xs text-danger">{fieldErrors.name}</p>
          )}
        </div>
        <div>
          <label htmlFor="contact-email" className="text-xs font-semibold uppercase tracking-wider text-muted">
            Email *
          </label>
          <input
            id="contact-email"
            type="email"
            value={contact.email}
            onChange={(e) => onContactChange({ ...contact, email: e.target.value })}
            placeholder="ban@email.com"
            className={`mt-1.5 w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none placeholder:text-muted-dark focus:border-primary ${
              fieldErrors.email ? "border-danger" : "border-border"
            }`}
          />
          {fieldErrors.email && (
            <p className="mt-1 text-xs text-danger">{fieldErrors.email}</p>
          )}
        </div>
        <div>
          <label htmlFor="contact-phone" className="text-xs font-semibold uppercase tracking-wider text-muted">
            Số điện thoại *
          </label>
          <input
            id="contact-phone"
            type="tel"
            value={contact.phone}
            onChange={(e) => onContactChange({ ...contact, phone: e.target.value })}
            placeholder="0901234567"
            className={`mt-1.5 w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none placeholder:text-muted-dark focus:border-primary ${
              fieldErrors.phone ? "border-danger" : "border-border"
            }`}
          />
          {fieldErrors.phone && (
            <p className="mt-1 text-xs text-danger">{fieldErrors.phone}</p>
          )}
        </div>
      </div>

      <h2 className="mt-8 text-xl font-bold">Mã ưu đãi</h2>
      <div className="mt-3 flex gap-2">
        <input
          type="text"
          value={promoInput}
          onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
          placeholder="Nhập mã (VD: WELCOME10)"
          className="w-full max-w-xs rounded-lg border border-border bg-background px-4 py-2.5 font-mono text-sm uppercase outline-none placeholder:font-sans placeholder:normal-case placeholder:text-muted-dark focus:border-primary"
        />
        <button
          type="button"
          onClick={applyPromo}
          disabled={checkingPromo || !promoInput.trim()}
          className="shrink-0 rounded-lg border border-accent/50 bg-accent/10 px-5 py-2.5 text-sm font-semibold text-accent transition-colors hover:bg-accent/20 disabled:opacity-40"
        >
          {checkingPromo ? "Đang kiểm tra..." : "Áp dụng"}
        </button>
      </div>
      {promoError && <p className="mt-2 text-xs text-danger">✕ {promoError}</p>}
      {promo && (
        <div className="mt-2 flex items-center gap-2 text-xs text-success">
          <span>
            ✓ Áp dụng mã <b>{promo.code}</b> — giảm {formatVnd(promo.discount)}
          </span>
          <button
            type="button"
            onClick={() => {
              onPromoChange(null);
              setPromoInput("");
            }}
            className="text-muted underline hover:text-foreground"
          >
            Gỡ mã
          </button>
        </div>
      )}

      <h2 className="mt-8 text-xl font-bold">Phương thức thanh toán</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {paymentOptions.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onPaymentMethodChange(opt.value)}
            className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-colors ${
              paymentMethod === opt.value
                ? "border-primary bg-primary/5"
                : "border-border bg-surface-raised hover:border-border-light"
            }`}
          >
            <span className="text-2xl">{opt.icon}</span>
            <span>
              <span className="block text-sm font-semibold">{opt.label}</span>
              <span className="mt-0.5 block text-xs text-muted">
                {opt.note}
              </span>
            </span>
            <span
              className={`ml-auto mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                paymentMethod === opt.value
                  ? "border-primary bg-primary"
                  : "border-border-light"
              }`}
            >
              {paymentMethod === opt.value && (
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
              )}
            </span>
          </button>
        ))}
      </div>

      <p className="mt-4 rounded-lg border border-info/30 bg-info/5 px-4 py-3 text-xs text-info">
        ℹ️ Sau khi xác nhận, hệ thống <b>giữ ghế 8 phút</b>. Online → cổng
        sandbox CineStar Pay (không trừ tiền thật). Tại quầy → giữ PENDING đến
        khi hết giờ hoặc thanh toán tại rạp.
      </p>
    </div>
  );
}
