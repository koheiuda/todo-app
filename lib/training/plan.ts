/**
 * ベンチプレス・コンサルの「ベースプラン」定数。
 * - 画面表示（ロードマップ・プロフィール）
 * - Claude へのコンテキスト（lib/training/prompt.ts でテキスト化）
 * の両方で使う、単一の真実の情報源。
 */

/** 本番（MAX挑戦日） */
export const PEAK_DATE = "2026-06-29";

export type TrainingDay = {
  /** D1 / D2 / D3（=トレ日1/2/3。週3＝月・水・金） */
  label: string;
  /** 種目バリエーション（例: ナロー / ポーズ）。通常ベンチは省略 */
  variation?: string;
  /** メインセットの重量(kg) */
  weightKg?: number;
  /** 回数（"3" / "2〜3" / "1〜2"） */
  reps?: string;
  /** セット数 */
  sets?: number;
  /** やり方の補足（例: 爆発的 / 速く / 実MAX確認） */
  cue?: string;
  /** メインに続く補足（単位込みで記述。例: "＋ 110kg保持10秒 × 2セット"） */
  extra?: string;
  /** セットの無い日（休養・本番など）はこちらに自由記述（単位込み） */
  freeform?: string;
  /** その日の狙い（D1=高重量, D2=スピード, D3=ボリューム/技術 など） */
  role?: string;
};

/** トレ日のメニューを単位付きの文字列に整形（画面・AIコンテキスト共通） */
export function formatMenu(d: TrainingDay): string {
  if (d.freeform) return d.freeform;
  const v = d.variation ? `${d.variation} ` : "";
  let s = `${v}${d.weightKg}kg × ${d.reps}回 × ${d.sets}セット`;
  if (d.cue) s += `（${d.cue}）`;
  if (d.extra) s += ` ${d.extra}`;
  return s;
}

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
  /** この週の狙い・ねらいを1〜2文で */
  note: string;
  days: TrainingDay[];
};

/** メニュー表記の読み方・用語の解説（画面・AIコンテキスト共通） */
export const NOTATION_LEGEND: { term: string; desc: string }[] = [
  {
    term: "重量 × 回数 × セット",
    desc: "例「80kg × 3回 × 4セット」= 80kg を 3回、それを 4セット繰り返す。重量は週ごとに変える",
  },
  {
    term: "D1 / D2 / D3",
    desc: "週3トレ（月・水・金）の各日。D1=高重量で最大筋力、D2=軽めを速く挙げて初速・爆発力、D3=中重量でボリューム＆フォーム固め",
  },
  {
    term: "爆発的",
    desc: "バーを胸から全力で“弾き飛ばす”意識で挙げる。弱点の初速を鍛える",
  },
  {
    term: "ポーズ",
    desc: "胸で約1秒静止してから挙げる。反動を消して中間（スティッキング）の力を強化",
  },
  {
    term: "ナロー",
    desc: "手幅を狭めたベンチ。三頭（弱点）を集中的に使う",
  },
  {
    term: "110kg保持10秒",
    desc: "110kgを担いで（挙げきった姿勢で）耐える。神経系を本番重量の“重さ”に慣らす",
  },
  {
    term: "RPE",
    desc: "主観的なキツさ（10=これ以上1回も無理）。RPE8なら「あと2回いけた」目安",
  },
];

/** 4フェーズの流れ（テーパリング設計）の解説 */
export const PHASE_FLOW =
  "再習熟 → 出力強化 → ピーク → 調整（テーパリング）の順。前半でフォームと筋力の土台を作り、第3週で神経系をMAXへ寄せ、最終週は疲労を抜いて本番1日にピークを合わせる。";

export const PROFILE = {
  height: "178cm",
  weight: "70kg",
  age: "27歳",
  experience: "ベンチ経験3〜5年（現在ブランク明け）",
  sleep: "睡眠6h",
  work: "仕事あり",
  pastMax: "過去MAX 105kg",
  currentMax: "現時点でも105kg×1（1発のみ）は挙上可能。ブランクの影響は軽微で、ほぼ過去MAX水準",
  weakness:
    "中間スティッキングポイント（三頭出力不足＋初速不足）",
} as const;

/** 現状を踏まえた戦略の見立て（105kg×1 が今出ることの評価） */
export const STRATEGY_NOTE =
  "今この時点で 105kg×1 が挙がるなら土台は十分。当初想定（95〜100kg）より明確に強く、ブランクの影響はほぼ無い。→ 110kg（確実）は射程内、115kg も当日次第で十分狙える。第1週の 80×3×4 が軽く感じても、これは「再習熟＋ボリューム」が目的なので正解。最大の分岐点は第3週D3の 102.5×1 が動くか。ここが動けば 110 はかなり堅い。";

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
    note: "鈍った神経系とフォームを呼び戻す週。重量より「正しい軌道で確実に挙げる」が最優先。105×1が出る今なら余裕を持って入れる。",
    days: [
      { label: "D1", weightKg: 80, reps: "3", sets: 4, role: "高重量に体を慣らす（MAX比 約76%）" },
      { label: "D2", weightKg: 60, reps: "6", sets: 3, cue: "爆発的", role: "胸から弾き飛ばす意識で初速づくり（弱点対策）" },
      { label: "D3", weightKg: 75, reps: "5", sets: 4, role: "中重量でボリュームを稼ぎフォームを反復" },
    ],
  },
  {
    week: 2,
    range: "6/8-14",
    start: "2026-06-08",
    end: "2026-06-14",
    theme: "出力強化",
    note: "中間のスティッキングを突破する出力を作る週。三頭と初速にピンポイントで刺激を入れる。",
    days: [
      { label: "D1", weightKg: 90, reps: "2〜3", sets: 4, role: "高重量（約86%）で最大筋力を底上げ" },
      { label: "D2", variation: "ナロー", weightKg: 65, reps: "8", sets: 3, role: "三頭出力を集中強化（弱点の根治）" },
      { label: "D3", variation: "ポーズ", weightKg: 75, reps: "4", sets: 3, role: "胸で静止し反動なしの中間パワー強化" },
    ],
  },
  {
    week: 3,
    range: "6/15-21",
    start: "2026-06-15",
    end: "2026-06-21",
    theme: "ピーク",
    note: "神経系を本番のMAXに寄せる週。高重量と110kg保持で“重さ”に体を順応させる。ここのD3が最大の分岐点。",
    days: [
      { label: "D1", weightKg: 97.5, reps: "1〜2", sets: 3, extra: "＋ 110kg保持10秒 × 2セット", role: "ニアMAX（約93%）＋110kgを担いで神経系を本番重量に順応" },
      { label: "D2", weightKg: 65, reps: "5", sets: 3, cue: "速く", role: "軽めを速く。疲労を抜きつつ初速をキープ" },
      { label: "D3", weightKg: 102.5, reps: "1", sets: 1, cue: "実MAX確認", extra: "→ 85kg × 3回 × 3セット", role: "現MAX確認（約98%）。これが動けば110は射程" },
    ],
  },
  {
    week: 4,
    range: "6/22-30",
    start: "2026-06-22",
    end: "2026-06-30",
    theme: "調整",
    note: "疲労を完全に抜いて本番1日にピークを合わせる週。やり込みは厳禁、回復＞刺激。",
    days: [
      { label: "6/23のみ", weightKg: 70, reps: "3", sets: 2, role: "軽く動作だけ確認（神経の入れ直し）" },
      { label: "以降", freeform: "完全休養", role: "神経系をフル回復させる" },
      { label: "6/29", freeform: "本番：110kg → 115kg に挑戦", role: "110を確実に。調子が良ければ115へ挑戦" },
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
