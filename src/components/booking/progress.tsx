"use client";

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
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  done
                    ? "bg-success text-white"
                    : active
                      ? "bg-primary text-white"
                      : "border border-border bg-surface text-muted"
                }`}
              >
                {done ? "✓" : idx + 1}
              </span>
              <span
                className={`text-xs font-semibold sm:text-sm ${
                  active ? "text-foreground" : "text-muted"
                }`}
              >
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <span
                className={`h-px w-6 sm:w-12 ${
                  done ? "bg-success" : "bg-border"
                }`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
