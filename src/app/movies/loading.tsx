export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="h-8 w-48 skeleton-card rounded-lg" />
      <div className="mt-1 h-4 w-64 skeleton-card rounded" />
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-border/50 bg-surface">
            <div className="aspect-[2/3] skeleton-card rounded-none border-0" />
            <div className="space-y-2 p-3.5">
              <div className="h-3.5 w-3/4 skeleton-card rounded" />
              <div className="h-3 w-1/2 skeleton-card rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
