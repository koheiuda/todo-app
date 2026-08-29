"use client";

import type { TransferLine, TransferPlan } from "@/lib/accounting/transfer/build";
import { formatYen } from "@/lib/accounting/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

export interface PastBatch {
  id: string;
  transferDate: string;
  itemCount: number;
  totalAmount: number;
  createdAt: string;
}

/**
 * 既定の振込指定日は「対象月の翌月末」。
 * 請求側の支払期日（actions.ts の dueDateFor）と同じ締めに合わせている。
 */
function defaultTransferDate(yearMonth: string): string {
  const [y, m] = yearMonth.split("-").map((v) => parseInt(v, 10));
  // m は1始まり。new Date(y, m + 1, 0) で「翌月の末日」になる。
  const lastDay = new Date(y, m + 1, 0);
  return (
    `${lastDay.getFullYear()}-` +
    `${String(lastDay.getMonth() + 1).padStart(2, "0")}-` +
    `${String(lastDay.getDate()).padStart(2, "0")}`
  );
}

function accountLabel(line: TransferLine): string {
  const a = line.account;
  if (!a) return "口座未登録";
  const kind =
    a.depositType === "checking"
      ? "当座"
      : a.depositType === "savings"
        ? "貯蓄"
        : a.depositType === "other"
          ? "その他"
          : "普通";
  return `${a.bankCode}-${a.branchCode} ${kind} ${a.accountNumber}`;
}

export function BulkTransferButton({
  yearMonth,
  plan,
  pastBatches,
  migrationPending = false,
}: {
  yearMonth: string;
  plan: TransferPlan;
  pastBatches: PastBatch[];
  /** 振込用テーブルが未作成（マイグレーション未実行）か。 */
  migrationPending?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [transferDate, setTransferDate] = useState(() =>
    defaultTransferDate(yearMonth),
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  const canSubmit =
    !migrationPending &&
    plan.ready.length > 0 &&
    plan.remitterErrors.length === 0 &&
    !pending;

  function download() {
    setError(null);
    start(async () => {
      const res = await fetch(`/api/accounting/transfers/${yearMonth}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transferDate }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "振込ファイルの作成に失敗しました");
        return;
      }

      // Content-Disposition のファイル名をそのまま使って保存させる。
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const match = /filename\*=UTF-8''([^;]+)/.exec(disposition);
      const filename = match
        ? decodeURIComponent(match[1])
        : `総合振込_${yearMonth}.txt`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setOpen(false);
      toast.success(
        `振込ファイルを作成しました（${plan.ready.length}件 / ${formatYen(plan.totalAmount)}）`,
      );
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        className="text-sm px-4 py-2 rounded border border-neutral-300 text-neutral-700 hover:bg-neutral-50"
        title="外注費をまとめて総合振込ファイルに書き出します"
      >
        一括振込
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !pending) setOpen(false);
          }}
        >
          <div className="w-full max-w-2xl max-h-[90vh] overflow-auto rounded-lg bg-white p-5 shadow-xl text-left">
            <div className="flex items-start justify-between mb-1">
              <h2 className="text-base font-semibold text-neutral-900">
                振込内容確認
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={pending}
                className="text-xs text-neutral-500 hover:text-neutral-900"
              >
                閉じる
              </button>
            </div>
            <p className="text-xs text-neutral-500 mb-4">
              総合振込（全銀フォーマット）のファイルを作成します。GMOあおぞらネット銀行に
              アップロードして承認するまで、出金は発生しません。
            </p>

            {migrationPending ? (
              <div className="mb-4 text-xs bg-amber-50 border border-amber-200 rounded px-3 py-2 text-amber-900">
                <div className="font-medium mb-1">
                  振込機能のセットアップが済んでいません
                </div>
                振込先口座を保存するテーブルがまだ作成されていません。
                次のコマンドを実行してください。
                <pre className="mt-1.5 bg-white/70 border border-amber-200 rounded px-2 py-1 overflow-x-auto text-[11px]">
                  npx tsx --env-file=.env.local
                  scripts/migrate-add-payee-accounts.ts --apply
                </pre>
              </div>
            ) : null}

            {pastBatches.length > 0 ? (
              <div className="mb-4 text-xs bg-amber-50 border border-amber-200 rounded px-3 py-2 text-amber-900">
                <span className="font-medium">この月は既に書き出し済みです。</span>
                {pastBatches.slice(0, 3).map((b) => (
                  <div key={b.id} className="mt-0.5 tabular-nums">
                    {b.transferDate} — {b.itemCount}件 / {formatYen(b.totalAmount)}
                  </div>
                ))}
                <div className="mt-1">
                  二重に振り込まないよう、銀行側の予約状況を確認してください。
                </div>
              </div>
            ) : null}

            {plan.remitterErrors.length > 0 ? (
              <div className="mb-4 text-xs bg-rose-50 border border-rose-200 rounded px-3 py-2 text-rose-900">
                <div className="font-medium mb-1">
                  振込元（自社口座）の設定が足りません
                </div>
                <ul className="list-disc pl-4 space-y-0.5">
                  {plan.remitterErrors.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
                <Link
                  href="/accounting/company"
                  className="inline-block mt-1.5 underline hover:no-underline"
                >
                  会社設定を開く →
                </Link>
              </div>
            ) : null}

            {plan.ready.length > 0 ? (
              <div className="mb-4 border border-neutral-200 rounded overflow-hidden">
                <table className="w-full text-[13px]">
                  <thead className="bg-neutral-50 border-b border-neutral-200">
                    <tr>
                      <th className="text-left px-3 py-1.5 font-medium text-neutral-600">
                        振込先
                      </th>
                      <th className="text-left px-2 py-1.5 font-medium text-neutral-600">
                        口座
                      </th>
                      <th className="text-right px-3 py-1.5 font-medium text-neutral-600">
                        金額
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {plan.ready.map((line) => (
                      <tr
                        key={line.outsourcingId}
                        className="border-b border-neutral-100 last:border-b-0"
                      >
                        <td className="px-3 py-1.5">
                          <div className="text-neutral-900">
                            {line.contractorName}
                          </div>
                          <div className="text-[11px] text-neutral-500">
                            {line.account?.payeeNameKana}
                          </div>
                        </td>
                        <td className="px-2 py-1.5 text-[11px] text-neutral-500 tabular-nums whitespace-nowrap">
                          {accountLabel(line)}
                        </td>
                        <td className="px-3 py-1.5 text-right tabular-nums text-neutral-900">
                          {formatYen(line.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mb-4 text-sm text-neutral-500">
                振込できる明細がありません。
              </p>
            )}

            {plan.blocked.length > 0 ? (
              <div className="mb-4 text-xs bg-neutral-50 border border-neutral-200 rounded px-3 py-2">
                <div className="font-medium text-neutral-800 mb-1">
                  次の{plan.blocked.length}件はこのファイルに含まれません
                </div>
                <ul className="space-y-1">
                  {plan.blocked.map((line) => (
                    <li key={line.outsourcingId} className="text-neutral-600">
                      <span className="text-neutral-900">
                        {line.contractorName}
                      </span>
                      （{formatYen(line.amount)}）— {line.errors.join(" / ")}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/accounting/payees"
                  className="inline-block mt-1.5 underline hover:no-underline text-neutral-700"
                >
                  振込先口座を登録する →
                </Link>
              </div>
            ) : null}

            <div className="flex items-end justify-between gap-4 mb-4">
              <label className="block">
                <span className="text-xs text-neutral-600 mb-1 block">
                  振込指定日
                </span>
                <input
                  type="date"
                  value={transferDate}
                  onChange={(e) => setTransferDate(e.target.value)}
                  className="text-[13px] px-2 py-1.5 border border-neutral-300 rounded"
                />
              </label>
              <div className="text-right">
                <div className="text-xs text-neutral-500">
                  合計（{plan.ready.length}件）
                </div>
                <div className="text-xl font-semibold tabular-nums text-neutral-900">
                  {formatYen(plan.totalAmount)}
                </div>
              </div>
            </div>

            {error ? (
              <p className="text-xs text-rose-700 mb-3">{error}</p>
            ) : null}

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={pending}
                className="text-xs px-3 py-1.5 text-neutral-600 hover:text-neutral-900"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={download}
                disabled={!canSubmit}
                className="text-xs px-4 py-1.5 rounded bg-neutral-900 text-white hover:bg-neutral-800 disabled:bg-neutral-300"
              >
                {pending ? "作成中..." : "振込ファイルを作成"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
