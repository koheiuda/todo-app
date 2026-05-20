import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { scheduledPosts, tweetDrafts, articles } from "@/lib/db/schema";
import { postTweetThread } from "@/lib/x/post";

export const runtime = "nodejs";
export const maxDuration = 60;

const Body = z.object({
  draftId: z.string().uuid(),
  bodyFinal: z.string().min(1).max(2000),
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

  const urlAttached = parsed.data.attachUrl ? draft.articleUrl : null;

  try {
    const r = await postTweetThread({
      body: parsed.data.bodyFinal,
      url: urlAttached,
      treeMode: parsed.data.treeMode,
    });

    const [row] = await db
      .insert(scheduledPosts)
      .values({
        draftId: draft.id,
        bodyFinal: parsed.data.bodyFinal,
        urlAttached,
        treeMode: parsed.data.treeMode,
        scheduledAt: new Date(),
        status: "posted",
        postedTweetId: r.mainTweetId,
        postedReplyId: r.replyTweetId,
      })
      .returning();

    return NextResponse.json({
      ok: true,
      post: row,
      tweetUrl: `https://twitter.com/i/web/status/${r.mainTweetId}`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const xErr = (err as { x?: { code: string } }).x;

    await db.insert(scheduledPosts).values({
      draftId: draft.id,
      bodyFinal: parsed.data.bodyFinal,
      urlAttached,
      treeMode: parsed.data.treeMode,
      scheduledAt: new Date(),
      status: "failed",
      errorMessage: msg.slice(0, 1000),
    });

    return NextResponse.json(
      { error: msg, code: xErr?.code ?? "unknown" },
      { status: 500 }
    );
  }
}
