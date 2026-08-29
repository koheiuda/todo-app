import { KpiCard } from "@/components/accounting/kpi-card";
import { PageHeader } from "@/components/accounting/page-header";
import {
  getMonthlySummary,
  listClients,
  listInvoicesByMonth,
  listLineItemsByInvoiceIds,
  listOutsourcingByMonth,
} from "@/lib/accounting/queries";
import { formatYearMonth, formatYen } from "@/lib/accounting/utils";
import Link from "next/link";
import {
  getTransferPlan,
  listTransferBatches,
} from "@/lib/accounting/transfer/queries";
import { AddInvoiceRow } from "./_components/add-invoice-row";
import { AddOutsourcingRow } from "./_components/add-outsourcing-row";
import { BulkTransferButton } from "./_components/bulk-transfer-button";
import { CopyPreviousMonthButton } from "./_components/copy-previous-month-button";
import { InvoiceTableBody } from "./_components/invoice-table-body";
import { OutsourcingTableBody } from "./_components/outsourcing-table-body";

export const dynamic = "force-dynamic";

function shiftMonth(ym: string, delta: number): string {
  const [y, m] = ym.split("-").map((s) => parseInt(s, 10));
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default async function MonthDetailPage({
  params,
}: {
  params: Promise<{ ym: string }>;
}) {
  const { ym } = await params;
  const [summary, invoices, outsourcing, clients] = await Promise.all([
    getMonthlySummary(ym),
    listInvoicesByMonth(ym),
    listOutsourcingByMonth(ym),
    listClients({ onlyActive: true }),
  ]);
  const lineItemsByInvoice = await listLineItemsByInvoiceIds(
    invoices.map((i) => i.id),
  );
  const [{ plan: transferPlan, migrationPending }, transferBatches] =
    await Promise.all([getTransferPlan(ym), listTransferBatches(ym)]);

  const revenueInclTotal = invoices.reduce((s, i) => s + i.amountInclTax, 0);
  const revenueExclTotal = invoices.reduce((s, i) => s + i.amountExclTax, 0);
  const outsourcingTotal = outsourcing.reduce(
    (s, o) => s + o.amountInclTax,
    0,
  );
  const profit = revenueInclTotal - outsourcingTotal;

  const prevYm = shiftMonth(ym, -1);
  const nextYm = shiftMonth(ym, 1);

  // 当月が完全に空のときだけ「前月コピー」を提案（前月にデータがある場合のみ）
  const isEmpty = invoices.length === 0 && outsourcing.length === 0;
  let canCopyFromPrev = false;
  if (isEmpty) {
    const [prevInv, prevOut] = await Promise.all([
      listInvoicesByMonth(prevYm),
      listOutsourcingByMonth(prevYm),
    ]);
    canCopyFromPrev = prevInv.length > 0 || prevOut.length > 0;
  }

  return (
    <div>
      <PageHeader
        title={formatYearMonth(ym)}
        description="月次収支（請求先 / 外注費）"
        actions={
          <div className="flex items-center gap-1">
            <Link
              href={`/accounting/months/${prevYm}`}
              className="text-xs px-3 py-1.5 rounded border border-neutral-300 text-neutral-700 hover:bg-neutral-50"
            >
              ← {formatYearMonth(prevYm)}
            </Link>
            <Link
              href="/accounting/months"
              className="text-xs px-3 py-1.5 rounded border border-neutral-300 text-neutral-700 hover:bg-neutral-50"
            >
              一覧
            </Link>
            <Link
              href={`/accounting/months/${nextYm}`}
              className="text-xs px-3 py-1.5 rounded border border-neutral-300 text-neutral-700 hover:bg-neutral-50"
            >
              {formatYearMonth(nextYm)} →
            </Link>
          </div>
        }
      />

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 max-w-3xl">
        <KpiCard label="請求額（税込）" value={revenueInclTotal} />
        <KpiCard label="支出" value={outsourcingTotal} />
        <KpiCard label="利益" value={profit} tone="positive" />
      </section>

      {summary?.memo ? (
        <div className="mb-8 text-sm text-neutral-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
          <span className="font-medium">メモ：</span>
          {summary.memo}
        </div>
      ) : null}

      {canCopyFromPrev ? (
        <div className="mb-8 flex items-center justify-between gap-4 bg-blue-50 border border-blue-200 rounded-md px-4 py-3">
          <p className="text-sm text-blue-900">
            まだ入力がありません。
            <span className="font-medium">{formatYearMonth(prevYm)}</span>
            の請求先・外注費をそのままコピーして、見込みの叩き台にできます。
          </p>
          <CopyPreviousMonthButton
            yearMonth={ym}
            prevLabel={formatYearMonth(prevYm)}
          />
        </div>
      ) : null}

      <section className="mb-10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[13px] font-semibold text-neutral-700">請求先</h2>
          <AddInvoiceRow yearMonth={ym} clients={clients} />
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="text-center px-2 py-2 font-medium text-neutral-600 w-10 border-r border-neutral-200 whitespace-nowrap">
                  No
                </th>
                <th className="text-left px-3 py-2 font-medium text-neutral-600 border-r border-neutral-200 min-w-[180px] whitespace-nowrap">
                  請求先
                </th>
                <th className="text-right px-2 py-2 font-medium text-neutral-600 border-r border-neutral-200 min-w-[110px] whitespace-nowrap">
                  税込
                </th>
                <th className="text-right px-2 py-2 font-medium text-neutral-600 border-r border-neutral-200 min-w-[110px] whitespace-nowrap">
                  金額
                </th>
                <th className="text-center px-2 py-2 font-medium text-neutral-600 border-r border-neutral-200 min-w-[150px] whitespace-nowrap">
                  PDF
                </th>
                <th className="text-center px-2 py-2 font-medium text-neutral-600 w-12 border-r border-neutral-200 whitespace-nowrap">
                  送付
                </th>
                <th className="text-center px-2 py-2 font-medium text-neutral-600 w-12 border-r border-neutral-200 whitespace-nowrap">
                  振込
                </th>
                <th className="text-left px-2 py-2 font-medium text-neutral-600 min-w-[280px] whitespace-nowrap">
                  項目
                </th>
                <th className="text-right px-2 py-2 font-medium text-neutral-600 min-w-[100px] whitespace-nowrap">
                  単価
                </th>
                <th className="text-right px-2 py-2 font-medium text-neutral-600 min-w-[60px] whitespace-nowrap">
                  個
                </th>
                <th className="text-left px-2 py-2 font-medium text-neutral-600 min-w-[60px] whitespace-nowrap">
                  単位
                </th>
                <th className="text-right px-2 py-2 font-medium text-neutral-600 min-w-[110px] whitespace-nowrap">
                  合計
                </th>
                <th className="text-left px-2 py-2 font-medium text-neutral-600 w-[100px] border-l border-neutral-200 whitespace-nowrap">
                  メモ
                </th>
                <th className="text-right px-2 py-2 font-medium text-neutral-600 w-14 border-l border-neutral-200 whitespace-nowrap">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr>
                  <td
                    colSpan={14}
                    className="px-3 py-8 text-center text-neutral-400"
                  >
                    請求先がありません
                  </td>
                </tr>
              ) : (
                <InvoiceTableBody
                  key={invoices.map((i) => i.id).slice().sort().join("|")}
                  yearMonth={ym}
                  invoices={invoices}
                  lineItemsByInvoice={lineItemsByInvoice}
                />
              )}
            </tbody>
            {invoices.length > 0 ? (
              <tfoot className="bg-neutral-50 border-t-2 border-neutral-200">
                <tr className="font-semibold">
                  <td className="px-3 py-2 text-right text-[15px]" colSpan={2}>
                    合計金額
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums border-r border-neutral-200 text-[15px]">
                    {formatYen(revenueInclTotal)}
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums text-neutral-600 border-r border-neutral-200 text-[15px]">
                    {formatYen(revenueExclTotal)}
                  </td>
                  <td colSpan={10} />
                </tr>
              </tfoot>
            ) : null}
          </table>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[13px] font-semibold text-neutral-700">外注費</h2>
          <div className="flex items-center gap-2">
            <BulkTransferButton
              yearMonth={ym}
              plan={transferPlan}
              migrationPending={migrationPending}
              pastBatches={transferBatches.map((b) => ({
                id: b.id,
                transferDate: b.transferDate,
                itemCount: b.itemCount,
                totalAmount: b.totalAmount,
                createdAt: b.createdAt.toISOString(),
              }))}
            />
            <AddOutsourcingRow yearMonth={ym} />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 overflow-x-auto max-w-3xl">
          <table className="w-full text-[13px]">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="text-center px-2 py-2 font-medium text-neutral-600 w-10 whitespace-nowrap">
                  No
                </th>
                <th className="text-left px-3 py-2 font-medium text-neutral-600 min-w-[180px] whitespace-nowrap">
                  外注費
                </th>
                <th className="text-right px-2 py-2 font-medium text-neutral-600 min-w-[110px] whitespace-nowrap">
                  税込
                </th>
                <th className="text-left px-2 py-2 font-medium text-neutral-600 min-w-[200px] whitespace-nowrap">
                  メモ
                </th>
                <th className="text-right px-2 py-2 w-14" aria-label="操作" />
              </tr>
            </thead>
            <tbody>
              {outsourcing.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-8 text-center text-neutral-400"
                  >
                    外注費がありません
                  </td>
                </tr>
              ) : (
                <OutsourcingTableBody
                  key={outsourcing.map((o) => o.id).slice().sort().join("|")}
                  yearMonth={ym}
                  rows={outsourcing}
                />
              )}
            </tbody>
            {outsourcing.length > 0 ? (
              <tfoot className="bg-neutral-50 border-t-2 border-neutral-200">
                <tr className="font-semibold">
                  <td className="px-3 py-2 text-right text-[15px]" colSpan={2}>
                    合計金額
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums text-[15px]">
                    {formatYen(outsourcingTotal)}
                  </td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            ) : null}
          </table>
        </div>
      </section>
    </div>
  );
}
