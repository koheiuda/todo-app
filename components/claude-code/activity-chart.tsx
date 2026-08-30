"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ActivityPoint } from "@/lib/claude-code/types";

export function ActivityChart({ data }: { data: ActivityPoint[] }) {
  const hasCommits = data.some((d) => d.total > 0);

  if (!hasCommits) {
    return (
      <div className="bg-white rounded-xl border border-neutral-200 p-8 text-center text-sm text-neutral-400">
        この期間のコミットはありません
      </div>
    );
  }

  const chartData = data.map((d) => ({
    label: d.label,
    Claude: d.claude,
    その他: Math.max(d.total - d.claude, 0),
  }));

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-4">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "#737373" }}
            tickLine={false}
            axisLine={{ stroke: "#e5e5e5" }}
            interval="preserveStartEnd"
            minTickGap={16}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11, fill: "#737373" }}
            tickLine={false}
            axisLine={false}
            width={32}
          />
          <Tooltip
            formatter={(value: number, name: string) => [`${value} 件`, name]}
            labelFormatter={(label: string) => `${label} のコミット`}
            contentStyle={{
              fontSize: 12,
              borderRadius: 8,
              border: "1px solid #e5e5e5",
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="Claude" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
          <Bar dataKey="その他" stackId="a" fill="#2d4fd4" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
