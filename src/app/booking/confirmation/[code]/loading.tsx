import { Spinner } from "@/components/ui";

export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="text-center">
        <div className="mx-auto h-16 w-16 animate-pulse rounded-full bg-surface-raised" />
        <div className="mx-auto mt-4 h-8 w-64 animate-pulse rounded bg-surface-raised" />
      </div>
      <div className="mt-8 space-y-4">
        <div className="h-48 animate-pulse rounded-3xl bg-surface-raised" />
        <div className="h-32 animate-pulse rounded-2xl bg-surface-raised" />
      </div>
      <Spinner label="Đang tải thông tin vé..." />
    </div>
  );
}
