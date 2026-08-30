export type BranchActivity = {
  /** ブランチ名（例: claude/todo-accounting-improvements-0iwz13） */
  name: string;
  /** 最終コミット日時（ISO） */
  lastCommitAt: string | null;
  /** 最終コミットの1行メッセージ（日本語のことが多く、最も強い手掛かり） */
  lastCommitMessage: string | null;
  /** 最終コミットの著者名 */
  lastCommitAuthor: string | null;
  /** そのブランチのコミットURL */
  commitUrl: string | null;
  /** デフォルトブランチか */
  isDefault: boolean;
  /** 紐づくオープンPR（あれば） */
  pullRequest: PullRequestSummary | null;
};

export type PullRequestSummary = {
  number: number;
  title: string;
  url: string;
  isDraft: boolean;
  headRefName: string;
  updatedAt: string;
};

export type RepoActivity = {
  name: string;
  nameWithOwner: string;
  url: string;
  description: string | null;
  isPrivate: boolean;
  isArchived: boolean;
  pushedAt: string | null;
  language: { name: string; color: string | null } | null;
  defaultBranch: string | null;
  /** GitHub 上のブランチ総数（取得上限を超えることがある） */
  branchTotalCount: number;
  branches: BranchActivity[];
  openPullRequests: PullRequestSummary[];
  openPullRequestCount: number;
  /** 集計期間内のデフォルトブランチのコミット数 */
  recentCommitCount: number;
  /** うち Claude が関与したコミット数 */
  claudeCommitCount: number;
};

export type ActivityPoint = {
  /** YYYY-MM-DD（JST） */
  date: string;
  /** 表示用ラベル（M/D） */
  label: string;
  total: number;
  claude: number;
};

export type DashboardData = {
  viewer: string;
  repos: RepoActivity[];
  activity: ActivityPoint[];
  /** 集計対象日数 */
  windowDays: number;
  fetchedAt: string;
};

export type DashboardResult =
  | { ok: true; data: DashboardData }
  | { ok: false; reason: "no-token" | "error"; message: string };
