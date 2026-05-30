"use client";

import { GOALS, ROADMAP, formatMenu, type RoadmapWeek } from "@/lib/training/plan";

export function Roadmap({ currentWeekNo }: { currentWeekNo: number | null }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {ROADMAP.map((w) => (
          <WeekCard key={w.week} week={w} active={w.week === currentWeekNo} />
        ))}
      </div>
      <p className="text-xs text-neutral-500">
        目標：6月末までにベンチMAX{" "}
        <span className="font-semibold text-neutral-700">{GOALS.safe}kg</span>
        （確実ライン）／{" "}
        <span className="font-semibold text-[#2d4fd4]">{GOALS.bonus}kg</span>
        （ボーナス）。本番 6/29。
      </p>
    </div>
  );
}

function WeekCard({ week, active }: { week: RoadmapWeek; active: boolean }) {
  return (
    <div
      className={`rounded-xl border p-4 transition-colors ${
        active
          ? "border-[#2d4fd4] bg-[#2d4fd4]/5 ring-1 ring-[#2d4fd4]/30"
          : "border-neutral-200 bg-white"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span
            className={`text-sm font-bold ${
              active ? "text-[#2d4fd4]" : "text-neutral-800"
            }`}
          >
            第{week.week}週
          </span>
          <span className="text-xs text-neutral-400">{week.range}</span>
        </div>
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            active
              ? "bg-[#2d4fd4] text-white"
              : "bg-neutral-100 text-neutral-600"
          }`}
        >
          {week.theme}
        </span>
      </div>
      <p className="text-xs text-neutral-500 leading-relaxed mb-2">{week.note}</p>

      <ul className="space-y-2">
        {week.days.map((d, i) => (
          <li key={i} className="text-sm">
            <div className="flex gap-2">
              <span className="text-neutral-400 shrink-0 w-16">{d.label}</span>
              <span className="text-neutral-800 font-medium tabular-nums">
                {formatMenu(d)}
              </span>
            </div>
            {d.role && (
              <p className="ml-[4.5rem] text-xs text-neutral-500 leading-snug">
                {d.role}
              </p>
            )}
          </li>
        ))}
      </ul>
      {active && (
        <p className="mt-2 text-xs font-medium text-[#2d4fd4]">← 今ここ</p>
      )}
    </div>
  );
}
