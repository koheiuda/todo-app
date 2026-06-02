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
  RECOVERY_LEVERS,
  RECOVERY_MYTHS,
  RECOVERY_NOTE,
  RECOVERY_PROTOCOL,
  RECOVERY_SOURCES,
  STRATEGY_NOTE,
  SUPPLEMENTS,
  TRAINING_DAYS,
  WEIGHT_MGMT,
  currentWeek,
  daysUntilPeak,
  toYmd,
} from "@/lib/training/plan";
import {
  DOMS_PHYSIOLOGY,
  LEVER_DETAILS,
  RECOVERY_TIMELINE,
  SORENESS_DECISION,
  SUPPLEMENT_TABLE,
  THERMAL_MATRIX,
} from "@/lib/training/recovery";
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

      {/* ── 回復・筋肉痛対策（超回復） ── */}
      <section>
        <h2 className="text-sm font-semibold text-neutral-700 mb-1">
          回復・筋肉痛対策（超回復）
        </h2>
        <p className="text-xs text-neutral-500 mb-3">
          中1日（48時間間隔）で胸トレを回すための、エビデンスに基づく回復戦略。
        </p>

        {/* 見立て */}
        <div className="rounded-xl border border-[#f59e0b]/30 bg-[#f59e0b]/5 p-4 mb-3">
          <p className="text-xs font-semibold text-[#b45309] mb-1">
            🩹 5/30の筋肉痛が今日(6/1)も残る件の見立て
          </p>
          <p className="text-sm text-neutral-700 leading-relaxed">
            {RECOVERY_NOTE}
          </p>
        </div>

        {/* DOMSの生理学 */}
        <p className="text-xs font-semibold text-neutral-500 mb-2">
          なぜ痛む・なぜ長引く（DOMSの生理学）
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
          {DOMS_PHYSIOLOGY.map((p) => (
            <div
              key={p.heading}
              className="rounded-xl border border-neutral-200 bg-white p-4"
            >
              <p className="text-sm font-semibold text-neutral-900 mb-1">
                {p.heading}
              </p>
              <p className="text-sm text-neutral-600 leading-relaxed">
                {p.body}
              </p>
            </div>
          ))}
        </div>

        {/* 効くレバー（優先順） */}
        <p className="text-xs font-semibold text-neutral-500 mb-2">
          効くレバー（上から優先）
        </p>
        <div className="flex flex-col gap-2 mb-4">
          {RECOVERY_LEVERS.map((lever) => (
            <div
              key={lever.rank}
              className="rounded-xl border border-neutral-200 bg-white p-4"
            >
              <div className="flex items-start gap-3">
                <span className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-[#2d4fd4] text-white text-xs font-bold">
                  {lever.rank}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-neutral-900">
                      {lever.title}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        lever.grade === "高"
                          ? "bg-[#22c55e]/15 text-[#15803d]"
                          : "bg-neutral-200 text-neutral-600"
                      }`}
                    >
                      エビデンス{lever.grade}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-700 leading-relaxed mt-1">
                    {lever.how}
                  </p>
                  {(() => {
                    const detail = LEVER_DETAILS.find(
                      (d) => d.rank === lever.rank
                    );
                    if (!detail) return null;
                    return (
                      <>
                        <ul className="mt-2 space-y-1">
                          {detail.steps.map((s, i) => (
                            <li
                              key={i}
                              className="text-sm text-neutral-700 leading-relaxed flex gap-1.5"
                            >
                              <span className="text-[#2d4fd4]">・</span>
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                        <p className="text-xs text-[#15803d] bg-[#22c55e]/10 rounded px-2 py-1 mt-2 inline-block">
                          🎯 目標：{detail.target}
                        </p>
                      </>
                    );
                  })()}
                  <p className="text-xs text-neutral-400 leading-relaxed mt-2">
                    {lever.evidence}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* やりがちな誤解・逆効果 */}
        <p className="text-xs font-semibold text-neutral-500 mb-2">
          やりがちな誤解・逆効果
        </p>
        <div className="bg-white rounded-xl border border-neutral-200 divide-y divide-neutral-100 mb-4">
          {RECOVERY_MYTHS.map((m) => (
            <div key={m.myth} className="px-4 py-3">
              <p className="text-sm font-medium text-[#dc2626]">
                ✕ {m.myth}
              </p>
              <p className="text-sm text-neutral-700 leading-relaxed mt-1">
                <span className="font-semibold text-[#15803d]">→ </span>
                {m.truth}
              </p>
            </div>
          ))}
        </div>

        {/* 温冷療法の使い分け */}
        <p className="text-xs font-semibold text-neutral-500 mb-2">
          サウナ・風呂・冷却の使い分け（増量期＝今の可否つき）
        </p>
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-sm bg-white rounded-xl border border-neutral-200 border-separate border-spacing-0">
            <thead>
              <tr className="text-xs text-neutral-500">
                <th className="text-left font-semibold px-3 py-2">手段</th>
                <th className="text-left font-semibold px-3 py-2">タイミング</th>
                <th className="text-center font-semibold px-3 py-2 whitespace-nowrap">今OK?</th>
                <th className="text-left font-semibold px-3 py-2">狙い・注意</th>
              </tr>
            </thead>
            <tbody>
              {THERMAL_MATRIX.map((t) => (
                <tr key={t.method} className="border-t border-neutral-100 align-top">
                  <td className="px-3 py-2 font-medium text-neutral-800">
                    {t.method}
                  </td>
                  <td className="px-3 py-2 text-neutral-600 whitespace-nowrap">
                    {t.timing}
                  </td>
                  <td
                    className={`px-3 py-2 text-center text-lg font-bold ${
                      t.bulkOk === "×"
                        ? "text-[#dc2626]"
                        : t.bulkOk === "△"
                          ? "text-[#b45309]"
                          : "text-[#15803d]"
                    }`}
                  >
                    {t.bulkOk}
                  </td>
                  <td className="px-3 py-2 text-neutral-600 leading-relaxed">
                    <span className="font-medium text-neutral-700">{t.purpose}</span>
                    <br />
                    {t.note}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* サプリ早見表 */}
        <p className="text-xs font-semibold text-neutral-500 mb-2">
          サプリ早見表（回復・DOMS観点）
        </p>
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-sm bg-white rounded-xl border border-neutral-200 border-separate border-spacing-0">
            <thead>
              <tr className="text-xs text-neutral-500">
                <th className="text-left font-semibold px-3 py-2">サプリ</th>
                <th className="text-left font-semibold px-3 py-2 whitespace-nowrap">用量</th>
                <th className="text-left font-semibold px-3 py-2">タイミング</th>
                <th className="text-center font-semibold px-3 py-2 whitespace-nowrap">推奨</th>
                <th className="text-left font-semibold px-3 py-2">効果・備考</th>
              </tr>
            </thead>
            <tbody>
              {SUPPLEMENT_TABLE.map((s) => (
                <tr key={s.name} className="border-t border-neutral-100 align-top">
                  <td className="px-3 py-2 font-medium text-neutral-800 whitespace-nowrap">
                    {s.name}
                  </td>
                  <td className="px-3 py-2 text-neutral-600 whitespace-nowrap">
                    {s.dose}
                  </td>
                  <td className="px-3 py-2 text-neutral-600">{s.timing}</td>
                  <td className="px-3 py-2 text-center whitespace-nowrap">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        s.rec === "継続" || s.rec === "推奨"
                          ? "bg-[#22c55e]/15 text-[#15803d]"
                          : s.rec === "限定"
                            ? "bg-[#f59e0b]/15 text-[#b45309]"
                            : "bg-neutral-200 text-neutral-600"
                      }`}
                    >
                      {s.rec}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-neutral-600 leading-relaxed">
                    {s.effect}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 中1日プロトコル */}
        <p className="text-xs font-semibold text-neutral-500 mb-2">
          中1日を回す実践プロトコル
        </p>
        <ul className="bg-white rounded-xl border border-neutral-200 divide-y divide-neutral-100 mb-4">
          {RECOVERY_PROTOCOL.map((step, i) => (
            <li key={i} className="flex gap-3 px-4 py-2.5">
              <span className="shrink-0 text-[#2d4fd4] font-bold text-sm">
                {i + 1}
              </span>
              <span className="text-sm text-neutral-700 leading-relaxed">
                {step}
              </span>
            </li>
          ))}
        </ul>

        {/* トレ日の1日タイムライン */}
        <p className="text-xs font-semibold text-neutral-500 mb-2">
          トレ日の過ごし方（回復を最大化する1日）
        </p>
        <div className="bg-white rounded-xl border border-neutral-200 divide-y divide-neutral-100 mb-4">
          {RECOVERY_TIMELINE.map((slot) => (
            <div
              key={slot.time}
              className="grid grid-cols-1 sm:grid-cols-[8rem_1fr] gap-1 sm:gap-3 px-4 py-2.5"
            >
              <span className="text-sm font-semibold text-[#2d4fd4] whitespace-nowrap">
                {slot.time}
              </span>
              <span className="text-sm text-neutral-700 leading-relaxed">
                {slot.action}
              </span>
            </div>
          ))}
        </div>

        {/* 痛みが残る日の判断フロー */}
        <p className="text-xs font-semibold text-neutral-500 mb-2">
          痛みが残る日、トレすべき？（判断フロー）
        </p>
        <div className="flex flex-col gap-2 mb-4">
          {SORENESS_DECISION.map((r) => (
            <div
              key={r.level}
              className="rounded-xl border border-neutral-200 bg-white p-4"
            >
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-sm font-semibold text-neutral-900">
                  {r.level}
                </span>
                <span className="text-xs text-neutral-400">{r.sign}</span>
              </div>
              <p className="text-sm text-neutral-700 leading-relaxed">
                <span className="font-semibold text-[#2d4fd4]">→ </span>
                {r.action}
              </p>
            </div>
          ))}
        </div>

        {/* 出典 */}
        <details className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3">
          <summary className="text-xs font-semibold text-neutral-500 cursor-pointer">
            出典（メタ分析・一次研究 {RECOVERY_SOURCES.length}件）
          </summary>
          <ul className="mt-2 flex flex-col gap-1.5">
            {RECOVERY_SOURCES.map((s) => (
              <li key={s.url} className="text-xs leading-relaxed">
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#2d4fd4] hover:underline break-all"
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </details>
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
