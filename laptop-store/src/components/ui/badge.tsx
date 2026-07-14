import { cn } from "@/lib/cn";

export function Badge({
  children,
  className,
  tone = "brand",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: "brand" | "muted" | "success" | "warn";
}) {
  const tones = {
    brand: "bg-brand-600/20 text-brand-300 border-brand-500/30",
    muted: "bg-white/5 text-surface-300 border-white/10",
    success: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    warn: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
