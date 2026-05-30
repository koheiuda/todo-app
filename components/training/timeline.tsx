"use client";

import { TRAINED_LABELS, type DailyReport } from "@/lib/training/types";
import { WeightChart, type WeightPoint } from "./weight-chart";

export function Timeline({
  reports,
  onDelete,
}: {
  reports: DailyReport[];
  onDelete: (id: string) => void;
}) {
  // 体重推移は古い順（左→右で時間が進む）
  const weightData: WeightPoint[] = reports
    .filter((r) => r.weightKg != null)
    .map((r) => ({ date: r.date, weight: Number(r.weightKg) }))
    .sort((a, b) => a.date.localeCompare(b.date));

  if (reports.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-neutral-200 p-8 text-center text-sm text-neutral-400">
        まだ報告がありません。上のフォームから今日の状況を記録しましょう。
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <WeightChart data={weightData} />

      <div className="space-y-3">
        {reports.map((r) => (
          <ReportCard key={r.id} report={r} onDelete={() => onDelete(r.id)} />
        ))}
      </div>
    </div>
  );
}

function ReportCard({
  report: r,
  onDelete,
}: {
  report: DailyReport;
  onDelete: () => void;
}) {
  const facts: string[] = [];
  if (r.weightKg != null) facts.push(`体重 ${Number(r.weightKg).toFixed(1)}kg`);
  if (r.sleepHours != null) facts.push(`睡眠 ${r.sleepHours}h`);
  if (r.trained) facts.push(TRAINED_LABELS[r.trained]);

  return (
    <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-neutral-50 border-b border-neutral-100">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-bold text-neutral-800">{r.date}</span>
          {facts.map((f, i) => (
            <span
              key={i}
              className="text-xs text-neutral-500 tabular-nums"
            >
              {f}
            </span>
          ))}
        </div>
        <button
          type="button"
          onClick={() => {
            if (confirm(`${r.date} の報告を削除しますか？`)) onDelete();
          }}
          className="text-xs text-neutral-400 hover:text-red-600 transition-colors shrink-0"
        >
          削除
        </button>
      </div>

      <div className="px-4 py-3 space-y-3">
        {r.workout.trim() && (
          <Field label="やった内容" value={r.workout} />
        )}
        {r.diet.trim() && <Field label="食事" value={r.diet} />}
        {r.condition.trim() && <Field label="体調・痛み・疲労" value={r.condition} />}
        {r.memo.trim() && <Field label="メモ" value={r.memo} />}

        <div className="rounded-lg bg-[#2d4fd4]/5 border border-[#2d4fd4]/15 p-3">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-bold text-[#2d4fd4]">
              🏋️ コーチのフィードバック
            </span>
            <span className="text-[10px] text-neutral-400">{r.model}</span>
          </div>
          <p className="text-sm text-neutral-800 whitespace-pre-wrap leading-relaxed">
            {r.feedback}
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-sm">
      <span className="text-neutral-400 text-xs">{label}：</span>
      <span className="text-neutral-700 whitespace-pre-wrap">{value}</span>
    </div>
  );
}
