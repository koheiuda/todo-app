import Link from "next/link";
import { BranchCard } from "@/components/claude-code/branch-card";
import { describeRepoName } from "@/lib/claude-code/naming";
import { formatAge, daysSince, toBranchRows } from "@/lib/claude-code/summary";
import type { RepoActivity } from "@/lib/claude-code/types";

/** 概要ページで1リポジトリあたりに出すブランチ数 */
const PREVIEW_BRANCHES = 3;

export function RepoCard({ repo }: { repo: RepoActivity }) {
  const rows = toBranchRows(repo);
  const workBranches = rows.filter((r) => !r.isTrunk && !r.isDefault);
  const staleCount = rows.filter((r) => r.isStale).length;
  const preview = [...workBranches]
    .sort(
      (a, b) =>
        (a.ageDays ?? Number.MAX_SAFE_INTEGER) -
        (b.ageDays ?? Number.MAX_SAFE_INTEGER)
    )
    .slice(0, PREVIEW_BRANCHES);
  const japaneseName = describeRepoName(repo.name);

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <a
              href={repo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-base font-semibold text-neutral-900 hover:text-[#2d4fd4] truncate"
            >
              {repo.name}
            </a>
            {japaneseName !== repo.name && (
              <span className="text-xs text-neutral-500">（{japaneseName}）</span>
            )}
            <span className="inline-flex items-center px-1.5 py-0.5 rounded border border-neutral-200 bg-neutral-50 text-[11px] text-neutral-600">
              {repo.isPrivate ? "Private" : "Public"}
            </span>
            {repo.isArchived && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded border border-neutral-200 bg-neutral-100 text-[11px] text-neutral-500">
                アーカイブ済み
              </span>
            )}
          </div>
          {repo.description && (
            <p className="mt-1 text-xs text-neutral-500 line-clamp-1">
              {repo.description}
            </p>
          )}
        </div>
        <p className="shrink-0 text-xs text-neutral-500">
          最終更新 {formatAge(daysSince(repo.pushedAt))}
        </p>
      </div>

      <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
        <MiniStat label="ブランチ" value={repo.branchTotalCount} />
        <MiniStat label="作業中" value={workBranches.length} />
        <MiniStat
          label="要整理"
          value={staleCount}
          tone={staleCount > 0 ? "warning" : "neutral"}
        />
        <MiniStat
          label="オープンPR"
          value={repo.openPullRequestCount}
          tone={repo.openPullRequestCount > 0 ? "accent" : "neutral"}
        />
      </div>

      <p className="mt-3 text-xs text-neutral-500">
        直近30日のコミット {repo.recentCommitCount} 件
        {repo.recentCommitCount > 0 && (
          <span className="text-amber-700">
            （うち Claude {repo.claudeCommitCount} 件）
          </span>
        )}
      </p>

      {preview.length > 0 && (
        <div className="mt-3 space-y-2">
          <p className="text-xs font-medium text-neutral-500">
            最近動いた作業ブランチ
          </p>
          {preview.map((b) => (
            <BranchCard key={b.raw} branch={b} />
          ))}
          {workBranches.length > preview.length && (
            <Link
              href={`/claude-code/branches?repo=${encodeURIComponent(repo.name)}`}
              className="inline-block text-xs text-[#2d4fd4] hover:underline"
            >
              残り {workBranches.length - preview.length} 件を見る →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

function MiniStat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number;
  tone?: "neutral" | "warning" | "accent";
}) {
  const valueClass =
    tone === "warning"
      ? "text-amber-700"
      : tone === "accent"
        ? "text-[#2d4fd4]"
        : "text-neutral-900";
  return (
    <div className="rounded-lg bg-neutral-50 px-3 py-2">
      <p className="text-[11px] text-neutral-500">{label}</p>
      <p className={`text-lg font-semibold ${valueClass}`}>{value}</p>
    </div>
  );
}
