import { NextRequest, NextResponse } from "next/server";
import { inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { articles, tweetDrafts } from "@/lib/db/schema";
import { fetchAllFeeds } from "@/lib/rss/fetch";
import { draftOne, PERSONA_NAME } from "@/lib/agents/drafter";
import { MAX_DRAFTS_PER_RUN } from "@/lib/config/rss";
import { isAuthorizedCron } from "@/lib/auth/cron";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const fetched = await fetchAllFeeds();
  if (fetched.length === 0) {
    return NextResponse.json({ ok: true, inserted: 0, drafted: 0 });
  }

  const urls = fetched.map((a) => a.url);
  const existing = await db
    .select({ url: articles.url })
    .from(articles)
    .where(inArray(articles.url, urls));
  const existingUrls = new Set(existing.map((e) => e.url));
  const fresh = fetched.filter((a) => !existingUrls.has(a.url));

  if (fresh.length === 0) {
    return NextResponse.json({ ok: true, inserted: 0, drafted: 0 });
  }

  const inserted = await db
    .insert(articles)
    .values(
      fresh.map((a) => ({
        source: a.source,
        title: a.title,
        url: a.url,
        summary: a.summary,
        publishedAt: a.publishedAt ?? null,
      }))
    )
    .returning();

  const toDraft = inserted.slice(0, MAX_DRAFTS_PER_RUN);

  let drafted = 0;
  const draftErrors: Array<{ url: string; error: string }> = [];
  for (const article of toDraft) {
    try {
      const draft = await draftOne({
        source: article.source,
        title: article.title,
        url: article.url,
        summary: article.summary ?? "",
      });

      await db.insert(tweetDrafts).values({
        articleId: article.id,
        persona: PERSONA_NAME,
        body: draft.body,
        hashtags: draft.hashtags,
        charCount: draft.charCount,
        isRecommended: true,
        recommendReason: null,
      });
      drafted++;
    } catch (err) {
      const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
      draftErrors.push({ url: article.url, error: msg });
      console.error("[fetch-news] draft failed for", article.url, err);
    }
  }

  return NextResponse.json({
    ok: true,
    inserted: inserted.length,
    drafted,
    ...(draftErrors.length > 0 ? { draftErrors } : {}),
  });
}
