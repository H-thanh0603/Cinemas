"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback } from "react";

export function AdminSearch({
  param = "q",
  placeholder = "Tìm kiếm...",
}: {
  param?: string;
  placeholder?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const onSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(param, value);
      } else {
        params.delete(param);
      }
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams, param]
  );

  return (
    <div className="relative">
      <svg
        className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        type="text"
        defaultValue={searchParams.get(param) ?? ""}
        onChange={onSearch}
        placeholder={placeholder}
        className="w-full rounded-xl border border-border bg-surface px-10 py-2.5 text-sm outline-none transition-colors focus:border-primary sm:w-64"
      />
    </div>
  );
}

export function AdminFilter({
  param,
  label,
  options,
}: {
  param: string;
  label?: string;
  options: { value: string; label: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "ALL") {
      params.set(param, value);
    } else {
      params.delete(param);
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <select
      defaultValue={searchParams.get(param) ?? "ALL"}
      onChange={onChange}
      className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary"
    >
      {label && <option value="ALL">{label}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function Pagination({
  page,
  pageSize,
  total,
}: {
  page: number;
  pageSize: number;
  total: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;

  const goTo = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (p <= 1) params.delete("page");
    else params.set("page", String(p));
    router.push(`${pathname}?${params.toString()}`);
  };

  const btn =
    "rounded-lg border border-border bg-surface px-3 py-1.5 text-sm transition-colors hover:bg-surface-raised disabled:opacity-40 disabled:hover:bg-surface";

  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm text-muted">
        Trang {page}/{pages} · {total} bản ghi
      </p>
      <div className="flex gap-2">
        <button className={btn} disabled={page <= 1} onClick={() => goTo(page - 1)}>
          ← Trước
        </button>
        <button className={btn} disabled={page >= pages} onClick={() => goTo(page + 1)}>
          Sau →
        </button>
      </div>
    </div>
  );
}
