import { notFound } from "next/navigation";
import { eq, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { articles, tweetDrafts } from "@/lib/db/schema";
import { TweetEditor } from "@/components/tweet-editor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatJst } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [article] = await db
    .select()
    .from(articles)
    .where(eq(articles.id, id));
  if (!article) notFound();

  const drafts = await db
    .select()
    .from(tweetDrafts)
    .where(eq(tweetDrafts.articleId, id))
    .orderBy(asc(tweetDrafts.createdAt));

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Badge variant="secondary">{article.source}</Badge>
            <span>取得: {formatJst(article.fetchedAt)}</span>
            {article.publishedAt && (
              <span>公開: {formatJst(article.publishedAt)}</span>
            )}
          </div>
          <CardTitle className="text-xl mt-2">{article.title}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-3">
          {article.summary && (
            <p className="text-gray-700 whitespace-pre-line">
              {article.summary}
            </p>
          )}
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#2d4fd4] hover:underline break-all"
          >
            {article.url}
          </a>
        </CardContent>
      </Card>

      {drafts.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-sm text-gray-500">
            ツイート案がまだ生成されていません。
          </CardContent>
        </Card>
      ) : (
        <TweetEditor articleUrl={article.url} drafts={drafts} />
      )}
    </div>
  );
}
