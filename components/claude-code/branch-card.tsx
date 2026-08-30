import { TONE_CLASSES } from "@/lib/claude-code/naming";
import { formatAge, type BranchRow } from "@/lib/claude-code/summary";

export function BranchCard({
  branch,
  showRepo = false,
}: {
  branch: BranchRow;
  showRepo?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-3 transition-colors ${
        branch.isStale
          ? "border-amber-200 bg-amber-50/40"
          : "border-neutral-200 bg-white hover:border-neutral-300"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={`inline-flex items-center px-1.5 py-0.5 rounded border text-[11px] font-medium ${TONE_CLASSES[branch.kind.tone]}`}
            >
              {branch.kind.label}
            </span>
            {showRepo && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded border border-neutral-200 bg-neutral-50 text-[11px] text-neutral-600 font-mono">
                {branch.repoName}
              </span>
            )}
            {branch.isDefault && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded border border-emerald-100 bg-emerald-50 text-[11px] font-medium text-emerald-700">
                デフォルト
              </span>
            )}
            {branch.pullRequest && (
              <a
                href={branch.pullRequest.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-1.5 py-0.5 rounded border border-sky-100 bg-sky-50 text-[11px] font-medium text-sky-700 hover:bg-sky-100"
              >
                PR #{branch.pullRequest.number}
                {branch.pullRequest.isDraft ? "（下書き）" : ""}
              </a>
            )}
            {branch.isStale && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded border border-amber-200 bg-amber-100 text-[11px] font-medium text-amber-800">
                要整理
              </span>
            )}
          </div>

          <p className="mt-1.5 text-sm font-semibold text-neutral-900 truncate">
            {branch.title}
          </p>
          <p className="mt-0.5 text-[11px] font-mono text-neutral-400 truncate">
            {branch.raw}
          </p>

          {branch.lastCommitMessage && (
            <p className="mt-1.5 text-xs text-neutral-600 line-clamp-2">
              <span className="text-neutral-400">最新コミット：</span>
              {branch.lastCommitMessage}
            </p>
          )}
        </div>

        <div className="shrink-0 text-right">
          <p
            className={`text-xs font-medium ${
              branch.isStale ? "text-amber-700" : "text-neutral-500"
            }`}
          >
            {formatAge(branch.ageDays)}
          </p>
          <a
            href={branch.branchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-block text-[11px] text-[#2d4fd4] hover:underline"
          >
            GitHub ↗
          </a>
        </div>
      </div>
    </div>
  );
}
