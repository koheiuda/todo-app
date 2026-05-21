import { KpiCard } from "@/components/accounting/kpi-card";
import { PageHeader } from "@/components/accounting/page-header";
import {
  getCurrentFiscalPeriod,
  getMonthlySummary,
  listMonthlySummariesByPeriod,
} from "@/lib/accounting/queries";
import { formatYearMonth } from "@/lib/accounting/utils";
import Link from "next/link";

export const metadata = { title: "ダッシュボード | Mesut 会計管理" };
export const dynamic = "force-dynamic";

function currentYearMonth(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

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
  const currentYm = currentYearMonth();
  const currentMonth = await getMonthlySummary(currentYm);

  const revenueTotal = months.reduce((s, m) => s + m.revenueInclTax, 0);
  const expenseTotal = months.reduce((s, m) => s + m.totalExpense, 0);
  const profitTotal = revenueTotal - expenseTotal;
  const rateTotal = revenueTotal
    ? (profitTotal / revenueTotal) * 100
    : 0;

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

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-neutral-700">
            当月: {formatYearMonth(currentYm)}
          </h2>
          <Link
            href={`/accounting/months/${currentYm}`}
            className="text-xs text-blue-700 hover:underline"
          >
            月次詳細を見る →
          </Link>
        </div>
        {currentMonth ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <KpiCard label="売上（税込）" value={currentMonth.revenueInclTax} />
            <KpiCard label="支出" value={currentMonth.totalExpense} />
            <KpiCard
              label="粗利"
              value={currentMonth.grossProfit}
              tone="positive"
            />
            <KpiCard
              label="粗利率"
              value={`${(Number(currentMonth.grossMarginRate) * 100).toFixed(1)}%`}
            />
          </div>
        ) : (
          <p className="text-sm text-neutral-500">
            当月データはまだありません。
          </p>
        )}
        {currentMonth?.memo ? (
          <p className="mt-3 text-sm text-neutral-600 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
            メモ: {currentMonth.memo}
          </p>
        ) : null}
      </section>
    </div>
  );
}
