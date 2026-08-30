import Link from "next/link";
import {
  BranchExplorer,
  type FilterId,
} from "@/components/claude-code/branch-explorer";
import { SetupNotice } from "@/components/claude-code/setup-notice";
import { PageHeader } from "@/components/accounting/page-header";
import { fetchDashboardData } from "@/lib/claude-code/github";
import { allBranchRows } from "@/lib/claude-code/summary";

export const metadata = { title: "ブランチ一覧 | Claude Code" };
export const dynamic = "force-dynamic";

const VALID_FILTERS: FilterId[] = ["all", "stale", "pr", "active", "trunk"];

function toFilter(value: string | undefined): FilterId {
  return VALID_FILTERS.includes(value as FilterId)
    ? (value as FilterId)
    : "all";
}

export default async function ClaudeCodeBranchesPage({
  searchParams,
}: {
  searchParams: Promise<{ repo?: string; filter?: string }>;
}) {
  const [params, result] = await Promise.all([
    searchParams,
    fetchDashboardData(),
  ]);

  if (!result.ok) {
    return (
      <div className="max-w-3xl">
        <PageHeader
          title="ブランチ一覧"
          description="全リポジトリのブランチを横断して確認する"
        />
        <SetupNotice reason={result.reason} message={result.message} />
      </div>
    );
  }

  const { data } = result;
  const rows = allBranchRows(data);
  const repoNames = data.repos.map((r) => r.name);
  const initialRepo =
    params.repo && repoNames.includes(params.repo) ? params.repo : "all";

  return (
    <div className="max-w-6xl">
      <PageHeader
        title="ブランチ一覧"
        description={`${data.repos.length} リポジトリ・${rows.length} ブランチ。ブランチ名は日本語に読み替えて表示しています。`}
        actions={
          <Link
            href="/claude-code"
            className="px-3 py-1.5 rounded-lg border border-neutral-200 bg-white text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            概要へ戻る
          </Link>
        }
      />
      <BranchExplorer
        rows={rows}
        repoNames={repoNames}
        initialRepo={initialRepo}
        initialFilter={toFilter(params.filter)}
      />
    </div>
  );
}
