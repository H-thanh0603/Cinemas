"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/cart-context";
import { useAuth } from "@/context/auth-context";
import { CartSummary } from "@/components/cart/cart-summary";
import { Button, Card, Input, SectionHeading } from "@/components/ui";

export default function CheckoutPage() {
  const { items, subtotal, clear, hydrated } = useCart();
  const { user, isLoggedIn } = useAuth();
  const router = useRouter();
  const [successCode, setSuccessCode] = useState<string | null>(null);
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    address: "",
    note: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (isLoggedIn && user) {
      setForm((f) => ({
        ...f,
        fullName: user.name,
        phone: user.phone,
        email: user.email,
      }));
    }
  }, [isLoggedIn, user]);

  useEffect(() => {
    if (hydrated && items.length === 0 && !successCode) {
      router.replace("/cart");
    }
  }, [hydrated, items.length, successCode, router]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.fullName.trim() || !form.phone.trim() || !form.address.trim()) {
      setError("Vui lòng điền họ tên, SĐT và địa chỉ.");
      return;
    }
    const code = `TZ${Math.floor(100000 + Math.random() * 900000)}`;
    clear();
    setSuccessCode(code);
    setError("");
  }

  if (successCode) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center lg:px-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-2xl text-emerald-400">
          ✓
        </div>
        <h1 className="mt-6 text-3xl font-bold text-white">
          Đặt hàng thành công
        </h1>
        <p className="mt-3 text-surface-400">
          Mã đơn demo của bạn:{" "}
          <span className="font-semibold text-brand-400">{successCode}</span>
        </p>
        <p className="mt-2 text-sm text-surface-500">
          Đây là UI mock — không có thanh toán thật.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/products">
            <Button>Tiếp tục mua</Button>
          </Link>
          <Link href="/account/orders">
            <Button variant="secondary">Xem đơn hàng</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!hydrated || items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 text-surface-400 lg:px-6">
        Đang chuyển hướng…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
      <SectionHeading
        title="Thanh toán"
        subtitle="Form demo — không thu tiền"
      />
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <Card className="p-6">
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm text-surface-400">
                Họ và tên *
              </label>
              <Input
                value={form.fullName}
                onChange={(e) =>
                  setForm({ ...form, fullName: e.target.value })
                }
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm text-surface-400">
                  Số điện thoại *
                </label>
                <Input
                  value={form.phone}
                  onChange={(e) =>
                    setForm({ ...form, phone: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-surface-400">
                  Email
                </label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm({ ...form, email: e.target.value })
                  }
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm text-surface-400">
                Địa chỉ giao hàng *
              </label>
              <Input
                value={form.address}
                onChange={(e) =>
                  setForm({ ...form, address: e.target.value })
                }
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-surface-400">
                Ghi chú
              </label>
              <Input
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
              />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <Button type="submit" size="lg" className="w-full sm:w-auto">
              Xác nhận đặt hàng
            </Button>
          </form>
        </Card>
        <CartSummary subtotal={subtotal} checkout />
      </div>
    </div>
  );
}
