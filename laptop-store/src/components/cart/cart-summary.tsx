"use client";

import Link from "next/link";
import { formatVnd } from "@/lib/format";
import { Button, Card } from "@/components/ui";

export function CartSummary({
  subtotal,
  checkout,
}: {
  subtotal: number;
  checkout?: boolean;
}) {
  return (
    <Card className="p-5">
      <h2 className="text-lg font-semibold text-white">Tóm tắt</h2>
      <div className="mt-4 flex justify-between text-sm">
        <span className="text-surface-400">Tạm tính</span>
        <span className="font-medium text-surface-100">
          {formatVnd(subtotal)}
        </span>
      </div>
      <div className="mt-2 flex justify-between text-sm">
        <span className="text-surface-400">Vận chuyển</span>
        <span className="text-emerald-400">Miễn phí*</span>
      </div>
      <div className="mt-4 flex justify-between border-t border-white/5 pt-4">
        <span className="font-medium text-white">Tổng</span>
        <span className="text-lg font-bold text-brand-400">
          {formatVnd(subtotal)}
        </span>
      </div>
      {!checkout && (
        <Link href="/checkout" className="mt-5 block">
          <Button className="w-full" size="lg" disabled={subtotal <= 0}>
            Thanh toán
          </Button>
        </Link>
      )}
      <p className="mt-3 text-xs text-surface-500">
        * Demo UI — không thu tiền thật.
      </p>
    </Card>
  );
}
