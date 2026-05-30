/**
 * ベンチプレス・コンサルの「ベースプラン」定数。
 * - 画面表示（ロードマップ・プロフィール）
 * - Claude へのコンテキスト（lib/training/prompt.ts でテキスト化）
 * の両方で使う、単一の真実の情報源。
 */

/** 本番（MAX挑戦日） */
export const PEAK_DATE = "2026-06-29";

export type TrainingDay = {
  /** D1 / D2 / D3 */
  label: string;
  /** メニュー（重量×回数×セット） */
  menu: string;
};

export type RoadmapWeek = {
  week: number;
  /** 例: "6/1-7" */
  range: string;
  /** ISO開始日 YYYY-MM-DD */
  start: string;
  /** ISO終了日 YYYY-MM-DD（含む） */
  end: string;
  /** 例: "再習熟" */
  theme: string;
  days: TrainingDay[];
};

export const PROFILE = {
  height: "178cm",
  weight: "70kg",
  age: "27歳",
  experience: "ベンチ経験3〜5年（現在ブランク明け）",
  sleep: "睡眠6h",
  work: "仕事あり",
  pastMax: "過去MAX 105kg",
  currentMax: "ブランクで現在の実MAXは95〜100kg想定",
  weakness:
    "中間スティッキングポイント（三頭出力不足＋初速不足）",
} as const;

export const GOALS = {
  /** 確実ライン */
  safe: 110,
  /** 調子次第のボーナス */
  bonus: 115,
  deadline: "6月末（本番 6/29）",
} as const;

export const NUTRITION = {
  kcal: 3000,
  proteinG: 155,
  carbG: 400,
  fatG: 75,
  note: "維持+400の増量",
} as const;

export const BLOOD_SUGAR =
  "食べる順番（野菜・タンパク質→炭水化物）、白米単体を避ける、欠食しない。午後の重要業務前は昼の米を控え、糖質はトレ前後に寄せる";

export const WEIGHT_MGMT =
  "週+0.25〜0.5kg、毎朝起床後に測定し週平均で判断";

export const SUPPLEMENTS =
  "クレアチン5g/日、プロテイン、カフェインはDay1とMAX挑戦日のみ";

export const TRAINING_DAYS = "月・水・金（週3）";

export const PRIORITY =
  "6月は「筋トレ目標 > 仕事」を優先";

export const ROADMAP: RoadmapWeek[] = [
  {
    week: 1,
    range: "6/1-7",
    start: "2026-06-01",
    end: "2026-06-07",
    theme: "再習熟",
    days: [
      { label: "D1", menu: "80×3×4" },
      { label: "D2", menu: "60×6×3（爆発的）" },
      { label: "D3", menu: "75×5×4" },
    ],
  },
  {
    week: 2,
    range: "6/8-14",
    start: "2026-06-08",
    end: "2026-06-14",
    theme: "出力強化",
    days: [
      { label: "D1", menu: "90×2-3×4" },
      { label: "D2", menu: "ナロー65×8×3" },
      { label: "D3", menu: "ポーズ75×4×3" },
    ],
  },
  {
    week: 3,
    range: "6/15-21",
    start: "2026-06-15",
    end: "2026-06-21",
    theme: "ピーク",
    days: [
      { label: "D1", menu: "97.5×1-2×3 ＋ 110kg保持10秒×2" },
      { label: "D2", menu: "65×5×3（速）" },
      { label: "D3", menu: "102.5×1（実MAX確認）→85×3×3" },
    ],
  },
  {
    week: 4,
    range: "6/22-30",
    start: "2026-06-22",
    end: "2026-06-30",
    theme: "調整",
    days: [
      { label: "6/23のみ", menu: "70×3×2" },
      { label: "以降", menu: "完全休養" },
      { label: "6/29", menu: "本番 110→115" },
    ],
  },
];

/** YYYY-MM-DD を 0時基準の Date に。タイムゾーンずれを避けるためローカル日付として解釈 */
function parseYmd(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map((n) => parseInt(n, 10));
  return new Date(y, m - 1, d);
}

/** ローカル日付を YYYY-MM-DD 文字列に */
export function toYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** 本番までの残り日数（今日含まず）。過ぎていれば負数 */
export function daysUntilPeak(today: string): number {
  const t = parseYmd(today).getTime();
  const peak = parseYmd(PEAK_DATE).getTime();
  return Math.round((peak - t) / 86_400_000);
}

/** 今日が属するロードマップの週（範囲外なら null） */
export function currentWeek(today: string): RoadmapWeek | null {
  const t = parseYmd(today).getTime();
  return (
    ROADMAP.find(
      (w) => t >= parseYmd(w.start).getTime() && t <= parseYmd(w.end).getTime()
    ) ?? null
  );
}
