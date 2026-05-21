import { PageHeader } from "@/components/accounting/page-header";
import {
  listFiscalPeriods,
  listMonthlySummariesByPeriod,
} from "@/lib/accounting/queries";
import { formatYearMonth, formatYen } from "@/lib/accounting/utils";
import Link from "next/link";

export const metadata = { title: "月次収支 | Mesut 会計管理" };
export const dynamic = "force-dynamic";

export default async function MonthsIndexPage() {
  const periods = await listFiscalPeriods();
  const grouped = await Promise.all(
    periods.map(async (p) => ({
      period: p,
      months: await listMonthlySummariesByPeriod(p.id),
    })),
  );
  const ordered = grouped.slice().reverse();

  return (
    <div className="max-w-5xl">
      <PageHeader
        title="月次収支"
        description="決算期ごとに月次収支を表示。月をクリックで詳細・編集"
      />

      <div className="space-y-8">
        {ordered.map(({ period, months }) => {
          const revenue = months.reduce(
            (s, m) => s + m.revenueInclTax,
            0,
          );
          const expense = months.reduce((s, m) => s + m.totalExpense, 0);
          const profit = revenue - expense;
          const rate = revenue ? (profit / revenue) * 100 : 0;

          return (
            <section key={period.id}>
              <div className="flex items-baseline justify-between mb-3">
                <h2 className="text-sm font-semibold text-neutral-700">
                  {period.name}（{period.startDate} 〜 {period.endDate}）
                </h2>
              </div>

              <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-neutral-50 border-b border-neutral-200">
                    <tr>
                      <th className="text-left px-4 py-2 font-medium text-neutral-600 w-32">
                        年月
                      </th>
                      <th className="text-right px-4 py-2 font-medium text-neutral-600">
                        売上（税込）
                      </th>
                      <th className="text-right px-4 py-2 font-medium text-neutral-600">
                        支出
                      </th>
                      <th className="text-right px-4 py-2 font-medium text-neutral-600">
                        粗利
                      </th>
                      <th className="text-right px-4 py-2 font-medium text-neutral-600 w-24">
                        粗利率
                      </th>
                      <th className="text-left px-4 py-2 font-medium text-neutral-600">
                        メモ
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {months.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-6 text-center text-neutral-400"
                        >
                          月次データなし
                        </td>
                      </tr>
                    ) : (
                      months.map((m) => (
                        <tr
                          key={m.id}
                          className="border-b border-neutral-100 last:border-b-0 hover:bg-neutral-50"
                        >
                          <td className="px-4 py-2.5 font-medium">
                            <Link
                              href={`/accounting/months/${m.yearMonth}`}
                              className="text-neutral-900 hover:text-blue-700"
                            >
                              {formatYearMonth(m.yearMonth)} →
                            </Link>
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums">
                            {formatYen(m.revenueInclTax)}
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums">
                            {formatYen(m.totalExpense)}
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-emerald-700 font-medium">
                            {formatYen(m.grossProfit)}
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums">
                            {(Number(m.grossMarginRate) * 100).toFixed(1)}%
                          </td>
                          <td className="px-4 py-2.5 text-neutral-600 text-xs truncate max-w-xs">
                            {m.memo ?? "—"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {months.length > 0 ? (
                    <tfoot className="bg-neutral-50 border-t-2 border-neutral-200">
                      <tr className="font-semibold">
                        <td className="px-4 py-2.5 text-neutral-900">
                          {period.name} 累計
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums">
                          {formatYen(revenue)}
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums">
                          {formatYen(expense)}
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-emerald-700">
                          {formatYen(profit)}
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums">
                          {rate.toFixed(1)}%
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  ) : null}
                </table>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
