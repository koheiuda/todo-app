"use client";

import { useState, useTransition } from "react";
import { importMonth, type ImportResult } from "../actions";

export function ImportCard({
  month,
  yearMonth,
  sheetIdEnv,
  enabled,
}: {
  month: string;
  yearMonth: string;
  sheetIdEnv: string;
  enabled: boolean;
}) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function run() {
    if (!confirm(`${month}のデータを取り込みます。既存データに上書きされる可能性があります。実行しますか？`)) return;
    setError(null);
    setResult(null);
    start(async () => {
      try {
        const r = await importMonth(yearMonth);
        setResult(r);
      } catch (e) {
        setError(e instanceof Error ? e.message : "取り込みに失敗しました");
      }
    });
  }

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-neutral-900">{month}</p>
          <p className="text-xs text-neutral-500 mt-1">
            スプシID環境変数: <code>{sheetIdEnv}</code>
          </p>
        </div>
        <button
          type="button"
          disabled={!enabled || pending}
          onClick={run}
          className="text-sm px-4 py-2 rounded-md bg-neutral-900 text-white disabled:bg-neutral-200 disabled:text-neutral-400 disabled:cursor-not-allowed hover:bg-neutral-800"
        >
          {pending ? "取り込み中..." : "取り込む"}
        </button>
      </div>

      {error ? (
        <div className="mt-3 text-xs bg-rose-50 border border-rose-200 rounded p-3 text-rose-900">
          {error}
        </div>
      ) : null}

      {result ? (
        <div className="mt-3 text-xs bg-emerald-50 border border-emerald-200 rounded p-3 text-emerald-900 space-y-1">
          <p className="font-medium">取り込み完了：{result.periodName} / {result.yearMonth}</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>請求書: {result.invoicesInserted}件追加（{result.invoicesSkipped}件スキップ）</li>
            <li>外注費: {result.outsourcingInserted}件追加</li>
            <li>請求先マスタ: {result.clientsCreated}件新規作成</li>
            {result.summary ? (
              <li>
                月次サマリー: 売上 ¥{result.summary.revenueInclTax.toLocaleString()} /
                支出 ¥{result.summary.totalExpense.toLocaleString()} /
                粗利率 {(result.summary.grossMarginRate * 100).toFixed(1)}%
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
