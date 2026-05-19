import { format, toZonedTime } from "date-fns-tz";

const JST = "Asia/Tokyo";

export function formatJst(d: Date | string | null | undefined, pattern = "MM/dd HH:mm") {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return format(toZonedTime(date, JST), pattern, { timeZone: JST });
}

export function jstNowIsoForInput(): string {
  const now = new Date(Date.now() + 9 * 3600 * 1000);
  return now.toISOString().slice(0, 16);
}

export function jstInputToIso(local: string): string {
  // local = "YYYY-MM-DDTHH:mm" assumed JST → return UTC ISO
  const [datePart, timePart] = local.split("T");
  const [y, m, d] = datePart.split("-").map(Number);
  const [hh, mm] = timePart.split(":").map(Number);
  const utc = Date.UTC(y, m - 1, d, hh - 9, mm);
  return new Date(utc).toISOString();
}
