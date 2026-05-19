import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { xTokens } from "@/lib/db/schema";
import { refreshAccessToken } from "./oauth";

const TOKEN_ID = "default";
const REFRESH_BUFFER_SECONDS = 60;

export async function saveTokens(opts: {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
  scope?: string;
}) {
  const expiresAt = new Date(Date.now() + opts.expiresInSeconds * 1000);
  await db
    .insert(xTokens)
    .values({
      id: TOKEN_ID,
      accessToken: opts.accessToken,
      refreshToken: opts.refreshToken,
      expiresAt,
      scope: opts.scope ?? null,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: xTokens.id,
      set: {
        accessToken: opts.accessToken,
        refreshToken: opts.refreshToken,
        expiresAt,
        scope: opts.scope ?? null,
        updatedAt: new Date(),
      },
    });
}

export async function getValidAccessToken(): Promise<string> {
  const [row] = await db.select().from(xTokens).where(eq(xTokens.id, TOKEN_ID));
  if (!row) {
    throw new Error("X tokens not found — connect X account first.");
  }

  const expiresSoon =
    row.expiresAt.getTime() - REFRESH_BUFFER_SECONDS * 1000 < Date.now();
  if (!expiresSoon) return row.accessToken;

  const clientId = process.env.X_CLIENT_ID;
  const clientSecret = process.env.X_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("X_CLIENT_ID / X_CLIENT_SECRET are not set.");
  }

  const fresh = await refreshAccessToken({
    refreshToken: row.refreshToken,
    clientId,
    clientSecret,
  });

  await saveTokens({
    accessToken: fresh.access_token,
    refreshToken: fresh.refresh_token,
    expiresInSeconds: fresh.expires_in,
    scope: fresh.scope,
  });
  return fresh.access_token;
}
