import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { articles, tweetDrafts } from "@/lib/db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatJst } from "@/lib/format";

export const dynamic = "force-dynamic";

async function loadArticles() {
  const rows = await db
    .select({
      id: articles.id,
      source: articles.source,
      title: articles.title,
      url: articles.url,
      fetchedAt: articles.fetchedAt,
      publishedAt: articles.publishedAt,
    })
    .from(articles)
    .orderBy(desc(articles.fetchedAt))
    .limit(50);

  const recommendations = await db
    .select({
      articleId: tweetDrafts.articleId,
      body: tweetDrafts.body,
      persona: tweetDrafts.persona,
    })
    .from(tweetDrafts)
    .where(eq(tweetDrafts.isRecommended, true));

  const recMap = new Map(recommendations.map((r) => [r.articleId, r]));
  return rows.map((r) => ({ ...r, recommended: recMap.get(r.id) }));
}

export default async function NewsListPage() {
  let list: Awaited<ReturnType<typeof loadArticles>> = [];
  let dbError: string | null = null;
  try {
    list = await loadArticles();
  } catch (err) {
    dbError = err instanceof Error ? err.message : String(err);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">SEOニュース</h1>
        <span className="text-sm text-gray-500">
          直近の取得記事 {list.length} 件
        </span>
      </div>

      {dbError && (
        <Card className="border-red-300 bg-red-50">
          <CardContent className="pt-6 text-sm">
            DB接続エラー：<code className="text-xs">{dbError}</code>
          </CardContent>
        </Card>
      )}

      {list.length === 0 && !dbError && (
        <Card>
          <CardContent className="pt-6 text-sm text-gray-500">
            まだ記事がありません。手動取得：
            <code className="ml-2 px-2 py-1 rounded bg-gray-100">
              GET /api/cron/fetch-news?secret=$CRON_SECRET
            </code>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4">
        {list.map((a) => (
          <Link key={a.id} href={`/news/${a.id}`} className="block">
            <Card className="hover:border-[#2d4fd4] transition-colors">
              <CardHeader>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Badge variant="secondary">{a.source}</Badge>
                  <span>取得: {formatJst(a.fetchedAt)}</span>
                  {a.publishedAt && (
                    <span>公開: {formatJst(a.publishedAt)}</span>
                  )}
                </div>
                <CardTitle className="text-base mt-1">{a.title}</CardTitle>
              </CardHeader>
              {a.recommended && (
                <CardContent>
                  <div className="text-xs text-gray-500 mb-1">
                    推薦案（{a.recommended.persona}）
                  </div>
                  <p className="text-sm whitespace-pre-line line-clamp-3">
                    {a.recommended.body}
                  </p>
                </CardContent>
              )}
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
