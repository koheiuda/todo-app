"use client";

import { useEffect, useState } from "react";
import {
  BLOOD_SUGAR,
  GOALS,
  NOTATION_LEGEND,
  NUTRITION,
  PHASE_FLOW,
  PRIORITY,
  PROFILE,
  STRATEGY_NOTE,
  SUPPLEMENTS,
  TRAINING_DAYS,
  WEIGHT_MGMT,
  currentWeek,
  daysUntilPeak,
  toYmd,
} from "@/lib/training/plan";
import { Roadmap } from "./roadmap";

/**
 * /training/strategy のメイン領域。戦略全体＋4週ロードマップを表示。
 * カウントダウンと現在週ハイライトのみクライアント日付に依存するため
 * マウント後に確定させる。
 */
export function StrategyView() {
  const [today, setToday] = useState("");

  useEffect(() => {
    setToday(toYmd(new Date()));
  }, []);

  const countdown = today ? daysUntilPeak(today) : null;
  const activeWeek = today ? currentWeek(today) : null;

  return (
    <div className="flex flex-col gap-8">
      {/* ── ヘッダー＋カウントダウン ── */}
      <section>
        <h1 className="text-xl font-bold text-neutral-900 mb-3">
          🗺️ 戦略・ロードマップ
        </h1>
        <div className="rounded-xl bg-[#1e2a4a] text-white p-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs text-white/60 mb-1">目標</p>
            <p className="text-lg font-bold">
              ベンチMAX{" "}
              <span className="text-[#7da0ff]">{GOALS.safe}kg</span>
              <span className="text-white/70 text-sm">（必達）</span>{" "}
              /{" "}
              <span className="text-white">{GOALS.bonus}kg</span>
              <span className="text-white/70 text-sm">（ストレッチ）</span>
            </p>
            <p className="text-xs text-white/60 mt-1">
              {GOALS.deadline} ／ {activeWeek ? `第${activeWeek.week}週「${activeWeek.theme}」` : "—"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/60">本番 6/29 まで</p>
            <p className="text-3xl font-bold tabular-nums">
              {countdown == null
                ? "—"
                : countdown >= 0
                  ? `あと${countdown}日`
                  : "終了"}
            </p>
          </div>
        </div>
      </section>

      {/* ── 現状を踏まえた見立て ── */}
      <section>
        <div className="rounded-xl border border-[#22c55e]/30 bg-[#22c55e]/5 p-4">
          <p className="text-xs font-semibold text-[#15803d] mb-1">
            🎯 115kg必達モードの見立て（MAX 105kg×1・初週80kg×3×4が余裕）
          </p>
          <p className="text-sm text-neutral-700 leading-relaxed">
            {STRATEGY_NOTE}
          </p>
        </div>
      </section>

      {/* ── 読み方・用語解説 ── */}
      <section>
        <h2 className="text-sm font-semibold text-neutral-700 mb-1">
          読み方・用語
        </h2>
        <p className="text-xs text-neutral-500 mb-3">
          ロードマップの数字や記号がわかりにくいとき用の早見表。
        </p>
        <div className="bg-white rounded-xl border border-neutral-200 divide-y divide-neutral-100">
          {NOTATION_LEGEND.map((item) => (
            <div
              key={item.term}
              className="grid grid-cols-1 sm:grid-cols-[8rem_1fr] gap-1 sm:gap-3 px-4 py-2.5"
            >
              <span className="text-sm font-semibold text-[#2d4fd4]">
                {item.term}
              </span>
              <span className="text-sm text-neutral-600 leading-relaxed">
                {item.desc}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── 4週ロードマップ ── */}
      <section>
        <h2 className="text-sm font-semibold text-neutral-700 mb-1">
          4週ロードマップ
        </h2>
        <p className="text-xs text-neutral-500 mb-3">{PHASE_FLOW}</p>
        <Roadmap currentWeekNo={activeWeek?.week ?? null} />
      </section>

      {/* ── 戦略 ── */}
      <section>
        <h2 className="text-sm font-semibold text-neutral-700 mb-3">戦略</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <InfoCard icon="🧠" title="弱点">
            {PROFILE.weakness}
          </InfoCard>
          <InfoCard icon="📍" title="現状">
            {PROFILE.pastMax}、{PROFILE.currentMax}
          </InfoCard>
          <InfoCard icon="📅" title="トレ日">
            {TRAINING_DAYS}
          </InfoCard>
          <InfoCard icon="⚡" title="大前提" highlight>
            {PRIORITY}
          </InfoCard>
        </div>
      </section>

      {/* ── プロフィール ── */}
      <section>
        <h2 className="text-sm font-semibold text-neutral-700 mb-3">
          プロフィール
        </h2>
        <div className="bg-white rounded-xl border border-neutral-200 p-4 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-sm">
          <Stat label="身長" value={PROFILE.height} />
          <Stat label="体重" value={PROFILE.weight} />
          <Stat label="年齢" value={PROFILE.age} />
          <Stat label="経験" value={PROFILE.experience} />
          <Stat label="睡眠" value={PROFILE.sleep} />
          <Stat label="仕事" value={PROFILE.work} />
        </div>
      </section>

      {/* ── 栄養・コンディション ── */}
      <section>
        <h2 className="text-sm font-semibold text-neutral-700 mb-3">
          栄養・コンディション
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <InfoCard icon="🍚" title="栄養目標">
            {NUTRITION.kcal}kcal / P{NUTRITION.proteinG}g・C{NUTRITION.carbG}g・F
            {NUTRITION.fatG}g（{NUTRITION.note}）
          </InfoCard>
          <InfoCard icon="🩸" title="血糖コントロール">
            {BLOOD_SUGAR}
          </InfoCard>
          <InfoCard icon="⚖️" title="体重管理">
            {WEIGHT_MGMT}
          </InfoCard>
          <InfoCard icon="💊" title="サプリ">
            {SUPPLEMENTS}
          </InfoCard>
        </div>
      </section>
    </div>
  );
}

function InfoCard({
  icon,
  title,
  children,
  highlight,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        highlight
          ? "border-[#2d4fd4]/30 bg-[#2d4fd4]/5"
          : "border-neutral-200 bg-white"
      }`}
    >
      <p className="text-xs font-semibold text-neutral-500 mb-1">
        {icon} {title}
      </p>
      <p
        className={`text-sm leading-relaxed ${
          highlight ? "text-[#2d4fd4] font-medium" : "text-neutral-700"
        }`}
      >
        {children}
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-neutral-400 text-xs">{label}</span>
      <p className="text-neutral-800">{value}</p>
    </div>
  );
}
