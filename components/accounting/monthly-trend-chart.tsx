"use client";

import { formatYen } from "@/lib/accounting/utils";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type MonthlyTrendPoint = {
  label: string;
  revenue: number;
  expense: number;
  profit: number;
};

function formatAxisYen(value: number): string {
  if (Math.abs(value) >= 10000) {
    return `${Math.round(value / 10000)}万`;
  }
  return value.toLocaleString("ja-JP");
}

export function MonthlyTrendChart({ data }: { data: MonthlyTrendPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-neutral-200 p-8 text-center text-sm text-neutral-400">
        月次データがありません
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-4">
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart
          data={data}
          margin={{ top: 8, right: 8, bottom: 0, left: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12, fill: "#737373" }}
            tickLine={false}
            axisLine={{ stroke: "#e5e5e5" }}
          />
          <YAxis
            tickFormatter={formatAxisYen}
            tick={{ fontSize: 12, fill: "#737373" }}
            tickLine={false}
            axisLine={false}
            width={48}
          />
          <Tooltip
            formatter={(value, name) => [formatYen(Number(value)), name]}
            contentStyle={{
              fontSize: 12,
              borderRadius: 8,
              border: "1px solid #e5e5e5",
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="revenue" name="売上（税込）" fill="#93c5fd" radius={[4, 4, 0, 0]} />
          <Bar dataKey="expense" name="支出" fill="#fca5a5" radius={[4, 4, 0, 0]} />
          <Line
            dataKey="profit"
            name="粗利"
            type="monotone"
            stroke="#059669"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
