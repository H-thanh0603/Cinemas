import { cn } from "@/lib/cn";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/5 bg-surface-900/80 shadow-xl shadow-black/20",
        className
      )}
    >
      {children}
    </div>
  );
}
