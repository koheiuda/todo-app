import { getValidAccessToken } from "./tokens";

const TWEETS_URL = "https://api.twitter.com/2/tweets";

export type PostedTweet = { id: string; text: string };

export type PostError = {
  status: number;
  body: string;
  code: "credits_depleted" | "rate_limit" | "forbidden" | "unknown";
};

function classifyError(status: number, body: string): PostError["code"] {
  if (status === 402 || /credits/i.test(body)) return "credits_depleted";
  if (status === 429) return "rate_limit";
  if (status === 403) return "forbidden";
  return "unknown";
}

async function postOne(opts: {
  accessToken: string;
  text: string;
  inReplyToTweetId?: string;
}): Promise<PostedTweet> {
  const payload: Record<string, unknown> = { text: opts.text };
  if (opts.inReplyToTweetId) {
    payload.reply = { in_reply_to_tweet_id: opts.inReplyToTweetId };
  }

  const res = await fetch(TWEETS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${opts.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    const err = new Error(`X post failed: ${res.status} ${text}`) as Error & {
      x: PostError;
    };
    err.x = { status: res.status, body: text, code: classifyError(res.status, text) };
    throw err;
  }

  const json = (await res.json()) as { data: PostedTweet };
  return json.data;
}

export type ThreadPostResult = {
  mainTweetId: string;
  replyTweetId: string | null;
};

/**
 * Post a tweet — optionally with a URL reply attached for cost optimization.
 *
 * Tree mode: post main body without URL ($0.015), then reply with URL ($0.01).
 * Flat mode: single tweet with URL inline ($0.20 due to URL pricing).
 */
export async function postTweetThread(opts: {
  body: string;
  url?: string | null;
  treeMode: boolean;
}): Promise<ThreadPostResult> {
  const accessToken = await getValidAccessToken();

  const main = await postOne({ accessToken, text: opts.body });

  if (opts.treeMode && opts.url) {
    const replyText = `詳細はこちら ▼\n${opts.url}`;
    const reply = await postOne({
      accessToken,
      text: replyText,
      inReplyToTweetId: main.id,
    });
    return { mainTweetId: main.id, replyTweetId: reply.id };
  }

  return { mainTweetId: main.id, replyTweetId: null };
}
