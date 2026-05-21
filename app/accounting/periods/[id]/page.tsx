import { PageHeader } from "@/components/accounting/page-header";
import {
  getFiscalPeriod,
  listMonthlySummariesByPeriod,
} from "@/lib/accounting/queries";
import { formatYearMonth, formatYen } from "@/lib/accounting/utils";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PeriodDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const period = await getFiscalPeriod(id);
  if (!period) notFound();

  const months = await listMonthlySummariesByPeriod(id);
  const revenueTotal = months.reduce((s, m) => s + m.revenueInclTax, 0);
  const expenseTotal = months.reduce((s, m) => s + m.totalExpense, 0);
  const profitTotal = revenueTotal - expenseTotal;
  const rateTotal = revenueTotal ? (profitTotal / revenueTotal) * 100 : 0;

  return (
    <div className="max-w-6xl">
      <PageHeader
        title={`${period.name} 月次管理`}
        description={`${period.startDate} 〜 ${period.endDate}`}
      />

      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-neutral-600 w-32">
                年月
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
              <th className="text-right px-4 py-3 font-medium text-neutral-600 w-24">
                粗利率
              </th>
              <th className="text-left px-4 py-3 font-medium text-neutral-600">
                メモ
              </th>
            </tr>
          </thead>
          <tbody>
            {months.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-neutral-400"
                >
                  月次データがありません
                </td>
              </tr>
            ) : (
              months.map((m) => (
                <tr
                  key={m.id}
                  className="border-b border-neutral-100 hover:bg-neutral-50"
                >
                  <td className="px-4 py-3 font-medium">
                    <Link
                      href={`/accounting/months/${m.yearMonth}`}
                      className="text-neutral-900 hover:text-blue-700"
                    >
                      {formatYearMonth(m.yearMonth)}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatYen(m.revenueInclTax)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatYen(m.totalExpense)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-emerald-700 font-medium">
                    {formatYen(m.grossProfit)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {(Number(m.grossMarginRate) * 100).toFixed(1)}%
                  </td>
                  <td className="px-4 py-3 text-neutral-600 text-xs">
                    {m.memo ?? "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {months.length > 0 ? (
            <tfoot className="bg-neutral-50 border-t-2 border-neutral-200">
              <tr className="font-semibold">
                <td className="px-4 py-3 text-neutral-900">合計</td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {formatYen(revenueTotal)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {formatYen(expenseTotal)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-emerald-700">
                  {formatYen(profitTotal)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {rateTotal.toFixed(1)}%
                </td>
                <td />
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>
    </div>
  );
}
