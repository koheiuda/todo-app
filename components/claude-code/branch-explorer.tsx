"use client";

import { useMemo, useState } from "react";
import { BranchCard } from "@/components/claude-code/branch-card";
import type { BranchRow } from "@/lib/claude-code/summary";

export type FilterId = "all" | "stale" | "pr" | "active" | "trunk";

const FILTERS: { id: FilterId; label: string }[] = [
  { id: "all", label: "すべて" },
  { id: "active", label: "稼働中（14日以内）" },
  { id: "pr", label: "PRあり" },
  { id: "stale", label: "要整理（30日以上）" },
  { id: "trunk", label: "本番ブランチ" },
];

type SortId = "recent" | "oldest" | "name" | "repo";

const SORTS: { id: SortId; label: string }[] = [
  { id: "recent", label: "更新が新しい順" },
  { id: "oldest", label: "更新が古い順" },
  { id: "repo", label: "リポジトリ順" },
  { id: "name", label: "名前順" },
];

function matchesFilter(row: BranchRow, filter: FilterId): boolean {
  switch (filter) {
    case "stale":
      return row.isStale;
    case "pr":
      return Boolean(row.pullRequest);
    case "active":
      return (
        !row.isTrunk && row.ageDays !== null && row.ageDays <= 14
      );
    case "trunk":
      return row.isTrunk || row.isDefault;
    default:
      return true;
  }
}

export function BranchExplorer({
  rows,
  repoNames,
  initialRepo = "all",
  initialFilter = "all",
}: {
  rows: BranchRow[];
  repoNames: string[];
  initialRepo?: string;
  initialFilter?: FilterId;
}) {
  const [filter, setFilter] = useState<FilterId>(initialFilter);
  const [repo, setRepo] = useState<string>(initialRepo);
  const [sort, setSort] = useState<SortId>("recent");
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = rows.filter((row) => {
      if (!matchesFilter(row, filter)) return false;
      if (repo !== "all" && row.repoName !== repo) return false;
      if (!q) return true;
      return (
        row.raw.toLowerCase().includes(q) ||
        row.title.toLowerCase().includes(q) ||
        row.repoName.toLowerCase().includes(q) ||
        (row.lastCommitMessage ?? "").toLowerCase().includes(q)
      );
    });

    const sorted = [...filtered];
    sorted.sort((a, b) => {
      switch (sort) {
        case "oldest":
          return (a.ageDays ?? -1) === (b.ageDays ?? -1)
            ? a.raw.localeCompare(b.raw)
            : (b.ageDays ?? -1) - (a.ageDays ?? -1);
        case "name":
          return a.raw.localeCompare(b.raw);
        case "repo":
          return a.repoName === b.repoName
            ? (a.ageDays ?? 0) - (b.ageDays ?? 0)
            : a.repoName.localeCompare(b.repoName);
        default:
          return (a.ageDays ?? Number.MAX_SAFE_INTEGER) -
            (b.ageDays ?? Number.MAX_SAFE_INTEGER);
      }
    });
    return sorted;
  }, [rows, filter, repo, sort, query]);

  return (
    <div>
      <div className="bg-white rounded-xl border border-neutral-200 p-3 mb-4 space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => {
            const count = rows.filter((r) => matchesFilter(r, f.id)).length;
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  active
                    ? "bg-[#2d4fd4] text-white"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                }`}
              >
                {f.label}
                <span className={active ? "ml-1 text-white/80" : "ml-1 text-neutral-400"}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ブランチ名・コミットメッセージで検索"
            aria-label="ブランチ検索"
            className="flex-1 min-w-[200px] px-3 py-2 rounded-lg border border-neutral-200 text-sm outline-none focus:border-[#2d4fd4]"
          />
          <select
            value={repo}
            onChange={(e) => setRepo(e.target.value)}
            aria-label="リポジトリで絞り込み"
            className="px-3 py-2 rounded-lg border border-neutral-200 text-sm text-neutral-700 outline-none focus:border-[#2d4fd4]"
          >
            <option value="all">すべてのリポジトリ</option>
            {repoNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortId)}
            aria-label="並び替え"
            className="px-3 py-2 rounded-lg border border-neutral-200 text-sm text-neutral-700 outline-none focus:border-[#2d4fd4]"
          >
            {SORTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="text-xs text-neutral-500 mb-2">{visible.length} 件を表示中</p>

      {visible.length === 0 ? (
        <div className="bg-white rounded-xl border border-neutral-200 p-8 text-center text-sm text-neutral-400">
          条件に合うブランチがありません
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map((row) => (
            <BranchCard
              key={`${row.repoNameWithOwner}#${row.raw}`}
              branch={row}
              showRepo
            />
          ))}
        </div>
      )}
    </div>
  );
}
