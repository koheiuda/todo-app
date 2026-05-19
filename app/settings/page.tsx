import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DEFAULT_PERSONAS } from "@/lib/config/personas";
import { DEFAULT_RSS_FEEDS, INCLUDE_KEYWORDS } from "@/lib/config/rss";
import { db } from "@/lib/db";
import { xTokens } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ x?: string }>;
}) {
  const sp = await searchParams;

  let xConnected = false;
  let xError: string | null = null;
  try {
    const rows = await db.select().from(xTokens).limit(1);
    xConnected = rows.length > 0;
  } catch (err) {
    xError = err instanceof Error ? err.message : String(err);
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">設定</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">X 連携</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {xError ? (
            <div className="text-red-600 text-xs">DBエラー: {xError}</div>
          ) : xConnected ? (
            <Badge variant="default">接続済み</Badge>
          ) : (
            <Badge variant="secondary">未接続</Badge>
          )}
          {sp.x === "connected" && (
            <div className="text-green-600 text-xs">X連携が完了しました。</div>
          )}
          <div>
            <a href="/api/auth/x">
              <Button size="sm">{xConnected ? "再連携" : "Xアカウントを接続"}</Button>
            </a>
          </div>
          <p className="text-xs text-zinc-500">
            事前にXのDeveloper Portalで X_CLIENT_ID / X_CLIENT_SECRET / X_REDIRECT_URI を発行してください。
            初回利用前に最低$5のクレジットチャージが必要です（402 CreditsDepleted回避）。
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">AI社員ペルソナ（4人体制）</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {DEFAULT_PERSONAS.map((p) => (
            <div key={p.id} className="border rounded p-3">
              <div className="font-semibold">{p.name}</div>
              <div className="text-xs text-zinc-500">
                対象: {p.targetAudience} ／ 口調: {p.tone}
              </div>
              <p className="text-xs mt-1">{p.description}</p>
            </div>
          ))}
          <p className="text-xs text-zinc-500">
            ※ DBの settings テーブル経由でGUI編集できる仕組みを後段で追加。
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">監視RSSフィード</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {DEFAULT_RSS_FEEDS.map((u) => (
            <div key={u} className="text-xs break-all bg-zinc-50 dark:bg-zinc-900 p-2 rounded border">
              {u}
            </div>
          ))}
          <div className="pt-2 text-xs text-zinc-500">
            <span className="font-medium">含めるキーワード：</span>
            {INCLUDE_KEYWORDS.join(" / ")}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cron 手動トリガ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>
            <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">
              GET /api/cron/fetch-news?secret=$CRON_SECRET
            </code>
            <p className="text-xs text-zinc-500 mt-1">ニュース取得＋ツイート案生成</p>
          </div>
          <div>
            <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">
              GET /api/cron/post-tweets?secret=$CRON_SECRET
            </code>
            <p className="text-xs text-zinc-500 mt-1">予約済み投稿の実行</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
