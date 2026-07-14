import { cn } from "@/lib/cn";

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full h-10 rounded-lg bg-surface-900 border border-white/10 px-3 text-sm text-surface-100 placeholder:text-surface-500 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/40",
        className
      )}
      {...props}
    />
  );
}
