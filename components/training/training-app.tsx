"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  GOALS,
  currentWeek,
  daysUntilPeak,
  formatMenu,
  toYmd,
} from "@/lib/training/plan";
import {
  addReport,
  clearDraft,
  deleteReport,
  getReports,
  loadDraft,
  saveDraft,
} from "@/lib/training/store";
import { emptyDraft, type DailyReport, type ReportInput } from "@/lib/training/types";
import { ReportForm } from "./report-form";
import { Roadmap } from "./roadmap";
import { Timeline } from "./timeline";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

export function TrainingApp() {
  const [mounted, setMounted] = useState(false);
  const [today, setToday] = useState("");
  const [draft, setDraft] = useState<ReportInput>(() => emptyDraft(""));
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latest, setLatest] = useState<DailyReport | null>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);

  // 初期化（localStorage はクライアントのみ）
  useEffect(() => {
    const t = toYmd(new Date());
    setToday(t);
    const saved = loadDraft();
    setDraft(saved ?? emptyDraft(t));
    setReports(getReports());
    setMounted(true);
  }, []);

  // 下書き自動保存
  useEffect(() => {
    if (!mounted) return;
    saveDraft(draft);
  }, [draft, mounted]);

  const week = useMemo(() => (today ? currentWeek(today) : null), [today]);
  const countdown = useMemo(() => (today ? daysUntilPeak(today) : 0), [today]);

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report: draft, history: reports }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? `エラー (HTTP ${res.status})`);
      }

      const next = addReport(draft, data.feedback as string, data.model as string);
      setReports(next);
      setLatest(next.find((r) => r.feedback === data.feedback) ?? next[0]);
      clearDraft();
      setDraft(emptyDraft(today));
      toast.success("フィードバックが届きました");
      // フィードバックまでスクロール
      setTimeout(
        () => feedbackRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
        50
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      toast.error("フィードバックの取得に失敗しました");
    } finally {
      setSubmitting(false);
    }
  }, [draft, reports, today]);

  const handleDelete = useCallback((id: string) => {
    const next = deleteReport(id);
    setReports(next);
    setLatest((cur) => (cur?.id === id ? null : cur));
  }, []);

  if (!mounted) {
    return (
      <div className="text-sm text-neutral-400 py-12 text-center">読み込み中…</div>
    );
  }

  const weekday = WEEKDAYS[new Date(today + "T00:00:00").getDay()];

  return (
    <div className="flex flex-col gap-8">
      {/* ── 結論ファースト：今日やること ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-neutral-900">
            🏋️ ベンチ {GOALS.safe}kg必達 コーチ
          </h1>
        </div>

        <div className="rounded-xl bg-[#1e2a4a] text-white p-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs text-white/60 mb-1">
                {today}（{weekday}）／ トレ日：月・水・金
              </p>
              <p className="text-lg font-bold">
                {week ? `第${week.week}週「${week.theme}」` : "ロードマップ期間外"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-white/60">本番 6/29 まで</p>
              <p className="text-3xl font-bold tabular-nums">
                {countdown >= 0 ? `あと${countdown}日` : "終了"}
              </p>
            </div>
          </div>

          {week && (
            <ul className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
              {week.days.map((d, i) => (
                <li
                  key={i}
                  className="rounded-lg bg-white/10 px-3 py-2 text-sm"
                >
                  <span className="text-white/60 text-xs block">{d.label}</span>
                  <span className="font-medium tabular-nums">{formatMenu(d)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* ── 報告フォーム ── */}
      <section>
        <h2 className="text-sm font-semibold text-neutral-700 mb-3">
          今日の報告
        </h2>
        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <ReportForm
            value={draft}
            onChange={setDraft}
            onSubmit={handleSubmit}
            submitting={submitting}
          />
          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}
        </div>
      </section>

      {/* ── 直近のフィードバック ── */}
      {latest && (
        <section ref={feedbackRef}>
          <h2 className="text-sm font-semibold text-neutral-700 mb-3">
            コーチからのフィードバック（{latest.date}）
          </h2>
          <div className="rounded-xl bg-[#2d4fd4]/5 border border-[#2d4fd4]/20 p-5">
            <p className="text-sm text-neutral-800 whitespace-pre-wrap leading-relaxed">
              {latest.feedback}
            </p>
            <p className="mt-3 text-[10px] text-neutral-400">{latest.model}</p>
          </div>
        </section>
      )}

      {/* ── ロードマップ ── */}
      <section>
        <h2 className="text-sm font-semibold text-neutral-700 mb-3">
          当初の4週ロードマップ
        </h2>
        <Roadmap currentWeekNo={week?.week ?? null} />
      </section>

      {/* ── 報告ログ ── */}
      <section>
        <h2 className="text-sm font-semibold text-neutral-700 mb-3">
          報告ログ（{reports.length}件）
        </h2>
        <Timeline reports={reports} onDelete={handleDelete} />
      </section>
    </div>
  );
}
