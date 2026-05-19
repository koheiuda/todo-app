import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { exchangeCodeForToken } from "@/lib/x/oauth";
import { saveTokens } from "@/lib/x/tokens";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const errorParam = url.searchParams.get("error");

  if (errorParam) {
    return NextResponse.json(
      { error: errorParam, description: url.searchParams.get("error_description") },
      { status: 400 }
    );
  }

  if (!code || !state) {
    return NextResponse.json({ error: "missing code or state" }, { status: 400 });
  }

  const c = await cookies();
  const expectedState = c.get("x_oauth_state")?.value;
  const codeVerifier = c.get("x_pkce_verifier")?.value;

  if (!expectedState || !codeVerifier || expectedState !== state) {
    return NextResponse.json({ error: "state mismatch" }, { status: 400 });
  }

  const clientId = process.env.X_CLIENT_ID;
  const clientSecret = process.env.X_CLIENT_SECRET;
  const redirectUri = process.env.X_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.json({ error: "X env not set" }, { status: 500 });
  }

  try {
    const token = await exchangeCodeForToken({
      code,
      redirectUri,
      codeVerifier,
      clientId,
      clientSecret,
    });
    await saveTokens({
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      expiresInSeconds: token.expires_in,
      scope: token.scope,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  c.delete("x_pkce_verifier");
  c.delete("x_oauth_state");

  return NextResponse.redirect(new URL("/settings?x=connected", req.url));
}
