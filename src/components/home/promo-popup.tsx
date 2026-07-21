"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X, Gift, Copy, Check } from "lucide-react";

const STORAGE_KEY = "cinestar_promo_popup_v1";

export function PromoPopup({
  code = "WELCOME10",
  title = "Chào mừng đến CineStar",
  description = "Giảm 10% cho đơn đặt vé đầu tiên từ 200.000đ. Áp dụng khi thanh toán online.",
}: {
  code?: string;
  title?: string;
  description?: string;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORAGE_KEY)) return;
    } catch {
      /* ignore */
    }
    const t = setTimeout(() => setOpen(true), 1800);
    return () => clearTimeout(t);
  }, []);

  function close() {
    setOpen(false);
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="modal-backdrop fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="promo-popup-title"
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border bg-surface-raised shadow-2xl shadow-primary/20"
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-36 bg-gradient-to-br from-primary via-primary-dark to-black">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(245,197,24,0.35),transparent_55%)]" />
              <div className="absolute -bottom-8 left-1/2 flex h-16 w-16 -translate-x-1/2 items-center justify-center rounded-2xl border border-accent/40 bg-surface text-accent shadow-xl">
                <Gift className="h-8 w-8" />
              </div>
              <button
                type="button"
                onClick={close}
                className="absolute right-3 top-3 rounded-full bg-black/40 p-2 text-white/90 backdrop-blur hover:bg-black/60"
                aria-label="Đóng"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-6 pb-6 pt-12 text-center">
              <h2
                id="promo-popup-title"
                className="font-display text-2xl font-extrabold tracking-tight"
              >
                {title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p>

              <button
                type="button"
                onClick={copyCode}
                className="mt-5 inline-flex items-center gap-2 rounded-xl border border-dashed border-accent/50 bg-accent/10 px-5 py-2.5 font-mono text-lg font-bold tracking-widest text-accent transition hover:bg-accent/20"
              >
                {code}
                {copied ? (
                  <Check className="h-4 w-4 text-success" />
                ) : (
                  <Copy className="h-4 w-4 opacity-70" />
                )}
              </button>
              <p className="mt-2 text-[11px] text-muted-dark">
                {copied ? "Đã copy mã!" : "Nhấn để copy mã giảm giá"}
              </p>

              <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
                <Link
                  href="/movies?status=NOW_SHOWING"
                  onClick={close}
                  className="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary/30 transition hover:bg-primary-hover"
                >
                  Đặt vé ngay
                </Link>
                <button
                  type="button"
                  onClick={close}
                  className="rounded-xl border border-border px-6 py-3 text-sm font-semibold text-muted hover:bg-surface hover:text-foreground"
                >
                  Để sau
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
