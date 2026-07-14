import Link from "next/link";
import { Button } from "./button";

export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
}: {
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-surface-900/40 px-6 py-16 text-center">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      {description && (
        <p className="mt-2 max-w-md text-sm text-surface-400">{description}</p>
      )}
      {actionHref && actionLabel && (
        <Link href={actionHref} className="mt-6">
          <Button>{actionLabel}</Button>
        </Link>
      )}
    </div>
  );
}
