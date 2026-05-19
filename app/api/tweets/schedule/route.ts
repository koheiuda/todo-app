import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { scheduledPosts, tweetDrafts, articles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

const Body = z.object({
  draftId: z.string().uuid(),
  bodyFinal: z.string().min(1).max(2000),
  scheduledAt: z.string().datetime(),
  treeMode: z.boolean().default(true),
  attachUrl: z.boolean().default(true),
});

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid body", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const [draft] = await db
    .select({
      id: tweetDrafts.id,
      articleUrl: articles.url,
    })
    .from(tweetDrafts)
    .innerJoin(articles, eq(articles.id, tweetDrafts.articleId))
    .where(eq(tweetDrafts.id, parsed.data.draftId));

  if (!draft) {
    return NextResponse.json({ error: "draft not found" }, { status: 404 });
  }

  const [row] = await db
    .insert(scheduledPosts)
    .values({
      draftId: draft.id,
      bodyFinal: parsed.data.bodyFinal,
      urlAttached: parsed.data.attachUrl ? draft.articleUrl : null,
      treeMode: parsed.data.treeMode,
      scheduledAt: new Date(parsed.data.scheduledAt),
      status: "pending",
    })
    .returning();

  return NextResponse.json({ ok: true, post: row });
}
