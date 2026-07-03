import { Spinner } from "@/components/ui";

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="h-8 w-48 animate-pulse rounded bg-surface-raised" />
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="aspect-[2/3] animate-pulse rounded-xl bg-surface-raised"
          />
        ))}
      </div>
      <Spinner label="Đang tải danh sách phim..." />
    </div>
  );
}
