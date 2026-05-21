import { PageHeader } from "@/components/accounting/page-header";
import {
  listFiscalPeriods,
  listMonthlySummariesByPeriod,
} from "@/lib/accounting/queries";
import { formatYen } from "@/lib/accounting/utils";
import Link from "next/link";

export const metadata = { title: "期別一覧 | Mesut 会計管理" };
export const dynamic = "force-dynamic";

export default async function PeriodsPage() {
  const periods = await listFiscalPeriods();
  const periodSummaries = await Promise.all(
    periods.map(async (p) => {
      const months = await listMonthlySummariesByPeriod(p.id);
      const revenue = months.reduce((s, m) => s + m.revenueInclTax, 0);
      const expense = months.reduce((s, m) => s + m.totalExpense, 0);
      return {
        ...p,
        revenue,
        expense,
        profit: revenue - expense,
        rate: revenue ? ((revenue - expense) / revenue) * 100 : 0,
      };
    }),
  );

  return (
    <div className="max-w-5xl">
      <PageHeader title="期別一覧" description="決算期ごとの累計サマリー" />

      {periods.length === 0 ? (
        <p className="text-sm text-neutral-500">
          まだ決算期が登録されていません。
        </p>
      ) : (
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-neutral-600">
                  期
                </th>
                <th className="text-left px-4 py-3 font-medium text-neutral-600">
                  期間
                </th>
                <th className="text-right px-4 py-3 font-medium text-neutral-600">
                  売上（税込）
                </th>
                <th className="text-right px-4 py-3 font-medium text-neutral-600">
                  支出
                </th>
                <th className="text-right px-4 py-3 font-medium text-neutral-600">
                  粗利
                </th>
                <th className="text-right px-4 py-3 font-medium text-neutral-600">
                  粗利率
                </th>
                <th className="w-16" />
              </tr>
            </thead>
            <tbody>
              {periodSummaries.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-neutral-100 last:border-b-0 hover:bg-neutral-50"
                >
                  <td className="px-4 py-3 font-medium text-neutral-900">
                    {p.name}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {p.startDate} 〜 {p.endDate}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatYen(p.revenue)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatYen(p.expense)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-emerald-700 font-medium">
                    {formatYen(p.profit)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {p.rate.toFixed(1)}%
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/accounting/periods/${p.id}`}
                      className="text-xs text-blue-700 hover:underline"
                    >
                      詳細
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
