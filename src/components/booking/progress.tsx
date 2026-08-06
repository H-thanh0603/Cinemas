"use client";

import { motion } from "framer-motion";

const steps = [
  { key: "seats", label: "Chọn ghế" },
  { key: "extras", label: "Vé & Combo" },
  { key: "checkout", label: "Thanh toán" },
];

export function BookingProgress({ current }: { current: string }) {
  const currentIdx = steps.findIndex((s) => s.key === current);

  return (
    <ol className="flex items-center justify-center gap-2 sm:gap-4">
      {steps.map((step, idx) => {
        const done = idx < currentIdx;
        const active = idx === currentIdx;
        return (
          <li key={step.key} className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2">
              <motion.span
                initial={false}
                animate={
                  done || active
                    ? { scale: [1, 1.18, 1] }
                    : { scale: 1 }
                }
                transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
                className={`relative flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  done
                    ? "bg-success text-white shadow-lg shadow-success/25"
                    : active
                      ? "bg-primary text-on-primary shadow-lg shadow-primary/30"
                      : "border border-border bg-surface text-muted"
                }`}
              >
                {done ? "✓" : idx + 1}
                {active && (
                  <span className="absolute inset-0 -z-10 rounded-full bg-primary/30 animate-ping" />
                )}
              </motion.span>
              <motion.span
                initial={false}
                animate={{ color: active ? "#f1f3f8" : done ? "#34d399" : "#8e95b0" }}
                transition={{ duration: 0.3 }}
                className={`text-xs font-semibold sm:text-sm ${
                  active ? "text-foreground" : "text-muted"
                }`}
              >
                {step.label}
              </motion.span>
            </div>
            {idx < steps.length - 1 && (
              <span className="relative h-px w-6 overflow-hidden sm:w-12">
                <span
                  className={`absolute inset-0 transition-colors duration-500 ${
                    done ? "bg-success" : "bg-border"
                  }`}
                />
                {done && (
                  <motion.span
                    className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-success to-emerald-300"
                    initial={{ x: "-100%" }}
                    animate={{ x: 0 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  />
                )}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
