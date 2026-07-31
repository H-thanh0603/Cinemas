import Link from "next/link";

export function AdminPagination({
  page,
  totalPages,
  query,
}: {
  page: number;
  totalPages: number;
  query: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;
  const href = (nextPage: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value) params.set(key, value);
    }
    params.set("page", String(nextPage));
    return `?${params.toString()}`;
  };
  return (
    <nav className="flex items-center justify-between text-sm" aria-label="Phân trang">
      <Link className={`rounded-lg border border-border px-3 py-2 ${page <= 1 ? "pointer-events-none opacity-40" : ""}`} href={href(Math.max(1, page - 1))}>
        ← Trước
      </Link>
      <span className="text-muted">Trang {page}/{totalPages}</span>
      <Link className={`rounded-lg border border-border px-3 py-2 ${page >= totalPages ? "pointer-events-none opacity-40" : ""}`} href={href(Math.min(totalPages, page + 1))}>
        Sau →
      </Link>
    </nav>
  );
}
