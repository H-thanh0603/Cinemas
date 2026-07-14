"use client";

import { useState } from "react";
import { Button, Card, Input, SectionHeading } from "@/components/ui";

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) return;
    setSent(true);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
      <SectionHeading
        title="Liên hệ"
        subtitle="Hotline 1900 0000 · demo@techzone.vn"
      />
      <div className="grid gap-8 lg:grid-cols-2">
        <Card className="p-6">
          {sent ? (
            <div className="py-8 text-center">
              <p className="text-lg font-semibold text-emerald-400">
                Đã ghi nhận tin nhắn (mock)
              </p>
              <p className="mt-2 text-sm text-surface-400">
                Form này không gửi server — chỉ demo UI.
              </p>
              <Button className="mt-6" variant="secondary" onClick={() => setSent(false)}>
                Gửi thêm
              </Button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-surface-400">Họ tên</label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-surface-400">Email</label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-surface-400">Nội dung</label>
                <textarea
                  required
                  value={form.message}
                  onChange={(e) =>
                    setForm({ ...form, message: e.target.value })
                  }
                  rows={5}
                  className="w-full rounded-lg border border-white/10 bg-surface-900 px-3 py-2 text-sm text-surface-100 outline-none focus:border-brand-500"
                />
              </div>
              <Button type="submit">Gửi liên hệ</Button>
            </form>
          )}
        </Card>
        <div className="space-y-4 text-surface-300">
          <p>
            <strong className="text-white">Showroom demo:</strong>
            <br />
            123 Nguyễn Trãi, Q.1, TP.HCM
          </p>
          <p>
            <strong className="text-white">Giờ làm việc:</strong>
            <br />
            8:30 – 21:00 (T2–CN)
          </p>
        </div>
      </div>
    </div>
  );
}
