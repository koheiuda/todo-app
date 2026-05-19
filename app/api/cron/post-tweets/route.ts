import { NextRequest, NextResponse } from "next/server";
import { and, eq, lte } from "drizzle-orm";
import { db } from "@/lib/db";
import { scheduledPosts } from "@/lib/db/schema";
import { postTweetThread } from "@/lib/x/post";
import { isAuthorizedCron } from "@/lib/auth/cron";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_RETRIES = 3;

export async function GET(req: NextRequest) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const pending = await db
    .select()
    .from(scheduledPosts)
    .where(
      and(
        eq(scheduledPosts.status, "pending"),
        lte(scheduledPosts.scheduledAt, now)
      )
    )
    .limit(10);

  const results: Array<{ id: string; status: string; error?: string }> = [];

  for (const post of pending) {
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
        .where(eq(scheduledPosts.id, post.id));
      results.push({ id: post.id, status: "posted" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const xErr = (err as { x?: { code: string } }).x;
      const code = xErr?.code ?? "unknown";

      const nextRetry = post.retryCount + 1;
      const giveUp = code === "credits_depleted" || code === "forbidden" || nextRetry >= MAX_RETRIES;

      await db
        .update(scheduledPosts)
        .set({
          status: giveUp ? "failed" : "pending",
          errorMessage: msg.slice(0, 1000),
          retryCount: nextRetry,
          updatedAt: new Date(),
        })
        .where(eq(scheduledPosts.id, post.id));

      results.push({
        id: post.id,
        status: giveUp ? "failed" : "retry",
        error: msg,
      });
    }
  }

  return NextResponse.json({ ok: true, processed: pending.length, results });
}
