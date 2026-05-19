import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "node:crypto";
import { generatePkce, buildAuthorizeUrl } from "@/lib/x/oauth";

export const runtime = "nodejs";

export async function GET(_req: NextRequest) {
  const clientId = process.env.X_CLIENT_ID;
  const redirectUri = process.env.X_REDIRECT_URI;
  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: "X_CLIENT_ID / X_REDIRECT_URI not set" },
      { status: 500 }
    );
  }

  const { codeVerifier, codeChallenge } = generatePkce();
  const state = crypto.randomBytes(16).toString("base64url");

  const url = buildAuthorizeUrl({
    clientId,
    redirectUri,
    state,
    codeChallenge,
  });

  const c = await cookies();
  c.set("x_pkce_verifier", codeVerifier, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 600,
    path: "/",
  });
  c.set("x_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 600,
    path: "/",
  });

  return NextResponse.redirect(url);
}
