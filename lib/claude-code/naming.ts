/**
 * ブランチ名・リポジトリ名を日本語で読める形に変換するためのユーティリティ。
 *
 * Claude Code が作るブランチは `claude/todo-accounting-improvements-0iwz13` のように
 * 英字のみ＋末尾にランダム文字列が付くため、一覧で見ても中身が分からない。
 * ここでは「種別バッジ」「日本語タイトル推定」に分解して視認性を上げる。
 */

export type Tone =
  | "blue"
  | "rose"
  | "amber"
  | "violet"
  | "emerald"
  | "gray"
  | "sky";

export type BranchKind = {
  id: string;
  label: string;
  tone: Tone;
};

const DEFAULT_KIND: BranchKind = { id: "other", label: "その他", tone: "gray" };

/** ブランチ名の接頭辞（`feat/` など）→ 種別 */
const PREFIX_KINDS: Record<string, BranchKind> = {
  feat: { id: "feat", label: "新機能", tone: "blue" },
  feature: { id: "feat", label: "新機能", tone: "blue" },
  fix: { id: "fix", label: "不具合修正", tone: "rose" },
  bugfix: { id: "fix", label: "不具合修正", tone: "rose" },
  hotfix: { id: "hotfix", label: "緊急修正", tone: "rose" },
  refactor: { id: "refactor", label: "リファクタ", tone: "violet" },
  style: { id: "style", label: "見た目調整", tone: "violet" },
  perf: { id: "perf", label: "性能改善", tone: "amber" },
  chore: { id: "chore", label: "雑務", tone: "gray" },
  docs: { id: "docs", label: "ドキュメント", tone: "gray" },
  doc: { id: "docs", label: "ドキュメント", tone: "gray" },
  test: { id: "test", label: "テスト", tone: "gray" },
  ci: { id: "ci", label: "CI設定", tone: "gray" },
  build: { id: "build", label: "ビルド設定", tone: "gray" },
  release: { id: "release", label: "リリース", tone: "emerald" },
  claude: { id: "claude", label: "Claude生成", tone: "amber" },
  codex: { id: "codex", label: "AI生成", tone: "amber" },
};

/** 本番・共通ブランチ */
const TRUNK_NAMES: Record<string, string> = {
  main: "本番（メイン）",
  master: "本番（マスター）",
  develop: "開発（develop）",
  dev: "開発（dev）",
  staging: "ステージング",
  production: "本番（production）",
};

/**
 * スラッグ内の英単語 → 日本語。
 * 見つからない単語はそのまま残すので、辞書は「よく出るものだけ」で十分。
 */
const WORD_DICTIONARY: Record<string, string> = {
  // プロダクト領域
  todo: "ToDo",
  task: "タスク",
  tasks: "タスク",
  training: "筋トレ",
  workout: "筋トレ",
  muscle: "筋トレ",
  gym: "筋トレ",
  recovery: "回復",
  doms: "筋肉痛",
  accounting: "会計",
  invoice: "請求書",
  invoices: "請求書",
  outsourcing: "外注費",
  client: "取引先",
  clients: "取引先",
  company: "自社情報",
  news: "ニュース",
  seo: "SEO",
  tweet: "ツイート",
  tweets: "ツイート",
  post: "投稿",
  posts: "投稿",
  scheduled: "予約投稿",
  schedule: "予約",
  youtube: "YouTube",
  // 画面・UI
  dashboard: "ダッシュボード",
  tab: "タブ",
  tabs: "タブ",
  header: "ヘッダー",
  sidebar: "サイドバー",
  nav: "ナビ",
  navigation: "ナビ",
  page: "ページ",
  view: "画面",
  ui: "UI",
  ux: "UX",
  layout: "レイアウト",
  chart: "グラフ",
  graph: "グラフ",
  table: "テーブル",
  form: "フォーム",
  modal: "モーダル",
  button: "ボタン",
  mobile: "モバイル",
  responsive: "レスポンシブ",
  dark: "ダークモード",
  theme: "テーマ",
  design: "デザイン",
  // 動作
  add: "追加",
  create: "作成",
  new: "新規",
  remove: "削除",
  delete: "削除",
  update: "更新",
  improve: "改善",
  improvement: "改善",
  improvements: "改善",
  enhance: "改善",
  cleanup: "整理",
  clean: "整理",
  organize: "整理",
  rename: "名称変更",
  rich: "リッチ化",
  support: "対応",
  migrate: "移行",
  migration: "移行",
  import: "取り込み",
  export: "書き出し",
  sync: "同期",
  bug: "不具合",
  // 技術
  api: "API",
  db: "DB",
  database: "DB",
  schema: "スキーマ",
  auth: "認証",
  login: "ログイン",
  user: "ユーザー",
  users: "ユーザー",
  setting: "設定",
  settings: "設定",
  config: "設定",
  env: "環境変数",
  cron: "定期実行",
  mail: "メール",
  email: "メール",
  pdf: "PDF",
  csv: "CSV",
  report: "レポート",
  reporting: "レポート",
  rule: "ルール",
  rules: "ルール",
  readme: "README",
  docs: "ドキュメント",
  test: "テスト",
  tests: "テスト",
  lint: "Lint",
  build: "ビルド",
  deploy: "デプロイ",
  vercel: "Vercel",
  github: "GitHub",
  branch: "ブランチ",
  branches: "ブランチ",
  repo: "リポジトリ",
  repository: "リポジトリ",
  claude: "Claude",
  cloudecode: "Claude Code",
  claudecode: "Claude Code",
  search: "検索",
  filter: "フィルタ",
  script: "スクリプト",
  scripts: "スクリプト",
  sprint: "スプリント",
  switch: "切り替え",
  toggle: "切り替え",
  detail: "詳細",
  details: "詳細",
  strategy: "戦略",
  roadmap: "ロードマップ",
  timeline: "タイムライン",
  weight: "体重",
  coach: "コーチ",
};

/** Claude Code が自動生成する接尾辞の長さ（例: `bienzs` / `0iwz13`） */
const AI_SUFFIX_LENGTH = 6;

/**
 * Claude Code が付ける末尾のランダム文字列かどうかを推定する。
 * 実物は必ず 6 文字の英数字なので、まず長さで絞ってから
 * 「数字混じり」「母音なし」「子音3連続」「母音がごく少ない」で判定する。
 * 誤判定しても元のブランチ名は画面に併記されるため、情報は失われない。
 */
function looksLikeRandomSuffix(word: string): boolean {
  if (word.length !== AI_SUFFIX_LENGTH) return false;
  if (WORD_DICTIONARY[word]) return false;
  if (!/^[a-z0-9]+$/.test(word)) return false;
  if (/\d/.test(word)) return true;
  if (!/[aeiou]/.test(word)) return true;
  if (/[^aeiou]{3,}/.test(word)) return true;
  const vowelRatio = word.replace(/[^aeiou]/g, "").length / word.length;
  return vowelRatio <= 0.2;
}

function splitWords(slug: string): string[] {
  return slug
    .split(/[-_./\s]+/)
    .map((w) => w.trim().toLowerCase())
    .filter(Boolean);
}

export type BranchDescription = {
  /** 元のブランチ名（そのまま） */
  raw: string;
  /** 種別バッジ */
  kind: BranchKind;
  /** 日本語推定タイトル */
  title: string;
  /** ランダム接尾辞を除いたスラッグ */
  slug: string;
  /** main / master などの共通ブランチか */
  isTrunk: boolean;
  /** 日本語化できた単語が1つ以上あるか（推定の確度表示に使う） */
  translated: boolean;
};

/** ブランチ名を種別・日本語タイトルに分解する */
export function describeBranch(raw: string): BranchDescription {
  const name = raw.trim();
  const trunk = TRUNK_NAMES[name.toLowerCase()];
  if (trunk) {
    return {
      raw: name,
      kind: { id: "trunk", label: "本番", tone: "emerald" },
      title: trunk,
      slug: name,
      isTrunk: true,
      translated: true,
    };
  }

  const slashIndex = name.indexOf("/");
  const prefix = slashIndex > 0 ? name.slice(0, slashIndex).toLowerCase() : "";
  const rest = slashIndex > 0 ? name.slice(slashIndex + 1) : name;
  const kind = PREFIX_KINDS[prefix] ?? DEFAULT_KIND;

  let words = splitWords(rest);
  // Claude / Codex 系のブランチだけ、末尾のランダム文字列を落とす
  const isAiBranch = kind.id === "claude" || kind.id === "codex";
  if (isAiBranch && words.length > 1 && looksLikeRandomSuffix(words[words.length - 1])) {
    words = words.slice(0, -1);
  }

  const slug = words.join("-");
  const parts = words.map((w) => WORD_DICTIONARY[w] ?? w);
  const translated = words.some((w) => Boolean(WORD_DICTIONARY[w]));
  const title = parts.length > 0 ? parts.join("・") : name;

  return { raw: name, kind, title, slug, isTrunk: false, translated };
}

/** リポジトリ名を日本語寄りのラベルにする（辞書に無ければ元名のまま） */
export function describeRepoName(name: string): string {
  const words = splitWords(name);
  const parts = words.map((w) => WORD_DICTIONARY[w] ?? w);
  const translated = words.some((w) => Boolean(WORD_DICTIONARY[w]));
  return translated ? parts.join("・") : name;
}

export const TONE_CLASSES: Record<Tone, string> = {
  blue: "bg-blue-50 text-blue-700 border-blue-100",
  rose: "bg-rose-50 text-rose-700 border-rose-100",
  amber: "bg-amber-50 text-amber-700 border-amber-100",
  violet: "bg-violet-50 text-violet-700 border-violet-100",
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
  sky: "bg-sky-50 text-sky-700 border-sky-100",
  gray: "bg-neutral-100 text-neutral-600 border-neutral-200",
};
