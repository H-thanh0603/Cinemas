import { cn } from "@/lib/cn";

export function SectionHeading({
  title,
  subtitle,
  className,
  action,
}: {
  title: string;
  subtitle?: string;
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "mb-6 flex flex-wrap items-end justify-between gap-4",
        className
      )}
    >
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1 text-sm text-surface-400">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}
