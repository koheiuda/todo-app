import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { scheduledPosts } from "@/lib/db/schema";

export const runtime = "nodejs";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const [row] = await db
    .select()
    .from(scheduledPosts)
    .where(eq(scheduledPosts.id, id));

  if (!row) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (row.status !== "pending") {
    return NextResponse.json(
      { error: `cannot cancel post in status=${row.status}` },
      { status: 400 }
    );
  }

  await db
    .update(scheduledPosts)
    .set({ status: "canceled", updatedAt: new Date() })
    .where(eq(scheduledPosts.id, id));

  return NextResponse.json({ ok: true });
}
