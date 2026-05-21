import { PageHeader } from "@/components/accounting/page-header";
import { StatusBadge } from "@/components/accounting/status-badge";
import { listAllInvoices } from "@/lib/accounting/queries";
import { formatYearMonth, formatYen } from "@/lib/accounting/utils";
import Link from "next/link";

export const metadata = { title: "請求書一覧 | Mesut 会計管理" };
export const dynamic = "force-dynamic";

export default async function InvoicesPage() {
  const invoices = await listAllInvoices();

  return (
    <div className="max-w-6xl">
      <PageHeader
        title="請求書"
        description="発行済み・下書きの請求書一覧"
      />

      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              <th className="text-left px-3 py-2 font-medium text-neutral-600 w-32">
                請求書番号
              </th>
              <th className="text-left px-3 py-2 font-medium text-neutral-600 w-24">
                対象月
              </th>
              <th className="text-left px-3 py-2 font-medium text-neutral-600">
                請求先
              </th>
              <th className="text-right px-3 py-2 font-medium text-neutral-600 w-32">
                金額（税込）
              </th>
              <th className="text-center px-3 py-2 font-medium text-neutral-600 w-28">
                ステータス
              </th>
              <th className="text-left px-3 py-2 font-medium text-neutral-600 w-24">
                発行日
              </th>
              <th className="text-center px-3 py-2 font-medium text-neutral-600 w-24">
                PDF
              </th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-neutral-400"
                >
                  請求書がありません
                </td>
              </tr>
            ) : (
              invoices.map((inv) => (
                <tr
                  key={inv.id}
                  className="border-b border-neutral-100 last:border-b-0 hover:bg-neutral-50"
                >
                  <td className="px-3 py-2 font-mono text-xs text-neutral-700">
                    <Link
                      href={`/accounting/months/${inv.yearMonth}`}
                      className="hover:underline"
                    >
                      {inv.invoiceNumber}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-neutral-700">
                    {formatYearMonth(inv.yearMonth)}
                  </td>
                  <td className="px-3 py-2 text-neutral-900">
                    {inv.client?.name ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {formatYen(inv.amountInclTax)}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <StatusBadge status={inv.status} />
                  </td>
                  <td className="px-3 py-2 text-xs text-neutral-600">
                    {inv.issueDate}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {inv.pdfUrl ? (
                      <a
                        href={`/api/accounting/invoices/${inv.id}/pdf`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-blue-700 hover:underline"
                      >
                        DL
                      </a>
                    ) : (
                      <span className="text-xs text-neutral-400">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
