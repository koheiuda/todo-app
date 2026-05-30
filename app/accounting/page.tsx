import { KpiCard } from "@/components/accounting/kpi-card";
import { MonthlyTrendChart } from "@/components/accounting/monthly-trend-chart";
import { PageHeader } from "@/components/accounting/page-header";
import {
  getCurrentFiscalPeriod,
  listMonthlySummariesByPeriod,
} from "@/lib/accounting/queries";
import { formatYearMonth, formatYen } from "@/lib/accounting/utils";
import Link from "next/link";

export const metadata = { title: "ダッシュボード | Mesut 会計管理" };
export const dynamic = "force-dynamic";

export default async function AccountingDashboardPage() {
  const period = await getCurrentFiscalPeriod();
  if (!period) {
    return (
      <div className="max-w-3xl">
        <PageHeader title="ダッシュボード" />
        <div className="bg-amber-50 border border-amber-200 rounded-md p-4 text-sm text-amber-900">
          <p className="font-medium">決算期が登録されていません</p>
          <p className="mt-2">
            <Link href="/accounting/import" className="underline">
              データ移行
            </Link>{" "}
            からスプシを取り込むか、シードスクリプトを実行してください。
          </p>
        </div>
      </div>
    );
  }

  const months = await listMonthlySummariesByPeriod(period.id);

  const revenueTotal = months.reduce((s, m) => s + m.revenueInclTax, 0);
  const expenseTotal = months.reduce((s, m) => s + m.totalExpense, 0);
  const profitTotal = revenueTotal - expenseTotal;
  const rateTotal = revenueTotal
    ? (profitTotal / revenueTotal) * 100
    : 0;

  const trendData = months.map((m) => ({
    label: `${parseInt(m.yearMonth.split("-")[1], 10)}月`,
    revenue: m.revenueInclTax,
    expense: m.totalExpense,
    profit: m.grossProfit,
  }));

  return (
    <div className="max-w-6xl">
      <PageHeader
        title="ダッシュボード"
        description={`${period.name}（${period.startDate} 〜 ${period.endDate}）の進捗`}
      />

      <section className="mb-10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-neutral-700">
            {period.name} 累計
          </h2>
          <Link
            href={`/accounting/periods/${period.id}`}
            className="text-xs text-blue-700 hover:underline"
          >
            期詳細を見る →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KpiCard label="売上（税込）" value={revenueTotal} />
          <KpiCard label="支出合計" value={expenseTotal} />
          <KpiCard label="粗利" value={profitTotal} tone="positive" />
          <KpiCard
            label="粗利率"
            value={`${rateTotal.toFixed(1)}%`}
            tone="positive"
          />
        </div>
      </section>

      <section className="mb-10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-neutral-700">
            月次収支（{period.name}）
          </h2>
          <Link
            href="/accounting/months"
            className="text-xs text-blue-700 hover:underline"
          >
            全期間を見る →
          </Link>
        </div>

        {months.length === 0 ? (
          <div className="bg-white rounded-xl border border-neutral-200 p-8 text-center text-sm text-neutral-400">
            月次データがありません
          </div>
        ) : (
          <div className="space-y-4">
            <MonthlyTrendChart data={trendData} />

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
                  </tr>
                </thead>
                <tbody>
                  {months.map((m) => (
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
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-neutral-50 border-t-2 border-neutral-200">
                  <tr className="font-semibold">
                    <td className="px-4 py-2.5 text-neutral-900">累計</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {formatYen(revenueTotal)}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {formatYen(expenseTotal)}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-emerald-700">
                      {formatYen(profitTotal)}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {rateTotal.toFixed(1)}%
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
