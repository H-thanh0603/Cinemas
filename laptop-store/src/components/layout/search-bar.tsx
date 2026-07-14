"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui";

export function SearchBar({ className }: { className?: string }) {
  const router = useRouter();
  const [q, setQ] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const query = q.trim();
    if (!query) {
      router.push("/products");
      return;
    }
    router.push(`/search?q=${encodeURIComponent(query)}`);
  }

  return (
    <form onSubmit={onSubmit} className={className}>
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Tìm laptop, hãng, CPU..."
        aria-label="Tìm kiếm"
      />
    </form>
  );
}
