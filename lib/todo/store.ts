import type { Task, Workspace } from "./types";

const TASKS_KEY = "todo-app-tasks";
const WORKSPACES_KEY = "todo-app-workspaces";

const defaultWorkspaces: Workspace[] = [{ id: "personal", name: "Personal" }];

const seedTasks = (): Task[] => [
  {
    id: "1",
    title: "11:00〜 定例mtg（マーケチーム）",
    description: "Q3のKPI進捗を共有。広告チームからの報告あり。",
    completed: false,
    workspace: "personal",
    isToday: true,
    parentId: null,
    order: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: "1-1",
    title: "議事録を共有する",
    description: "",
    completed: false,
    workspace: "personal",
    isToday: true,
    parentId: "1",
    order: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    title: "LP改善案のワイヤーフレーム作成",
    description: "ファーストビューのCTA配置を3パターン検討。Figmaで作成。",
    completed: false,
    workspace: "personal",
    isToday: true,
    parentId: null,
    order: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: "3",
    title: "競合サイトのSEO分析レポート",
    description: "Ahrefsで上位5社の被リンク・流入KW比較。",
    completed: true,
    workspace: "personal",
    isToday: true,
    parentId: null,
    order: 2,
    createdAt: new Date().toISOString(),
  },
  {
    id: "4",
    title: "15:00〜 クライアントmtg（A社）",
    description:
      "先月のレポート報告と来月の施策提案。Zoomリンクはメールに記載。",
    completed: false,
    workspace: "personal",
    isToday: true,
    parentId: null,
    order: 3,
    createdAt: new Date().toISOString(),
  },
  {
    id: "4-1",
    title: "提案資料の最終チェック",
    description: "",
    completed: true,
    workspace: "personal",
    isToday: true,
    parentId: "4",
    order: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: "5",
    title: "Slack未読メッセージ対応",
    description: "",
    completed: false,
    workspace: "personal",
    isToday: true,
    parentId: null,
    order: 4,
    createdAt: new Date().toISOString(),
  },
  {
    id: "6",
    title: "月次レポートのデータ集計",
    description:
      "GA4とGSCからデータをエクスポートしてスプレッドシートにまとめる。",
    completed: false,
    workspace: "personal",
    isToday: false,
    parentId: null,
    order: 5,
    createdAt: new Date().toISOString(),
  },
  {
    id: "7",
    title: "ブログ記事の構成案作成",
    description: "",
    completed: false,
    workspace: "personal",
    isToday: false,
    parentId: null,
    order: 6,
    createdAt: new Date().toISOString(),
  },
];

const isBrowser = () => typeof window !== "undefined";

export function loadTasks(): Task[] {
  if (!isBrowser()) return seedTasks();
  const data = localStorage.getItem(TASKS_KEY);
  if (data) {
    const parsed: Task[] = JSON.parse(data);
    return parsed.map((t) => ({ ...t, description: t.description ?? "" }));
  }
  const seed = seedTasks();
  saveTasks(seed);
  return seed;
}

export function saveTasks(tasks: Task[]) {
  if (!isBrowser()) return;
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

export function loadWorkspaces(): Workspace[] {
  if (!isBrowser()) return defaultWorkspaces;
  const data = localStorage.getItem(WORKSPACES_KEY);
  if (data) return JSON.parse(data);
  saveWorkspaces(defaultWorkspaces);
  return defaultWorkspaces;
}

export function saveWorkspaces(workspaces: Workspace[]) {
  if (!isBrowser()) return;
  localStorage.setItem(WORKSPACES_KEY, JSON.stringify(workspaces));
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
