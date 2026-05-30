import {
  BLOOD_SUGAR,
  GOALS,
  NUTRITION,
  PRIORITY,
  PROFILE,
  ROADMAP,
  STRATEGY_NOTE,
  SUPPLEMENTS,
  TRAINING_DAYS,
  WEIGHT_MGMT,
  formatMenu,
} from "./plan";
import { TRAINED_LABELS, type DailyReport, type ReportInput } from "./types";

/** ベースプランを丸ごとテキスト化（AIへのコンテキスト） */
export function planAsText(): string {
  const roadmap = ROADMAP.map((w) => {
    const days = w.days
      .map((d) => `    ${d.label} ${formatMenu(d)}${d.role ? `（${d.role}）` : ""}`)
      .join("\n");
    return `  第${w.week}週(${w.range}) ${w.theme}: ${w.note}\n${days}`;
  }).join("\n");

  return `【ユーザー】${PROFILE.height} / ${PROFILE.weight} / ${PROFILE.age} / ${PROFILE.experience} / ${PROFILE.sleep} / ${PROFILE.work}
【目標】${GOALS.deadline}までにベンチMAX ${GOALS.safe}kg（確実ライン）、${GOALS.bonus}kg（調子次第のボーナス）
【現状】${PROFILE.pastMax}、${PROFILE.currentMax}
【現状の見立て】${STRATEGY_NOTE}
【弱点】${PROFILE.weakness}
【トレ日】${TRAINING_DAYS}
【栄養目標】${NUTRITION.kcal}kcal / P${NUTRITION.proteinG}g / C${NUTRITION.carbG}g / F${NUTRITION.fatG}g（${NUTRITION.note}）
【血糖コントロール】${BLOOD_SUGAR}
【体重管理】${WEIGHT_MGMT}
【サプリ】${SUPPLEMENTS}
【大前提】${PRIORITY}
【当初の4週ロードマップ（重量×回数×セット）】
${roadmap}`;
}

function reportAsText(r: ReportInput): string {
  const lines: string[] = [`日付: ${r.date}`];
  if (r.weightKg != null) lines.push(`体重: ${r.weightKg}kg`);
  if (r.sleepHours != null) lines.push(`睡眠: ${r.sleepHours}h`);
  if (r.trained) lines.push(`トレ: ${TRAINED_LABELS[r.trained]}`);
  if (r.workout.trim()) lines.push(`やった内容: ${r.workout.trim()}`);
  if (r.diet.trim()) lines.push(`食事: ${r.diet.trim()}`);
  if (r.condition.trim()) lines.push(`体調・痛み・疲労: ${r.condition.trim()}`);
  if (r.memo.trim()) lines.push(`メモ: ${r.memo.trim()}`);
  return lines.join("\n");
}

export const SYSTEM_PROMPT = `あなたはプロのボディビルダー兼パーソナルトレーナーです。以下の「ベースプラン」と、ユーザーの過去の報告ログ全件を踏まえ、今日の報告に対して次の4点を簡潔に日本語で返してください。

① 今日の評価
② 計画のズレと巻き返し方
③ 明日以降の修正提案
④ 一言の励まし

重要な方針:
- カレンダー通りにいかない前提で、毎回「逆算計画」を現実に合わせて微調整すること。
- 痛みや異常があれば安全最優先で、休養や中止を促すこと。無理に追い込ませない。
- 数値（重量・回数）は具体的に。曖昧な精神論で終わらせない。
- 過度に長くしない。読み切れる長さで、見出し①②③④を付けて返す。

ベースプラン:
${planAsText()}`;

/** 今日の報告＋過去ログから、ユーザーメッセージを組み立てる */
export function buildUserPrompt(
  today: ReportInput,
  history: DailyReport[]
): string {
  const past =
    history.length === 0
      ? "（過去の報告はまだありません。初回です）"
      : history
          .slice()
          .reverse() // 古い順で時系列が分かりやすいように
          .map(
            (r, i) =>
              `--- 過去ログ ${i + 1} ---\n${reportAsText(r)}\n[当時のフィードバック]\n${r.feedback}`
          )
          .join("\n\n");

  return `## 過去の報告ログ（全${history.length}件）
${past}

## 今日の報告
${reportAsText(today)}

上記の今日の報告に対して、①〜④の形式でフィードバックをください。`;
}
