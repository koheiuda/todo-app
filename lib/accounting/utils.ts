export function formatYen(value: number | null | undefined): string {
  if (value == null) return "¥0";
  return `¥${value.toLocaleString("ja-JP")}`;
}

export function formatYearMonth(ym: string): string {
  const [y, m] = ym.split("-");
  if (!y || !m) return ym;
  return `${y}年${parseInt(m, 10)}月`;
}

export function formatDateJp(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}
