export function SetupNotice({
  reason,
  message,
}: {
  reason: "no-token" | "error";
  message: string;
}) {
  if (reason === "no-token") {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-sm text-amber-900">
        <p className="font-semibold">GitHub と接続されていません</p>
        <p className="mt-2 leading-relaxed">
          このダッシュボードは GitHub API からリポジトリ・ブランチ・PR
          を読み取って表示します。表示するには環境変数{" "}
          <code className="px-1 py-0.5 bg-white/70 rounded font-mono text-xs">
            GITHUB_TOKEN
          </code>{" "}
          の設定が必要です。
        </p>
        <ol className="mt-3 space-y-1 list-decimal list-inside leading-relaxed">
          <li>
            GitHub の Settings → Developer settings → Personal access tokens
            でトークンを発行する（必要な権限：<strong>repo</strong> の読み取り）
          </li>
          <li>
            Vercel のプロジェクト設定 → Environment Variables に{" "}
            <code className="px-1 py-0.5 bg-white/70 rounded font-mono text-xs">
              GITHUB_TOKEN
            </code>{" "}
            として登録する
          </li>
          <li>
            ローカルで確認する場合は{" "}
            <code className="px-1 py-0.5 bg-white/70 rounded font-mono text-xs">
              .env.local
            </code>{" "}
            に同じ名前で記載する
          </li>
          <li>再デプロイ（またはサーバー再起動）すると一覧が表示されます</li>
        </ol>
        <p className="mt-3 text-xs text-amber-700">
          ※ トークンは画面には表示されません。読み取り専用の権限だけを付けてください。
        </p>
      </div>
    );
  }

  return (
    <div className="bg-rose-50 border border-rose-200 rounded-xl p-5 text-sm text-rose-900">
      <p className="font-semibold">GitHub からデータを取得できませんでした</p>
      <p className="mt-2 leading-relaxed">{message}</p>
      <p className="mt-2 text-xs text-rose-700">
        トークンの有効期限・権限（repo の読み取り）を確認してください。
      </p>
    </div>
  );
}
