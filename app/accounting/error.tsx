"use client";

import { useEffect } from "react";

export default function AccountingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const isDbError = /POSTGRES_URL|connect|ECONNREFUSED/i.test(error.message);

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-rose-700 mb-3">
        エラーが発生しました
      </h1>
      {isDbError ? (
        <div className="bg-rose-50 border border-rose-200 rounded-md p-4 text-sm text-rose-900 leading-relaxed">
          <p className="font-medium">データベースに接続できません</p>
          <p className="mt-2">
            .env.local の <code>POSTGRES_URL</code> /{" "}
            <code>POSTGRES_URL_NON_POOLING</code> を設定し、
            <code>npm run db:push</code> でテーブルを作成してください。
          </p>
        </div>
      ) : (
        <div className="bg-rose-50 border border-rose-200 rounded-md p-4 text-sm text-rose-900">
          <p className="font-medium">{error.message}</p>
        </div>
      )}
      <button
        type="button"
        onClick={reset}
        className="mt-4 px-3 py-1.5 rounded border border-neutral-300 text-sm text-neutral-700 hover:bg-neutral-50"
      >
        再試行
      </button>
    </div>
  );
}
