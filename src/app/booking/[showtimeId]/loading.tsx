import { Spinner } from "@/components/ui";

export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <div className="h-5 w-48 animate-pulse rounded bg-surface-raised" />
      <div className="mt-6 space-y-4">
        <div className="h-12 animate-pulse rounded-xl bg-surface-raised" />
        <div className="h-64 animate-pulse rounded-xl bg-surface-raised" />
      </div>
      <Spinner label="Đang tải thông tin suất chiếu..." />
    </div>
  );
}
