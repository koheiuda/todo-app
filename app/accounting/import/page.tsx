import { PageHeader } from "@/components/accounting/page-header";
import { ImportCard } from "./_components/import-card";

export const metadata = { title: "データ移行 | Mesut 会計管理" };
export const dynamic = "force-dynamic";

export default function ImportPage() {
  const enabled = process.env.ENABLE_IMPORT === "true";

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="データ移行"
        description="Googleスプレッドシートから2026年4月・5月のデータを取り込みます"
      />

      {!enabled ? (
        <div className="mb-6 text-sm text-neutral-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
          <strong>無効化中：</strong> 環境変数 <code>ENABLE_IMPORT=true</code>{" "}
          を設定すると操作可能になります（移行完了後は false に戻して無効化）。
        </div>
      ) : null}

      <div className="space-y-4">
        <ImportCard
          month="2026年4月"
          yearMonth="2026-04"
          sheetIdEnv="SHEETS_INVOICE_2026_04_ID"
          enabled={enabled}
        />
        <ImportCard
          month="2026年5月"
          yearMonth="2026-05"
          sheetIdEnv="SHEETS_INVOICE_2026_05_ID"
          enabled={enabled}
        />
      </div>

      <div className="mt-8 text-xs text-neutral-500 leading-relaxed space-y-2">
        <p>
          ※ サービスアカウントの認証情報（
          <code>GOOGLE_SERVICE_ACCOUNT_EMAIL</code> /{" "}
          <code>GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY</code>）が必要です。
        </p>
        <p>
          ※ サービスアカウントのメアドに対し、対象スプシで「閲覧者」以上の共有権限を付与してください。
        </p>
        <p>
          ※ 同一クライアント・同額の請求書が既に存在する場合はスキップされます（重複防止）。
        </p>
      </div>
    </div>
  );
}
