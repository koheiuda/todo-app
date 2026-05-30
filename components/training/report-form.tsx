"use client";

import { TRAINED_LABELS, type ReportInput, type TrainedStatus } from "@/lib/training/types";

const TRAINED_OPTIONS: { value: TrainedStatus; label: string }[] = (
  Object.entries(TRAINED_LABELS) as [Exclude<TrainedStatus, "">, string][]
).map(([value, label]) => ({ value, label }));

const labelCls = "block text-sm font-medium text-neutral-700 mb-1";
const inputCls =
  "w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-[#2d4fd4] focus:ring-2 focus:ring-[#2d4fd4]/20 transition-colors";

export function ReportForm({
  value,
  onChange,
  onSubmit,
  submitting,
}: {
  value: ReportInput;
  onChange: (next: ReportInput) => void;
  onSubmit: () => void;
  submitting: boolean;
}) {
  const set = <K extends keyof ReportInput>(key: K, v: ReportInput[K]) =>
    onChange({ ...value, [key]: v });

  const parseNum = (s: string): number | null => {
    if (s.trim() === "") return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!submitting) onSubmit();
      }}
      className="space-y-4"
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className={labelCls} htmlFor="t-date">
            日付
          </label>
          <input
            id="t-date"
            type="date"
            className={inputCls}
            value={value.date}
            onChange={(e) => set("date", e.target.value)}
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="t-weight">
            今日の体重 (kg)
          </label>
          <input
            id="t-weight"
            type="number"
            step="0.1"
            inputMode="decimal"
            placeholder="例: 70.4"
            className={inputCls}
            value={value.weightKg ?? ""}
            onChange={(e) => set("weightKg", parseNum(e.target.value))}
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="t-sleep">
            睡眠時間 (h)
          </label>
          <input
            id="t-sleep"
            type="number"
            step="0.5"
            inputMode="decimal"
            placeholder="例: 6"
            className={inputCls}
            value={value.sleepHours ?? ""}
            onChange={(e) => set("sleepHours", parseNum(e.target.value))}
          />
        </div>
      </div>

      <div>
        <span className={labelCls}>今日トレをしたか</span>
        <div className="flex flex-wrap gap-2">
          {TRAINED_OPTIONS.map((o) => {
            const active = value.trained === o.value;
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => set("trained", active ? "" : o.value)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  active
                    ? "bg-[#2d4fd4] text-white border-[#2d4fd4]"
                    : "bg-white text-neutral-600 border-neutral-200 hover:border-[#2d4fd4]/40"
                }`}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className={labelCls} htmlFor="t-workout">
          やった内容（種目・重量・回数・主観的なキツさ）
        </label>
        <textarea
          id="t-workout"
          rows={3}
          placeholder="例: ベンチ 80×3×4。最後の1セットは三頭が先に潰れた。RPE9。"
          className={inputCls}
          value={value.workout}
          onChange={(e) => set("workout", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={labelCls} htmlFor="t-diet">
            食事はプラン通りだったか
          </label>
          <textarea
            id="t-diet"
            rows={2}
            placeholder="例: ほぼ通り。昼の米は控えた。夜にC不足気味。"
            className={inputCls}
            value={value.diet}
            onChange={(e) => set("diet", e.target.value)}
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="t-condition">
            体調・関節の痛み・仕事の疲労
          </label>
          <textarea
            id="t-condition"
            rows={2}
            placeholder="例: 右肩に軽い違和感。仕事は普通。"
            className={inputCls}
            value={value.condition}
            onChange={(e) => set("condition", e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className={labelCls} htmlFor="t-memo">
          自由メモ
        </label>
        <textarea
          id="t-memo"
          rows={2}
          placeholder="なんでも"
          className={inputCls}
          value={value.memo}
          onChange={(e) => set("memo", e.target.value)}
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="px-5 py-2.5 rounded-lg bg-[#1e2a4a] text-white text-sm font-bold hover:bg-[#1e2a4a]/90 disabled:opacity-50 transition-colors"
        >
          {submitting ? "コーチに相談中…" : "報告してフィードバックをもらう"}
        </button>
        <span className="text-xs text-neutral-400">下書きは自動保存されます</span>
      </div>
    </form>
  );
}
