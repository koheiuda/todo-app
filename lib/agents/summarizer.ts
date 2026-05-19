import { completeText } from "@/lib/claude/client";

const SYSTEM = `あなたは記事の要約者です。事実のみを抽出し、誇張せず2〜3文で要約します。`;

export async function summarize(opts: {
  title: string;
  rawText: string;
}): Promise<string> {
  if (!opts.rawText.trim()) return "";

  const prompt = `
次の記事を、SEO/マーケ実務者向けに2〜3文（180字以内）で要約してください。
推測や脚色は禁止。事実に絞る。出力は要約のみ。

タイトル: ${opts.title}

本文/抜粋:
${opts.rawText.slice(0, 4000)}
`.trim();

  return await completeText({
    system: SYSTEM,
    user: prompt,
    maxTokens: 400,
    temperature: 0.2,
  });
}
