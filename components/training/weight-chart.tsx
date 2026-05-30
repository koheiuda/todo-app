"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type WeightPoint = { date: string; weight: number };

export function WeightChart({ data }: { data: WeightPoint[] }) {
  if (data.length < 2) {
    return (
      <div className="bg-white rounded-xl border border-neutral-200 p-8 text-center text-sm text-neutral-400">
        体重を2日以上記録すると推移グラフが表示されます
      </div>
    );
  }

  const weights = data.map((d) => d.weight);
  const min = Math.floor(Math.min(...weights) - 0.5);
  const max = Math.ceil(Math.max(...weights) + 0.5);

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-4">
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="date"
            tickFormatter={(d: string) => d.slice(5)} // MM-DD
            tick={{ fontSize: 12, fill: "#737373" }}
            tickLine={false}
            axisLine={{ stroke: "#e5e5e5" }}
          />
          <YAxis
            domain={[min, max]}
            tickFormatter={(v: number) => `${v}`}
            tick={{ fontSize: 12, fill: "#737373" }}
            tickLine={false}
            axisLine={false}
            width={36}
            unit="kg"
          />
          <Tooltip
            formatter={(value) => [`${Number(value).toFixed(1)}kg`, "体重"]}
            contentStyle={{
              fontSize: 12,
              borderRadius: 8,
              border: "1px solid #e5e5e5",
            }}
          />
          <Line
            dataKey="weight"
            name="体重"
            type="monotone"
            stroke="#2d4fd4"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
