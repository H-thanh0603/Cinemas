"use client";

import Image from "next/image";
import Link from "next/link";
import { getProductById } from "@/data";
import { useCompare } from "@/context/compare-context";
import { EmptyState, SectionHeading, Button } from "@/components/ui";
import { formatVnd } from "@/lib/format";
import { effectivePrice } from "@/lib/products";

const rows = [
  { key: "price", label: "Giá" },
  { key: "cpu", label: "CPU" },
  { key: "ram", label: "RAM" },
  { key: "storage", label: "Ổ cứng" },
  { key: "gpu", label: "GPU" },
  { key: "display", label: "Màn hình" },
  { key: "battery", label: "Pin" },
  { key: "weight", label: "Khối lượng" },
] as const;

export default function ComparePage() {
  const { ids, remove, hydrated } = useCompare();

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 text-surface-400 lg:px-6">
        Đang tải…
      </div>
    );
  }

  const list = ids
    .map((id) => getProductById(id))
    .filter(Boolean) as NonNullable<ReturnType<typeof getProductById>>[];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
      <SectionHeading
        title="So sánh laptop"
        subtitle="Tối đa 3 sản phẩm"
        action={
          <Link href="/products">
            <Button variant="secondary" size="sm">
              Thêm sản phẩm
            </Button>
          </Link>
        }
      />
      {list.length === 0 ? (
        <EmptyState
          title="Chưa có sản phẩm để so sánh"
          description="Bấm “So sánh” trên thẻ sản phẩm để thêm (tối đa 3)."
          actionHref="/products"
          actionLabel="Chọn laptop"
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/5">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-surface-900">
                <th className="px-4 py-4 text-left text-surface-500">Thông số</th>
                {list.map((p) => (
                  <th key={p.id} className="min-w-[200px] px-4 py-4 text-left">
                    <div className="relative mb-3 h-28 w-full overflow-hidden rounded-xl bg-surface-800">
                      {p.images[0] && (
                        <Image
                          src={p.images[0]}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="200px"
                        />
                      )}
                    </div>
                    <Link
                      href={`/products/${p.slug}`}
                      className="font-semibold text-white hover:text-brand-300"
                    >
                      {p.name}
                    </Link>
                    <div className="mt-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => remove(p.id)}
                      >
                        Gỡ
                      </Button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={row.key}
                  className={i % 2 === 0 ? "bg-surface-950/50" : "bg-surface-900/40"}
                >
                  <td className="px-4 py-3 font-medium text-surface-400">
                    {row.label}
                  </td>
                  {list.map((p) => (
                    <td key={p.id + row.key} className="px-4 py-3 text-surface-100">
                      {row.key === "price" ? (
                        <span className="text-brand-400 font-medium">
                          {formatVnd(effectivePrice(p))}
                          {p.salePrice != null && (
                            <span className="ml-2 text-xs text-surface-500 line-through">
                              {formatVnd(p.price)}
                            </span>
                          )}
                        </span>
                      ) : (
                        p.specs[row.key]
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
