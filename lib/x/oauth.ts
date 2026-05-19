import crypto from "node:crypto";

const X_AUTH_URL = "https://twitter.com/i/oauth2/authorize";
const X_TOKEN_URL = "https://api.twitter.com/2/oauth2/token";

export const X_SCOPES = [
  "tweet.read",
  "tweet.write",
  "users.read",
  "offline.access",
];

export type PkcePair = { codeVerifier: string; codeChallenge: string };

export function generatePkce(): PkcePair {
  const codeVerifier = crypto.randomBytes(32).toString("base64url");
  const codeChallenge = crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");
  return { codeVerifier, codeChallenge };
}

export function buildAuthorizeUrl(opts: {
  clientId: string;
  redirectUri: string;
  state: string;
  codeChallenge: string;
  scopes?: string[];
}): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: opts.clientId,
    redirect_uri: opts.redirectUri,
    scope: (opts.scopes ?? X_SCOPES).join(" "),
    state: opts.state,
    code_challenge: opts.codeChallenge,
    code_challenge_method: "S256",
  });
  return `${X_AUTH_URL}?${params.toString()}`;
}

export type XTokenResponse = {
  token_type: "bearer";
  expires_in: number;
  access_token: string;
  refresh_token: string;
  scope: string;
};

function basicAuthHeader(clientId: string, clientSecret: string): string {
  const raw = `${clientId}:${clientSecret}`;
  return `Basic ${Buffer.from(raw).toString("base64")}`;
}

export async function exchangeCodeForToken(opts: {
  code: string;
  redirectUri: string;
  codeVerifier: string;
  clientId: string;
  clientSecret: string;
}): Promise<XTokenResponse> {
  const body = new URLSearchParams({
    code: opts.code,
    grant_type: "authorization_code",
    client_id: opts.clientId,
    redirect_uri: opts.redirectUri,
    code_verifier: opts.codeVerifier,
  });

  const res = await fetch(X_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: basicAuthHeader(opts.clientId, opts.clientSecret),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!res.ok) {
    throw new Error(`X token exchange failed: ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as XTokenResponse;
}

export async function refreshAccessToken(opts: {
  refreshToken: string;
  clientId: string;
  clientSecret: string;
}): Promise<XTokenResponse> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: opts.refreshToken,
    client_id: opts.clientId,
  });

  const res = await fetch(X_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: basicAuthHeader(opts.clientId, opts.clientSecret),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!res.ok) {
    throw new Error(`X token refresh failed: ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as XTokenResponse;
}
