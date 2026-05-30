import type { DailyReport, ReportInput } from "./types";

/**
 * 報告ログの薄い永続化レイヤー。
 * 今は localStorage 実装だが、将来クラウドDBに差し替えられるよう
 * 関数経由（getReports / addReport / ...）でのみアクセスする。
 */

const REPORTS_KEY = "training:reports";
const DRAFT_KEY = "training:draft";

const isBrowser = () => typeof window !== "undefined";

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/** 報告ログを日付降順（新しい順）で返す */
export function getReports(): DailyReport[] {
  if (!isBrowser()) return [];
  const data = localStorage.getItem(REPORTS_KEY);
  if (!data) return [];
  try {
    const parsed: DailyReport[] = JSON.parse(data);
    return [...parsed].sort((a, b) =>
      a.date === b.date
        ? b.createdAt.localeCompare(a.createdAt)
        : b.date.localeCompare(a.date)
    );
  } catch {
    return [];
  }
}

/** 報告を1件追加して、追加後の全件（降順）を返す */
export function addReport(
  input: ReportInput,
  feedback: string,
  model: string
): DailyReport[] {
  const report: DailyReport = {
    ...input,
    id: generateId(),
    feedback,
    model,
    createdAt: new Date().toISOString(),
  };
  const all = [report, ...getReports()];
  if (isBrowser()) localStorage.setItem(REPORTS_KEY, JSON.stringify(all));
  return getReports();
}

/** 報告を削除して、削除後の全件（降順）を返す */
export function deleteReport(id: string): DailyReport[] {
  const all = getReports().filter((r) => r.id !== id);
  if (isBrowser()) localStorage.setItem(REPORTS_KEY, JSON.stringify(all));
  return all;
}

/** 入力中の下書きを保存（自動保存用） */
export function saveDraft(draft: ReportInput): void {
  if (!isBrowser()) return;
  localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

export function loadDraft(): ReportInput | null {
  if (!isBrowser()) return null;
  const data = localStorage.getItem(DRAFT_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data) as ReportInput;
  } catch {
    return null;
  }
}

export function clearDraft(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(DRAFT_KEY);
}
