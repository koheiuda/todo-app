import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { scheduledPosts, tweetDrafts, articles } from "@/lib/db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatJst } from "@/lib/format";
import { CancelButton } from "./cancel-button";

export const dynamic = "force-dynamic";

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  posted: "default",
  failed: "destructive",
  canceled: "outline",
};

const statusLabel: Record<string, string> = {
  pending: "待機中",
  posted: "成功",
  failed: "失敗",
  canceled: "キャンセル",
};

export default async function ScheduledPage() {
  let rows: Array<{
    id: string;
    bodyFinal: string;
    scheduledAt: Date;
    status: string;
    treeMode: boolean;
    urlAttached: string | null;
    postedTweetId: string | null;
    errorMessage: string | null;
    articleTitle: string | null;
  }> = [];
  let dbError: string | null = null;

  try {
    rows = await db
      .select({
        id: scheduledPosts.id,
        bodyFinal: scheduledPosts.bodyFinal,
        scheduledAt: scheduledPosts.scheduledAt,
        status: scheduledPosts.status,
        treeMode: scheduledPosts.treeMode,
        urlAttached: scheduledPosts.urlAttached,
        postedTweetId: scheduledPosts.postedTweetId,
        errorMessage: scheduledPosts.errorMessage,
        articleTitle: articles.title,
      })
      .from(scheduledPosts)
      .leftJoin(tweetDrafts, eq(tweetDrafts.id, scheduledPosts.draftId))
      .leftJoin(articles, eq(articles.id, tweetDrafts.articleId))
      .orderBy(desc(scheduledPosts.scheduledAt))
      .limit(100);
  } catch (err) {
    dbError = err instanceof Error ? err.message : String(err);
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">予約一覧</h1>

      {dbError && (
        <Card className="border-red-300 bg-red-50 dark:bg-red-950/30">
          <CardContent className="pt-6 text-sm">
            DB接続エラー：<code className="text-xs">{dbError}</code>
          </CardContent>
        </Card>
      )}

      {rows.length === 0 && !dbError && (
        <Card>
          <CardContent className="pt-6 text-sm text-zinc-500">
            予約はありません。
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-3">
        {rows.map((p) => (
          <Card key={p.id}>
            <CardHeader>
              <div className="flex items-center gap-2 text-xs">
                <Badge variant={statusVariant[p.status] ?? "secondary"}>
                  {statusLabel[p.status] ?? p.status}
                </Badge>
                <span className="text-zinc-500">
                  予約: {formatJst(p.scheduledAt, "yyyy/MM/dd HH:mm")}
                </span>
                {p.treeMode && (
                  <Badge variant="outline" className="text-[10px]">
                    ツリー投稿
                  </Badge>
                )}
              </div>
              <CardTitle className="text-sm mt-1">
                {p.articleTitle ?? "(記事不明)"}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <pre className="whitespace-pre-wrap text-xs bg-zinc-50 dark:bg-zinc-900 p-2 rounded border">
                {p.bodyFinal}
              </pre>
              {p.urlAttached && (
                <div className="text-xs text-zinc-500">
                  リプライURL: {p.urlAttached}
                </div>
              )}
              {p.errorMessage && (
                <div className="text-xs text-red-600">
                  エラー: {p.errorMessage}
                </div>
              )}
              {p.postedTweetId && (
                <a
                  href={`https://twitter.com/i/web/status/${p.postedTweetId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline"
                >
                  投稿を見る ▶
                </a>
              )}
              {p.status === "pending" && <CancelButton id={p.id} />}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
