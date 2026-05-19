import { completeText, MODEL_DRAFT } from "@/lib/claude/client";
import { DEFAULT_PERSONAS, POSTER_PROFILE, type Persona } from "@/lib/config/personas";

export type DraftInput = {
  source: string;
  title: string;
  url: string;
  summary: string;
};

export type DraftOutput = {
  persona: Persona;
  body: string;
  hashtags: string;
  charCount: number;
};

const SYSTEM = `あなたはXのツイートライターです。読者の手を止めるフックと、明確な行動喚起を必ず含めてください。`;

const buildPrompt = (article: DraftInput, persona: Persona): string => `
あなたは「${persona.name}」の視点でXのツイート文を作成するライターです。

【記事情報】
媒体: ${article.source}
タイトル: ${article.title}
要約: ${article.summary || "(要約なし)"}
URL: ${article.url}

【投稿者プロフィール】
${POSTER_PROFILE}

【ペルソナ】
${persona.description}
想定読者: ${persona.targetAudience}
口調: ${persona.tone}

【厳守フォーマット】
[絵文字1つ][フックタイトル]

[2-3文で記事の要約]

◆ポイント
・[ポイント1]
・[ポイント2]
・[ポイント3]

[締めの一文]

#SEO #[文脈ハッシュタグ1つ]

【制約】
- 全体で350〜420字（URLとリプライ用テキストは含めない）
- ハッシュタグは2つまで
- 断定調で行動喚起を含めること
- URLは本文に含めない（後でリプライにぶら下げる）

出力はツイート本文のみ。前置きや説明は不要。
`;

const extractHashtags = (body: string): string => {
  const matches = body.match(/#[^\s#]+/g) ?? [];
  return matches.join(" ");
};

export async function draftOne(
  article: DraftInput,
  persona: Persona
): Promise<DraftOutput> {
  const body = await completeText({
    model: MODEL_DRAFT,
    system: SYSTEM,
    user: buildPrompt(article, persona),
    maxTokens: 800,
    temperature: 0.8,
  });

  return {
    persona,
    body,
    hashtags: extractHashtags(body),
    charCount: [...body].length,
  };
}

export async function draftAll(article: DraftInput): Promise<DraftOutput[]> {
  const results = await Promise.all(
    DEFAULT_PERSONAS.map((p) => draftOne(article, p))
  );
  return results;
}
