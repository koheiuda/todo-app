export function StatCard({
  label,
  value,
  unit,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: number | string;
  unit?: string;
  hint?: string;
  tone?: "neutral" | "positive" | "warning" | "accent";
}) {
  const valueClass =
    tone === "positive"
      ? "text-emerald-700"
      : tone === "warning"
        ? "text-amber-700"
        : tone === "accent"
          ? "text-[#2d4fd4]"
          : "text-neutral-900";

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-4">
      <p className="text-xs text-neutral-500">{label}</p>
      <p className={`mt-2 font-semibold ${valueClass}`}>
        <span className="text-2xl">
          {typeof value === "number" ? value.toLocaleString("ja-JP") : value}
        </span>
        {unit ? (
          <span className="text-sm font-medium ml-1 text-neutral-500">
            {unit}
          </span>
        ) : null}
      </p>
      {hint ? <p className="text-xs text-neutral-400 mt-1">{hint}</p> : null}
    </div>
  );
}
