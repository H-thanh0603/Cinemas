import { Suspense } from "react";
import { SearchClient } from "./search-client";

export const metadata = { title: "Tìm kiếm" };

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-8 text-surface-400 lg:px-6">
          Đang tìm…
        </div>
      }
    >
      <SearchClient />
    </Suspense>
  );
}
