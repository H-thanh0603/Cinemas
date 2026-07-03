import { Spinner } from "@/components/ui";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-64 animate-pulse rounded bg-surface-raised" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-xl bg-surface-raised"
          />
        ))}
      </div>
      <div className="h-32 animate-pulse rounded-xl bg-surface-raised" />
      <Spinner label="Đang tải dữ liệu..." />
    </div>
  );
}
