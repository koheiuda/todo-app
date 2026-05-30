"use client";

import { useEffect, useState } from "react";
import {
  BLOOD_SUGAR,
  GOALS,
  NUTRITION,
  PRIORITY,
  PROFILE,
  ROADMAP,
  SUPPLEMENTS,
  TRAINING_DAYS,
  WEIGHT_MGMT,
  currentWeek,
  daysUntilPeak,
  toYmd,
} from "@/lib/training/plan";

/**
 * 左サイドバーに常時表示する「戦略・ロードマップ」パネル。
 * カウントダウンと現在週ハイライトのみクライアントの日付に依存するため
 * マウント後に確定させ、ハイドレーション不一致を避ける。
 */
export function StrategySidebar() {
  const [today, setToday] = useState("");

  useEffect(() => {
    setToday(toYmd(new Date()));
  }, []);

  const countdown = today ? daysUntilPeak(today) : null;
  const activeWeek = today ? currentWeek(today) : null;

  return (
    <div className="bg-white rounded-xl shadow-sm p-3 space-y-3">
      <div className="flex items-center justify-between">
        <p className="px-1 text-xs font-semibold text-[#2d4fd4] uppercase tracking-wide">
          戦略・ロードマップ
        </p>
      </div>

      {/* カウントダウン */}
      <div className="rounded-lg bg-[#1e2a4a] text-white px-3 py-2">
        <p className="text-[10px] text-white/60">本番 6/29 まで</p>
        <p className="text-lg font-bold tabular-nums leading-tight">
          {countdown == null
            ? "—"
            : countdown >= 0
              ? `あと${countdown}日`
              : "終了"}
        </p>
      </div>

      {/* 目標 */}
      <Section icon="🎯" title="目標">
        <p className="tabular-nums">
          <span className="font-bold text-neutral-800">{GOALS.safe}kg</span>{" "}
          確実 /{" "}
          <span className="font-bold text-[#2d4fd4]">{GOALS.bonus}kg</span>{" "}
          ボーナス
        </p>
        <p className="text-neutral-400">{GOALS.deadline}</p>
      </Section>

      {/* 4週ロードマップ */}
      <Section icon="🗺️" title="4週ロードマップ">
        <ul className="space-y-1.5">
          {ROADMAP.map((w) => {
            const active = activeWeek?.week === w.week;
            return (
              <li
                key={w.week}
                className={`rounded-md px-2 py-1.5 ${
                  active
                    ? "bg-[#2d4fd4]/10 ring-1 ring-[#2d4fd4]/30"
                    : "bg-neutral-50"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className={`font-bold ${
                      active ? "text-[#2d4fd4]" : "text-neutral-700"
                    }`}
                  >
                    第{w.week}週
                  </span>
                  <span className="text-[10px] text-neutral-400">
                    {w.range}
                  </span>
                  <span className="text-[10px] text-neutral-500">
                    {w.theme}
                  </span>
                  {active && (
                    <span className="ml-auto text-[10px] font-bold text-[#2d4fd4]">
                      今ここ
                    </span>
                  )}
                </div>
                <ul className="mt-0.5 space-y-0.5">
                  {w.days.map((d, i) => (
                    <li
                      key={i}
                      className="flex gap-1.5 text-[11px] tabular-nums"
                    >
                      <span className="text-neutral-400 shrink-0 w-12">
                        {d.label}
                      </span>
                      <span className="text-neutral-700">{d.menu}</span>
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      </Section>

      {/* 戦略 */}
      <Section icon="🧠" title="戦略">
        <Row label="弱点" value={PROFILE.weakness} />
        <Row label="現状" value={`${PROFILE.pastMax}、${PROFILE.currentMax}`} />
        <Row label="トレ日" value={TRAINING_DAYS} />
        <Row label="優先" value={PRIORITY} highlight />
      </Section>

      {/* 栄養・コンディション */}
      <Section icon="🍚" title="栄養・体重">
        <Row
          label="栄養"
          value={`${NUTRITION.kcal}kcal / P${NUTRITION.proteinG} C${NUTRITION.carbG} F${NUTRITION.fatG}（${NUTRITION.note}）`}
        />
        <Row label="血糖" value={BLOOD_SUGAR} />
        <Row label="体重" value={WEIGHT_MGMT} />
        <Row label="サプリ" value={SUPPLEMENTS} />
      </Section>
    </div>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="px-1 pb-1 text-[11px] font-semibold text-neutral-500">
        {icon} {title}
      </p>
      <div className="px-1 text-[11px] leading-relaxed text-neutral-600 space-y-0.5">
        {children}
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <p className={highlight ? "text-[#2d4fd4] font-medium" : ""}>
      <span className="text-neutral-400">{label}：</span>
      {value}
    </p>
  );
}
