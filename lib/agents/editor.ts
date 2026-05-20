import { completeText, MODEL_EDITOR } from "@/lib/claude/client";
import type { DraftOutput } from "./drafter";

export type EditorPick = {
  selectedIndex: number;
  reason: string;
};

const SYSTEM = `あなたは編集長です。ツイートの選定基準に従い、最も投稿に値する案を冷静に選んでください。`;

const buildPrompt = (drafts: DraftOutput[]): string => `
以下4案のツイートから最も優れた1案を選び、推薦理由を100字以内で述べてください。

【選定基準】
1. フックの強さ（冒頭で読者の手を止められるか）
2. 投稿者の専門性（SEO/WEBマーケ）と合致しているか
3. 想定読者像が明確で刺さるか
4. 断定的な口調で行動を促しているか
5. 文字数が350〜420字に収まっているか

【4案】
${drafts
  .map(
    (d, i) =>
      `--- 案${i + 1}（${d.personaName} / ${d.charCount}字）---\n${d.body}`
  )
  .join("\n\n")}

必ず以下のJSONのみを出力（前後にテキスト不要）:
{"selected_index": 0, "reason": "..."}
`;

const parseJsonLoose = (text: string): EditorPick | null => {
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    const obj = JSON.parse(m[0]);
    const idx = Number(obj.selected_index);
    if (!Number.isInteger(idx) || idx < 0) return null;
    return { selectedIndex: idx, reason: String(obj.reason ?? "") };
  } catch {
    return null;
  }
};

export async function pickBest(drafts: DraftOutput[]): Promise<EditorPick> {
  const out = await completeText({
    model: MODEL_EDITOR,
    system: SYSTEM,
    user: buildPrompt(drafts),
    maxTokens: 400,
    temperature: 0.3,
  });

  const parsed = parseJsonLoose(out);
  if (parsed && parsed.selectedIndex < drafts.length) return parsed;

  return {
    selectedIndex: 0,
    reason: "(編集長の出力をパースできなかったため、案1をデフォルト推薦)",
  };
}
