import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { articles, tweetDrafts } from "@/lib/db/schema";
import { draftOne, PERSONA_NAME } from "@/lib/agents/drafter";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const [article] = await db
    .select()
    .from(articles)
    .where(eq(articles.id, id));
  if (!article) {
    return NextResponse.json({ error: "article not found" }, { status: 404 });
  }

  try {
    const draft = await draftOne({
      source: article.source,
      title: article.title,
      url: article.url,
      summary: article.summary ?? "",
    });

    await db.delete(tweetDrafts).where(eq(tweetDrafts.articleId, id));

    const [row] = await db
      .insert(tweetDrafts)
      .values({
        articleId: id,
        persona: PERSONA_NAME,
        body: draft.body,
        hashtags: draft.hashtags,
        charCount: draft.charCount,
        isRecommended: true,
        recommendReason: null,
      })
      .returning();

    return NextResponse.json({ ok: true, draft: row });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
