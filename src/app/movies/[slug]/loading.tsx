import { Spinner } from "@/components/ui";

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-8 md:flex-row">
        <div className="mx-auto aspect-[2/3] w-48 shrink-0 animate-pulse rounded-2xl bg-surface-raised md:w-64" />
        <div className="flex-1 space-y-4">
          <div className="h-10 w-3/4 animate-pulse rounded bg-surface-raised" />
          <div className="h-5 w-1/2 animate-pulse rounded bg-surface-raised" />
          <div className="h-24 w-full animate-pulse rounded bg-surface-raised" />
          <div className="h-12 w-48 animate-pulse rounded-xl bg-surface-raised" />
        </div>
      </div>
      <Spinner label="Đang tải thông tin phim..." />
    </div>
  );
}
