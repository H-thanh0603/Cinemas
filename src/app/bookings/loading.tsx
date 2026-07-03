import { Spinner } from "@/components/ui";

export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="h-8 w-32 animate-pulse rounded bg-surface-raised" />
      <div className="mt-6 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-32 animate-pulse rounded-xl bg-surface-raised"
          />
        ))}
      </div>
      <Spinner label="Đang tải vé..." />
    </div>
  );
}
