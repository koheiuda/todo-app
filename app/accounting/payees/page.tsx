import { PageHeader } from "@/components/accounting/page-header";
import { listPayeeAccounts } from "@/lib/accounting/transfer/queries";
import { PayeeList } from "./_components/payee-list";

export const dynamic = "force-dynamic";

export default async function PayeesPage() {
  const accounts = await listPayeeAccounts();

  return (
    <div>
      <PageHeader
        title="振込先口座"
        description="外注費の総合振込に使う口座。外注先名は外注費の名称と一致させると自動で紐付きます。"
      />

      <div className="mb-6 text-xs text-neutral-600 bg-blue-50 border border-blue-200 rounded-md px-3 py-2 max-w-3xl">
        受取人名は通帳の表記どおりに入力してください。全銀フォーマットは半角カナ30文字までで、
        濁点・半濁点も1文字と数えます。入力欄の下に実際の表記と文字数が出ます。
      </div>

      <PayeeList accounts={accounts} />
    </div>
  );
}
