import type { ProductSpecs } from "@/types";

const labels: Record<keyof ProductSpecs, string> = {
  cpu: "CPU",
  ram: "RAM",
  storage: "Ổ cứng",
  gpu: "GPU",
  display: "Màn hình",
  battery: "Pin",
  weight: "Khối lượng",
};

export function SpecTable({ specs }: { specs: ProductSpecs }) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/5">
      <table className="w-full text-sm">
        <tbody>
          {(Object.keys(labels) as (keyof ProductSpecs)[]).map((key, i) => (
            <tr
              key={key}
              className={i % 2 === 0 ? "bg-surface-900/80" : "bg-surface-950/40"}
            >
              <th className="w-1/3 px-4 py-3 text-left font-medium text-surface-400">
                {labels[key]}
              </th>
              <td className="px-4 py-3 text-surface-100">{specs[key]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
