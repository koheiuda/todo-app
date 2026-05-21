import { PageHeader } from "@/components/accounting/page-header";
import { listClients } from "@/lib/accounting/queries";
import { ClientRow } from "./_components/client-row";
import { NewClientPanel } from "./_components/new-client-button";

export const metadata = { title: "請求先マスタ | Mesut 会計管理" };
export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const clients = await listClients();

  return (
    <div className="max-w-5xl">
      <PageHeader
        title="請求先マスタ"
        description="請求書送付に必要な担当者・連絡先・住所などを登録"
      />

      <div className="mb-4 flex justify-end">
        <NewClientPanel />
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-neutral-600">
                請求先 / 連絡先
              </th>
              <th className="text-left px-4 py-3 font-medium text-neutral-600 w-20">
                敬称
              </th>
              <th className="text-center px-4 py-3 font-medium text-neutral-600 w-24">
                状態
              </th>
              <th className="text-right px-4 py-3 font-medium text-neutral-600 w-32">
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            {clients.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center text-neutral-400"
                >
                  請求先が登録されていません
                </td>
              </tr>
            ) : (
              clients.map((c) => <ClientRow key={c.id} client={c} />)
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
