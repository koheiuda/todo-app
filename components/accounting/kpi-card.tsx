import { formatYen } from "@/lib/accounting/utils";

export function KpiCard({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: number | string;
  hint?: string;
  tone?: "neutral" | "positive" | "negative";
}) {
  const toneClass =
    tone === "positive"
      ? "text-emerald-700"
      : tone === "negative"
        ? "text-rose-700"
        : "text-neutral-900";
  const display = typeof value === "number" ? formatYen(value) : value;
  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-5">
      <p className="text-xs text-neutral-500">{label}</p>
      <p className={`text-2xl font-semibold mt-2 ${toneClass}`}>{display}</p>
      {hint ? <p className="text-xs text-neutral-400 mt-1">{hint}</p> : null}
    </div>
  );
}
