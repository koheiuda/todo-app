import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { scheduledPosts } from "@/lib/db/schema";
import { postTweetThread } from "@/lib/x/post";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const [post] = await db
    .select()
    .from(scheduledPosts)
    .where(eq(scheduledPosts.id, id));

  if (!post) {
    return NextResponse.json({ error: "post not found" }, { status: 404 });
  }
  if (post.status !== "pending") {
    return NextResponse.json(
      { error: `cannot run post in status=${post.status}` },
      { status: 400 }
    );
  }

  try {
    const r = await postTweetThread({
      body: post.bodyFinal,
      url: post.urlAttached,
      treeMode: post.treeMode,
    });
    await db
      .update(scheduledPosts)
      .set({
        status: "posted",
        postedTweetId: r.mainTweetId,
        postedReplyId: r.replyTweetId,
        errorMessage: null,
        updatedAt: new Date(),
      })
      .where(eq(scheduledPosts.id, id));

    return NextResponse.json({
      ok: true,
      tweetUrl: `https://twitter.com/i/web/status/${r.mainTweetId}`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const xErr = (err as { x?: { code: string } }).x;
    const code = xErr?.code ?? "unknown";

    const nextRetry = post.retryCount + 1;
    const giveUp =
      code === "credits_depleted" || code === "forbidden" || nextRetry >= 3;

    await db
      .update(scheduledPosts)
      .set({
        status: giveUp ? "failed" : "pending",
        errorMessage: msg.slice(0, 1000),
        retryCount: nextRetry,
        updatedAt: new Date(),
      })
      .where(eq(scheduledPosts.id, id));

    return NextResponse.json(
      { error: msg, code, giveUp },
      { status: 500 }
    );
  }
}
