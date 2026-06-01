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
  currentMax: "現時点でも105kg×1（1発のみ）は挙上可能。第1週の80kg×3回×4セットも余裕。ブランクの影響はほぼ無く、伸びしろあり",
  weakness:
    "中間スティッキングポイント（三頭出力不足＋初速不足）",
} as const;

/** 現状を踏まえた戦略の見立て（115kg必達モード） */
export const STRATEGY_NOTE =
  "目標を 115kg「必達」に再設定。105kg×1 が今出て、第1週の 80kg×3回×4セットも余裕だった以上、土台は本物。負荷を一段引き上げた攻めの設計に組み直した。115kg は現MAX比 約110%＝4週で +10kg の挑戦で楽ではないが、①各週の重量を底上げ ②本番重量(115kg)の保持で神経系を“重さ”に慣らす ③第3週に 110kg×1 を実際に通す、の3点で到達確率を最大化する。最大の分岐点は第3週D3の 110kg×1。これが動けば 115 は本番のピーキング次第で十分に射程。動かなければ無理せず 110〜112.5 で確実に更新し、115 は次サイクルに回す判断。";

export const GOALS = {
  /** 必達ライン（今回はここを死守） */
  safe: 115,
  /** 調子が良ければ狙うストレッチ */
  bonus: 117.5,
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

/* ──────────────────────────────────────────────
 * 回復・筋肉痛(DOMS)対策（超回復）
 * deep-research（99研究メタ分析ほか・2026-06-01検証）に基づく。
 * 本人の現状（睡眠6h・P155g≒2.2g/kg・クレアチン5g済み）に合わせて
 * 優先順位を最適化している。画面・AIコンテキスト共通。
 * ────────────────────────────────────────────── */

/** 5/30の胸トレ痛が6/1も残る課題への見立て */
export const RECOVERY_NOTE =
  "5/30の胸トレの痛みが6/1も残るのは、DOMS（遅発性筋肉痛）のピークが24〜72時間という生理に沿った“正常範囲”。久々・高ボリュームの初回は特に長引く。カギは『同じ刺激を繰り返すほどDOMSは軽くなる』反復ボート効果（repeated bout effect）。最初の2〜3週は1回目を抑えめにして回数を重ねれば、中1日でも回せる体に変わっていく。万能の“超回復最速化”は存在せず、(1)回復を妨げない設計＋(2)効果の確かな少数の介入、の合わせ技が合理的。";

export type RecoveryLever = {
  /** 優先度（1が最優先） */
  rank: number;
  /** 施策名 */
  title: string;
  /** 具体的にどうするか（本人の状況に合わせた指示） */
  how: string;
  /** エビデンスの要点（出典名込み） */
  evidence: string;
  /** 確度 */
  grade: "高" | "中";
};

/** 効くレバー（本人最適化の優先順）。上から効果が確かで、本人の伸びしろが大きい順 */
export const RECOVERY_LEVERS: RecoveryLever[] = [
  {
    rank: 1,
    title: "睡眠を 6h → 7〜9h に（最優先・最大のレバー）",
    how: "現状6hが回復面の最大ボトルネック。就寝・起床時刻を固定し、最低7h、可能なら7.5〜9hを確保。特にトレ日の夜は死守。",
    evidence:
      "睡眠不足(4h×5夜)で筋修復の中核=筋原線維タンパク質合成(MyoPS)が低下。運動はその低下を部分的に防ぐが、睡眠の確保が前提（Saner 2020, J Physiol）。",
    grade: "高",
  },
  {
    rank: 2,
    title: "就寝前にタンパク質 40g",
    how: "総量（現状P155g≒2.2g/kg）は十分。配分を見直し、就寝前にカゼイン系40g前後（ギリシャヨーグルト／カッテージチーズ／カゼインプロテイン）を足すと夜間の修復が伸びる。",
    evidence:
      "就寝前40gで睡眠中の筋タンパク質合成が約+22%（Res 2012／Trommelen 2016）。タンパク質は約1.3g/kgでプラトーだがトレ併用で高用量も有効（Tagawa 2021）。",
    grade: "高",
  },
  {
    rank: 3,
    title: "マッサージ・フォームローラー ＋ 温浴／コントラスト浴",
    how: "筋肉痛を実際に軽くしたいなら、胸・三頭を軽くマッサージ/フォームローラー。入浴は温浴やコントラスト浴（温冷交代）。回復目的ではサウナ単体より温冷交代が向く。",
    evidence:
      "99研究メタ分析でDOMS回復に最も強いのはマッサージ、次いで冷水浴・コントラスト浴。ストレッチ・軽い有酸素・電気刺激は有意差なし（Dupuy 2018, Front Physiol）。",
    grade: "高",
  },
  {
    rank: 4,
    title: "最初は抑えめ → 段階的に増やす（漸進性）",
    how: "痛みが残る間は同部位の高強度反復を避け、重量・セット・RPEを1〜2割落とす。初回後の2〜3週で段階的に戻すと、同じ刺激への痛みが自然に減っていく。",
    evidence:
      "反復ボート効果＝同一刺激を繰り返すほどDOMSが軽減。各筋群は週2回以上が筋肥大に有利で、要はボリュームを管理しつつ積むこと（Schoenfeld 2016）。",
    grade: "中",
  },
  {
    rank: 5,
    title: "サプリ：クレアチン継続＋オメガ3・クルクミンは補助",
    how: "クレアチン5g/日は継続でOK。オメガ3(EPA/DHA)とクルクミン（吸収性の高い製剤）は日常のベース栄養として。ただし筋肉痛が劇的に消えるほどの体感は期待しない。",
    evidence:
      "回復栄養で相対的に最有力はタルトチェリーとオメガ3、クルクミン等は中程度（Barnes 2023）。オメガ3は48hのDOMSを有意に減らすが臨床的最小差未満（Lv 2020）、クルクミンは筋肉痛・CK低下に有意（Beba 2022）。",
    grade: "中",
  },
];

export type RecoveryMyth = { myth: string; truth: string };

/** やりがちな誤解・逆効果 */
export const RECOVERY_MYTHS: RecoveryMyth[] = [
  {
    myth: "トレ直後に冷水浴・アイシングすると回復が早まる",
    truth:
      "筋肉痛“軽減”には効くが、トレ直後の冷水浴は筋肥大・筋力の長期適応を有意に抑制（Roberts 2015）。増量・筋肥大が目的の今は直後の冷水浴を避け、温浴・コントラスト浴・マッサージを選ぶ。回復優先の調整期（第4週・本番直前）に限定使用ならOK。",
  },
  {
    myth: "ストレッチをすれば筋肉痛は消える",
    truth:
      "ストレッチはDOMSを意味あるレベルでは減らさない（Dupuy 2018／Cochrane Herbert 2011）。気持ちよさはあるが“治療”ではない。",
  },
  {
    myth: "トレ後30分以内（ゴールデンタイム）に飲まないと無駄",
    truth:
      "アナボリックウィンドウは従来言われたほど狭くない。直前・直後と3時間ずらした摂取でも筋力・体組成に差なし（Lak 2024）。1日の総量と配分を優先すればよい。",
  },
];

/** 中1日（48時間間隔）の胸トレを回すための実践プロトコル */
export const RECOVERY_PROTOCOL: string[] = [
  "痛みが残る日は、痛む部位の高強度反復を避け重量・セットを1〜2割落とす（完全休養より軽く動かす方が回復向き）",
  "最初の2〜3週は“1回目を抑えめ”に。回数を重ねるほど痛みは軽くなる（反復ボート効果）",
  "睡眠は最低7h死守。トレ日の夜は特に優先する",
  "就寝前にタンパク質40g。1日P150g前後を数回に分けて確保（直後に焦って飲む必要はない）",
  "トレ直後の冷水浴・アイシングは避ける（筋肥大目的）。マッサージ/フォームローラー＋温浴・コントラスト浴で回復",
  "痛みのピークは24〜72h。72h超で強い痛み・力が出ないなら、その部位はもう1日空けるかボリュームを減らす",
];

export type RecoverySource = { label: string; url: string };

/** 出典（検証済み一次・メタ分析中心） */
export const RECOVERY_SOURCES: RecoverySource[] = [
  { label: "Dupuy 2018 (Front Physiol) 回復手段の99研究メタ分析", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC5932411/" },
  { label: "Roberts 2015 (J Physiol) 冷水浴と筋適応", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4594298/" },
  { label: "Barnes 2023 (Nutrients) 回復のための栄養レビュー", url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10255909/" },
  { label: "Lv 2020 オメガ3とDOMSの12RCTメタ分析", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC7195643/" },
  { label: "Beba 2022 (Phytother Res) クルクミンの用量反応メタ分析", url: "https://pubmed.ncbi.nlm.nih.gov/35574627/" },
  { label: "Tagawa 2021 (Nutr Rev) タンパク質の用量反応メタ分析", url: "https://academic.oup.com/nutritionreviews/article/79/1/66/5936522" },
  { label: "Trommelen & van Loon 2016 (Nutrients) 就寝前タンパク質", url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5188418/" },
  { label: "Saner 2020 (J Physiol) 睡眠不足と筋タンパク質合成", url: "https://physoc.onlinelibrary.wiley.com/doi/full/10.1113/JP278828" },
  { label: "Schoenfeld 2016 トレ頻度のメタ分析", url: "https://pubmed.ncbi.nlm.nih.gov/27102172/" },
];

export const ROADMAP: RoadmapWeek[] = [
  {
    week: 1,
    range: "6/1-7",
    start: "2026-06-01",
    end: "2026-06-07",
    theme: "再習熟＋負荷上げ",
    note: "80kg×3回×4セットが余裕だったので初週から一段重く。重量に体を慣らしつつ、爆発的挙上で弱点の初速も同時に作る。RPE8（あと2回残す）を上限に、フォームが崩れない範囲で攻める。",
    days: [
      { label: "D1", weightKg: 85, reps: "3", sets: 4, role: "高重量に慣らす（現MAX比 約81%）。余裕なら次週90へ前倒し可" },
      { label: "D2", weightKg: 65, reps: "5", sets: 4, cue: "爆発的", role: "胸から弾き飛ばす意識で初速づくり（弱点対策）" },
      { label: "D3", weightKg: 80, reps: "5", sets: 4, role: "中重量でボリュームを稼ぎフォームを固める" },
    ],
  },
  {
    week: 2,
    range: "6/8-14",
    start: "2026-06-08",
    end: "2026-06-14",
    theme: "出力強化",
    note: "中間スティッキングを突破する最大筋力を作る週。三頭（ナロー）と中間（ポーズ）に弱点をピンポイントで叩き込む。D1の95kgが2〜3回しっかり挙がれば115は現実味が増す。",
    days: [
      { label: "D1", weightKg: 95, reps: "2〜3", sets: 4, role: "高重量（約90%）で最大筋力を底上げ" },
      { label: "D2", variation: "ナロー", weightKg: 72.5, reps: "8", sets: 3, role: "三頭出力を集中強化（弱点の根治）" },
      { label: "D3", variation: "ポーズ", weightKg: 82.5, reps: "4", sets: 3, role: "胸で1秒静止し反動なしの中間パワー強化" },
    ],
  },
  {
    week: 3,
    range: "6/15-21",
    start: "2026-06-15",
    end: "2026-06-21",
    theme: "ピーク",
    note: "神経系を本番のMAXへ寄せる最重要週。本番重量115kgを担いで保持し“重さ”に慣らす。D3の110kg×1が今サイクルの最大の分岐点——通れば115必達ライン、詰まれば本番は110〜112.5で確実更新に切替。",
    days: [
      { label: "D1", weightKg: 102.5, reps: "1〜2", sets: 3, extra: "＋ 115kg保持10〜15秒 × 2〜3セット", role: "ニアMAX（約98%）＋本番重量115kgの保持で神経系を順応" },
      { label: "D2", weightKg: 70, reps: "5", sets: 3, cue: "速く", role: "軽めを速く。疲労を抜きつつ初速をキープ" },
      { label: "D3", weightKg: 110, reps: "1", sets: 1, cue: "必達の関門", extra: "→ 92.5kg × 3回 × 3セット", role: "現MAX超え110kg×1（約105%）。ここが動けば115は射程" },
    ],
  },
  {
    week: 4,
    range: "6/22-30",
    start: "2026-06-22",
    end: "2026-06-30",
    theme: "調整",
    note: "疲労を完全に抜いて本番1日にピークを合わせる週。やり込みは厳禁、回復＞刺激。当日は110→115（必達）→調子が良ければ117.5。",
    days: [
      { label: "6/23のみ", weightKg: 80, reps: "2", sets: 2, role: "軽く動作だけ確認（神経の入れ直し）" },
      { label: "以降", freeform: "完全休養", role: "神経系をフル回復させる" },
      { label: "6/29", freeform: "本番：110kg(調整) → 115kg(必達) → 117.5kg(調子次第)", role: "110で軌道確認 → 115を必達 → 余力あれば117.5へ" },
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
