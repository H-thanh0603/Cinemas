import Link from "next/link";
import type { ReactNode } from "react";

export function Badge({
  children,
  color = "muted",
  dot = false,
}: {
  children: ReactNode;
  color?: "muted" | "primary" | "accent" | "success" | "warning" | "danger" | "info";
  dot?: boolean;
}) {
  const colors: Record<string, string> = {
    muted: "border-border-light bg-surface-raised text-muted",
    primary: "border-primary/40 bg-primary/10 text-primary",
    accent: "border-accent/40 bg-accent/10 text-accent",
    success: "border-success/40 bg-success/10 text-success",
    warning: "border-warning/40 bg-warning/10 text-warning",
    danger: "border-danger/40 bg-danger/10 text-danger",
    info: "border-info/40 bg-info/10 text-info",
  };
  const dots: Record<string, string> = {
    muted: "bg-muted",
    primary: "bg-primary",
    accent: "bg-accent",
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-danger",
    info: "bg-info",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${colors[color]}`}
    >
      {dot && (
        <span className={`relative flex h-1.5 w-1.5`}>
          <span className={`absolute inline-flex h-full w-full rounded-full ${dots[color]} opacity-60 animate-ping`} />
          <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${dots[color]}`} />
        </span>
      )}
      {children}
    </span>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <div className="relative h-12 w-12">
        <div className="absolute inset-0 rounded-full border-2 border-border" />
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-primary border-r-accent/60" />
        <div className="absolute inset-[14px] rounded-full bg-primary/10 animate-pulse" />
      </div>
      {label && <p className="text-sm text-muted">{label}</p>}
    </div>
  );
}

export function EmptyState({
  icon = "🎬",
  title,
  description,
  actionHref,
  actionLabel,
}: {
  icon?: string;
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-3xl border border-dashed border-border bg-surface/60 px-6 py-16 text-center backdrop-blur-sm">
      <div className="pointer-events-none absolute -top-16 left-1/2 h-40 w-72 -translate-x-1/2 rounded-full bg-primary/8 blur-[80px]" />
      <span className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-border/60 bg-surface-raised/80 text-3xl shadow-lg shadow-black/20 backdrop-blur">
        <span className="animate-float">{icon}</span>
      </span>
      <h3 className="mt-5 text-lg font-semibold">{title}</h3>
      {description && (
        <p className="mt-2 max-w-md text-sm text-muted">{description}</p>
      )}
      {actionHref && actionLabel && (
        <Link
          href={actionHref}
          className="btn-sheen mt-6 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-hover"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}

export function SectionHeading({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl text-balance">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export { PosterImage } from "./poster-image";
