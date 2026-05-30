import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { anthropic } from "@/lib/claude/client";
import { SYSTEM_PROMPT, buildUserPrompt } from "@/lib/training/prompt";
import type { DailyReport, ReportInput } from "@/lib/training/types";

export const runtime = "nodejs";
export const maxDuration = 60;

/** 第一候補→失敗時フォールバックの順 */
const MODELS = ["claude-opus-4-8", "claude-sonnet-4-6"] as const;

type CoachRequest = {
  report: ReportInput;
  history: DailyReport[];
};

function extractText(res: Anthropic.Message): string {
  return res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      {
        error:
          "ANTHROPIC_API_KEY が未設定です。.env.local（ローカル）または Vercel の環境変数に設定してください。",
      },
      { status: 500 }
    );
  }

  let body: CoachRequest;
  try {
    body = (await req.json()) as CoachRequest;
  } catch {
    return NextResponse.json(
      { error: "リクエストボディが不正です（JSONを期待）。" },
      { status: 400 }
    );
  }

  if (!body?.report?.date) {
    return NextResponse.json(
      { error: "report.date が必要です。" },
      { status: 400 }
    );
  }

  const userPrompt = buildUserPrompt(body.report, body.history ?? []);

  let lastErr: unknown = null;
  for (const model of MODELS) {
    try {
      const res = await anthropic.messages.create({
        model,
        max_tokens: 1500,
        temperature: 0.7,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      });
      const feedback = extractText(res);
      if (!feedback) {
        lastErr = new Error("空のレスポンスが返りました。");
        continue;
      }
      return NextResponse.json({ feedback, model });
    } catch (err) {
      lastErr = err;
      // モデル未提供（404/400）などはフォールバックで次モデルを試す。
      // それ以外（レート制限・ネットワーク等）も次モデルで再試行する。
      console.warn(`[coach] model ${model} failed:`, err);
    }
  }

  const status =
    lastErr instanceof Anthropic.APIError && typeof lastErr.status === "number"
      ? lastErr.status
      : 502;
  const msg =
    lastErr instanceof Error ? lastErr.message : String(lastErr ?? "不明なエラー");
  return NextResponse.json(
    { error: `フィードバックの取得に失敗しました：${msg}` },
    { status }
  );
}
