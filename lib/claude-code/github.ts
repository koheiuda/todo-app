import { formatInTimeZone } from "date-fns-tz";
import type {
  ActivityPoint,
  BranchActivity,
  DashboardData,
  DashboardResult,
  PullRequestSummary,
  RepoActivity,
} from "./types";

const GITHUB_GRAPHQL_ENDPOINT = "https://api.github.com/graphql";
const TIME_ZONE = "Asia/Tokyo";

/** 集計対象の日数 */
export const WINDOW_DAYS = 30;
/** 取得結果をプロセス内に保持する時間（ミリ秒）。GitHub API を叩きすぎないため */
const CACHE_TTL_MS = 5 * 60 * 1000;
/** 取得するリポジトリ数の上限 */
const REPO_LIMIT = 20;
/** 1リポジトリあたり取得するブランチ数の上限 */
const BRANCH_LIMIT = 50;

const QUERY = /* GraphQL */ `
  query ClaudeCodeDashboard($repoLimit: Int!, $branchLimit: Int!, $since: GitTimestamp!) {
    viewer {
      login
      repositories(
        first: $repoLimit
        isFork: false
        affiliations: [OWNER, COLLABORATOR, ORGANIZATION_MEMBER]
        orderBy: { field: PUSHED_AT, direction: DESC }
      ) {
        nodes {
          name
          nameWithOwner
          url
          description
          isPrivate
          isArchived
          pushedAt
          primaryLanguage {
            name
            color
          }
          defaultBranchRef {
            name
            target {
              ... on Commit {
                history(first: 100, since: $since) {
                  totalCount
                  nodes {
                    committedDate
                    authors(first: 5) {
                      nodes {
                        name
                        email
                      }
                    }
                  }
                }
              }
            }
          }
          refs(
            refPrefix: "refs/heads/"
            first: $branchLimit
            orderBy: { field: TAG_COMMIT_DATE, direction: DESC }
          ) {
            totalCount
            nodes {
              name
              target {
                ... on Commit {
                  committedDate
                  messageHeadline
                  url
                  author {
                    name
                  }
                }
              }
            }
          }
          pullRequests(
            states: [OPEN]
            first: 30
            orderBy: { field: UPDATED_AT, direction: DESC }
          ) {
            totalCount
            nodes {
              number
              title
              url
              isDraft
              headRefName
              updatedAt
            }
          }
        }
      }
    }
  }
`;

type GqlCommit = {
  committedDate: string;
  messageHeadline?: string;
  url?: string;
  author?: { name: string | null } | null;
  authors?: { nodes: ({ name: string | null; email: string | null } | null)[] };
};

type GqlRepo = {
  name: string;
  nameWithOwner: string;
  url: string;
  description: string | null;
  isPrivate: boolean;
  isArchived: boolean;
  pushedAt: string | null;
  primaryLanguage: { name: string; color: string | null } | null;
  defaultBranchRef: {
    name: string;
    target: {
      history?: { totalCount: number; nodes: (GqlCommit | null)[] };
    } | null;
  } | null;
  refs: {
    totalCount: number;
    nodes: ({ name: string; target: GqlCommit | null } | null)[];
  } | null;
  pullRequests: {
    totalCount: number;
    nodes: (PullRequestSummary | null)[];
  } | null;
};

type GqlResponse = {
  data?: {
    viewer?: {
      login: string;
      repositories?: { nodes: (GqlRepo | null)[] };
    };
  };
  errors?: { message: string }[];
};

function readToken(): string | null {
  const token =
    process.env.GITHUB_TOKEN ??
    process.env.GH_TOKEN ??
    process.env.GITHUB_PAT ??
    "";
  return token.trim() ? token.trim() : null;
}

/** Claude が書いた（Co-Authored-By 含む）コミットかどうか */
function isClaudeAuthor(name: string | null, email: string | null): boolean {
  const n = (name ?? "").toLowerCase();
  const e = (email ?? "").toLowerCase();
  return (
    n.includes("claude") ||
    e.includes("anthropic.com") ||
    e.includes("claude")
  );
}

function jstDateKey(iso: string): string {
  return formatInTimeZone(new Date(iso), TIME_ZONE, "yyyy-MM-dd");
}

function buildEmptyActivity(days: number): ActivityPoint[] {
  const points: ActivityPoint[] = [];
  const now = Date.now();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now - i * 24 * 60 * 60 * 1000);
    points.push({
      date: formatInTimeZone(d, TIME_ZONE, "yyyy-MM-dd"),
      label: formatInTimeZone(d, TIME_ZONE, "M/d"),
      total: 0,
      claude: 0,
    });
  }
  return points;
}

function normalizeRepo(repo: GqlRepo): RepoActivity {
  const defaultBranch = repo.defaultBranchRef?.name ?? null;

  const openPullRequests = (repo.pullRequests?.nodes ?? []).filter(
    (pr): pr is PullRequestSummary => Boolean(pr)
  );
  const prByBranch = new Map<string, PullRequestSummary>();
  for (const pr of openPullRequests) {
    if (!prByBranch.has(pr.headRefName)) prByBranch.set(pr.headRefName, pr);
  }

  const branches: BranchActivity[] = (repo.refs?.nodes ?? [])
    .filter((ref): ref is { name: string; target: GqlCommit | null } =>
      Boolean(ref)
    )
    .map((ref) => ({
      name: ref.name,
      lastCommitAt: ref.target?.committedDate ?? null,
      lastCommitMessage: ref.target?.messageHeadline ?? null,
      lastCommitAuthor: ref.target?.author?.name ?? null,
      commitUrl: ref.target?.url ?? null,
      isDefault: ref.name === defaultBranch,
      pullRequest: prByBranch.get(ref.name) ?? null,
    }));

  const history = repo.defaultBranchRef?.target?.history;
  const historyNodes = (history?.nodes ?? []).filter((c): c is GqlCommit =>
    Boolean(c)
  );
  const claudeCommitCount = historyNodes.filter((c) =>
    (c.authors?.nodes ?? []).some((a) =>
      a ? isClaudeAuthor(a.name, a.email) : false
    )
  ).length;

  return {
    name: repo.name,
    nameWithOwner: repo.nameWithOwner,
    url: repo.url,
    description: repo.description,
    isPrivate: repo.isPrivate,
    isArchived: repo.isArchived,
    pushedAt: repo.pushedAt,
    language: repo.primaryLanguage,
    defaultBranch,
    branchTotalCount: repo.refs?.totalCount ?? branches.length,
    branches,
    openPullRequests,
    openPullRequestCount: repo.pullRequests?.totalCount ?? openPullRequests.length,
    recentCommitCount: historyNodes.length,
    claudeCommitCount,
  };
}

function buildActivity(repos: GqlRepo[], days: number): ActivityPoint[] {
  const points = buildEmptyActivity(days);
  const index = new Map(points.map((p, i) => [p.date, i]));

  for (const repo of repos) {
    const nodes = (repo.defaultBranchRef?.target?.history?.nodes ?? []).filter(
      (c): c is GqlCommit => Boolean(c)
    );
    for (const commit of nodes) {
      const key = jstDateKey(commit.committedDate);
      const i = index.get(key);
      if (i === undefined) continue;
      points[i].total += 1;
      const byClaude = (commit.authors?.nodes ?? []).some((a) =>
        a ? isClaudeAuthor(a.name, a.email) : false
      );
      if (byClaude) points[i].claude += 1;
    }
  }
  return points;
}

let cache: { at: number; result: DashboardResult } | null = null;

/**
 * GitHub からリポジトリ・ブランチ・PR・直近コミットをまとめて取得する。
 * トークン未設定でも例外を投げず、`ok: false` を返して画面側で案内を出す。
 * 成功結果は 5 分間プロセス内に保持し、連続アクセスでも API を叩かない。
 */
export async function fetchDashboardData(): Promise<DashboardResult> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) {
    return cache.result;
  }
  const result = await requestDashboardData();
  // 失敗はキャッシュしない（設定を直したらすぐ反映されるように）
  if (result.ok) cache = { at: Date.now(), result };
  return result;
}

async function requestDashboardData(): Promise<DashboardResult> {
  const token = readToken();
  if (!token) {
    return {
      ok: false,
      reason: "no-token",
      message: "GITHUB_TOKEN が設定されていません。",
    };
  }

  const since = new Date(
    Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  let json: GqlResponse;
  try {
    const res = await fetch(GITHUB_GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/vnd.github+json",
        "User-Agent": "todo-app-claude-code-dashboard",
      },
      body: JSON.stringify({
        query: QUERY,
        variables: {
          repoLimit: REPO_LIMIT,
          branchLimit: BRANCH_LIMIT,
          since,
        },
      }),
      cache: "no-store",
    });

    if (!res.ok) {
      const detail =
        res.status === 401
          ? "トークンが無効か、権限が足りません（repo スコープが必要です）。"
          : `GitHub API がステータス ${res.status} を返しました。`;
      return { ok: false, reason: "error", message: detail };
    }

    json = (await res.json()) as GqlResponse;
  } catch {
    return {
      ok: false,
      reason: "error",
      message: "GitHub API への接続に失敗しました。",
    };
  }

  if (json.errors?.length) {
    return {
      ok: false,
      reason: "error",
      message: json.errors.map((e) => e.message).join(" / "),
    };
  }

  const viewer = json.data?.viewer;
  if (!viewer) {
    return {
      ok: false,
      reason: "error",
      message: "GitHub API から想定した形式の応答が得られませんでした。",
    };
  }

  const rawRepos = (viewer.repositories?.nodes ?? []).filter(
    (r): r is GqlRepo => Boolean(r)
  );

  const data: DashboardData = {
    viewer: viewer.login,
    repos: rawRepos.map(normalizeRepo),
    activity: buildActivity(rawRepos, WINDOW_DAYS),
    windowDays: WINDOW_DAYS,
    fetchedAt: new Date().toISOString(),
  };

  return { ok: true, data };
}
