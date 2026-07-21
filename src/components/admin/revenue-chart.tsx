"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { formatVnd } from "@/lib/constants";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export type RevenuePoint = {
  label: string;
  amount: number;
};

export function RevenueChart({ data }: { data: RevenuePoint[] }) {
  const chartData = {
    labels: data.map((d) => d.label),
    datasets: [
      {
        label: "Doanh thu",
        data: data.map((d) => d.amount),
        backgroundColor: "rgba(225, 29, 72, 0.55)",
        borderColor: "rgba(225, 29, 72, 1)",
        borderWidth: 1,
        borderRadius: 8,
        borderSkipped: false as const,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: { parsed: { y: number | null } }) =>
            formatVnd(ctx.parsed.y ?? 0),
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#9ca3af", font: { size: 11 } },
      },
      y: {
        grid: { color: "rgba(255,255,255,0.06)" },
        ticks: {
          color: "#9ca3af",
          font: { size: 11 },
          callback: (value: string | number) => {
            const n = Number(value);
            if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}tr`;
            if (n >= 1000) return `${Math.round(n / 1000)}k`;
            return String(n);
          },
        },
      },
    },
  };

  return (
    <div className="h-48 w-full sm:h-56">
      <Bar data={chartData} options={options} />
    </div>
  );
}
