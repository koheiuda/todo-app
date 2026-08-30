import Link from "next/link";
import { ActivityChart } from "@/components/claude-code/activity-chart";
import { BranchCard } from "@/components/claude-code/branch-card";
import { RepoCard } from "@/components/claude-code/repo-card";
import { SetupNotice } from "@/components/claude-code/setup-notice";
import { StatCard } from "@/components/claude-code/stat-card";
import { PageHeader } from "@/components/accounting/page-header";
import { fetchDashboardData } from "@/lib/claude-code/github";
import {
  allBranchRows,
  computeTotals,
  STALE_DAYS,
} from "@/lib/claude-code/summary";

export const metadata = { title: "Claude Code ダッシュボード" };
/** 取得は lib 側で5分キャッシュしているため、ページ自体は都度描画する */
export const dynamic = "force-dynamic";

/** 「要整理」リストに出す最大件数 */
const STALE_PREVIEW = 8;

export default async function ClaudeCodeDashboardPage() {
  const result = await fetchDashboardData();

  if (!result.ok) {
    return (
      <div className="max-w-3xl">
        <PageHeader
          title="Claude Code ダッシュボード"
          description="リポジトリ・ブランチ・稼働状況をまとめて確認する"
        />
        <SetupNotice reason={result.reason} message={result.message} />
      </div>
    );
  }

  const { data } = result;
  const totals = computeTotals(data);
  const rows = allBranchRows(data);
  const stale = rows
    .filter((r) => r.isStale)
    .sort((a, b) => (b.ageDays ?? 0) - (a.ageDays ?? 0));

  return (
    <div className="max-w-6xl">
      <PageHeader
        title="Claude Code ダッシュボード"
        description={`@${data.viewer} のリポジトリ ${totals.repoCount} 件・直近${data.windowDays}日の稼働状況`}
        actions={
          <Link
            href="/claude-code/branches"
            className="px-3 py-1.5 rounded-lg bg-[#2d4fd4] text-white text-sm font-medium hover:bg-[#2843b8] transition-colors"
          >
            ブランチ一覧
          </Link>
        }
      />

      <section className="mb-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <StatCard
            label="リポジトリ"
            value={totals.repoCount}
            unit="件"
            hint={`直近${data.windowDays}日に稼働 ${totals.activeRepoCount} 件`}
          />
          <StatCard
            label="ブランチ総数"
            value={totals.branchCount}
            unit="本"
            hint={`うち作業ブランチ ${totals.workBranchCount} 本`}
          />
          <StatCard
            label="要整理ブランチ"
            value={totals.staleCount}
            unit="本"
            tone={totals.staleCount > 0 ? "warning" : "positive"}
            hint={`${STALE_DAYS}日以上更新なし`}
          />
          <StatCard
            label="オープンPR"
            value={totals.openPrCount}
            unit="件"
            tone={totals.openPrCount > 0 ? "accent" : "neutral"}
            hint="レビュー・マージ待ち"
          />
          <StatCard
            label="コミット"
            value={totals.recentCommitCount}
            unit="件"
            tone="accent"
            hint={`Claude 関与 ${totals.claudeCommitCount} 件（${totals.claudeShare}%）`}
          />
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-sm font-medium text-neutral-700 mb-3">
          稼働状況（直近{data.windowDays}日のコミット数）
        </h2>
        <ActivityChart data={data.activity} />
      </section>

      {stale.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-neutral-700">
              整理したいブランチ（{STALE_DAYS}日以上更新なし）
            </h2>
            {stale.length > STALE_PREVIEW && (
              <Link
                href="/claude-code/branches?filter=stale"
                className="text-xs text-[#2d4fd4] hover:underline"
              >
                すべて見る（{stale.length}件）→
              </Link>
            )}
          </div>
          <div className="space-y-2">
            {stale.slice(0, STALE_PREVIEW).map((row) => (
              <BranchCard
                key={`${row.repoNameWithOwner}#${row.raw}`}
                branch={row}
                showRepo
              />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-sm font-medium text-neutral-700 mb-3">
          リポジトリ別
        </h2>
        {data.repos.length === 0 ? (
          <div className="bg-white rounded-xl border border-neutral-200 p-8 text-center text-sm text-neutral-400">
            表示できるリポジトリがありません
          </div>
        ) : (
          <div className="space-y-3">
            {data.repos.map((repo) => (
              <RepoCard key={repo.nameWithOwner} repo={repo} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
