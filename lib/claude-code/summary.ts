import { describeBranch, type BranchDescription } from "./naming";
import type { DashboardData, PullRequestSummary, RepoActivity } from "./types";

/** これ以上更新がないブランチは「要整理」とみなす日数 */
export const STALE_DAYS = 30;

export type BranchRow = BranchDescription & {
  repoName: string;
  repoNameWithOwner: string;
  repoUrl: string;
  lastCommitAt: string | null;
  lastCommitMessage: string | null;
  lastCommitAuthor: string | null;
  commitUrl: string | null;
  branchUrl: string;
  isDefault: boolean;
  pullRequest: PullRequestSummary | null;
  /** 最終更新からの経過日数（不明なら null） */
  ageDays: number | null;
  /** 30日以上放置されている作業ブランチ */
  isStale: boolean;
};

export function daysSince(iso: string | null): number | null {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms)) return null;
  return Math.floor(ms / (24 * 60 * 60 * 1000));
}

export function formatAge(days: number | null): string {
  if (days === null) return "不明";
  if (days <= 0) return "今日";
  if (days === 1) return "昨日";
  if (days < 30) return `${days}日前`;
  if (days < 365) return `${Math.floor(days / 30)}ヶ月前`;
  return `${Math.floor(days / 365)}年前`;
}

/**
 * ブランチ名を GitHub の tree URL 用にエンコードする。
 * `claude/foo` の `/` は階層区切りとしてそのまま残す必要があるため、
 * セグメントごとにエンコードする（全体を encodeURIComponent すると 404 になる）。
 */
function encodeBranchPath(name: string): string {
  return name.split("/").map(encodeURIComponent).join("/");
}

/** リポジトリ内のブランチを、表示用の行データに変換する */
export function toBranchRows(repo: RepoActivity): BranchRow[] {
  return repo.branches.map((b) => {
    const ageDays = daysSince(b.lastCommitAt);
    const description = describeBranch(b.name);
    return {
      ...description,
      repoName: repo.name,
      repoNameWithOwner: repo.nameWithOwner,
      repoUrl: repo.url,
      lastCommitAt: b.lastCommitAt,
      lastCommitMessage: b.lastCommitMessage,
      lastCommitAuthor: b.lastCommitAuthor,
      commitUrl: b.commitUrl,
      branchUrl: `${repo.url}/tree/${encodeBranchPath(b.name)}`,
      isDefault: b.isDefault,
      pullRequest: b.pullRequest,
      ageDays,
      isStale:
        !description.isTrunk &&
        !b.isDefault &&
        ageDays !== null &&
        ageDays >= STALE_DAYS,
    };
  });
}

export function allBranchRows(data: DashboardData): BranchRow[] {
  return data.repos.flatMap(toBranchRows);
}

export type DashboardTotals = {
  repoCount: number;
  branchCount: number;
  workBranchCount: number;
  staleCount: number;
  openPrCount: number;
  recentCommitCount: number;
  claudeCommitCount: number;
  claudeShare: number;
  activeRepoCount: number;
};

export function computeTotals(data: DashboardData): DashboardTotals {
  const rows = allBranchRows(data);
  const workBranches = rows.filter((r) => !r.isTrunk && !r.isDefault);
  const recentCommitCount = data.repos.reduce(
    (s, r) => s + r.recentCommitCount,
    0
  );
  const claudeCommitCount = data.repos.reduce(
    (s, r) => s + r.claudeCommitCount,
    0
  );

  return {
    repoCount: data.repos.length,
    branchCount: rows.length,
    workBranchCount: workBranches.length,
    staleCount: rows.filter((r) => r.isStale).length,
    openPrCount: data.repos.reduce((s, r) => s + r.openPullRequestCount, 0),
    recentCommitCount,
    claudeCommitCount,
    claudeShare: recentCommitCount
      ? Math.round((claudeCommitCount / recentCommitCount) * 100)
      : 0,
    activeRepoCount: data.repos.filter((r) => r.recentCommitCount > 0).length,
  };
}
