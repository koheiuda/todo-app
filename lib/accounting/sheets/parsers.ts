/**
 * Googleスプシ取り込み用パーサ。
 *
 * 月次管理シート（タブ名「1期」「2期」）:
 *   Row 1: ヘッダー（日次, 管理シート, 売上（税込）, 支出（合計）, 粗利, 粗利率, メモ）
 *   Row 2〜: 月別データ
 *   末尾: 合計行
 *
 * 収支シート（タブ名「収支」）:
 *   Row 1-3: サマリー（請求額/支出/利益）
 *   Row 4: 請求先テーブルのヘッダー（No, 請求先, 税込み, 金額, PDF, 請求書送付, 振込確認, メモ）
 *   Row 5〜: 請求先データ
 *   合計金額行 → 空行
 *   外注費ヘッダー → 外注費データ → 合計金額
 */

export type ParsedMonthlyRow = {
  yearMonth: string; // "2025-08"
  revenueInclTax: number;
  totalExpense: number;
  grossProfit: number;
  grossMarginRate: number; // 0.0〜1.0
  memo: string | null;
};

export type ParsedInvoiceRow = {
  clientName: string;
  amountInclTax: number;
  amountExclTax: number;
  memo: string | null;
};

export type ParsedOutsourcingRow = {
  contractorName: string;
  amountInclTax: number;
  memo: string | null;
};

export type ParsedShueki = {
  invoices: ParsedInvoiceRow[];
  outsourcing: ParsedOutsourcingRow[];
};

const JP_YM = /^(\d{4})年(\d{1,2})月/;

export function parseJapaneseYearMonth(s: string): string | null {
  const m = JP_YM.exec(s);
  if (!m) return null;
  return `${m[1]}-${String(parseInt(m[2], 10)).padStart(2, "0")}`;
}

function toInt(v: unknown): number {
  if (v == null || v === "") return 0;
  if (typeof v === "number") return Math.round(v);
  const cleaned = String(v).replace(/[^\d.-]/g, "");
  if (!cleaned) return 0;
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? Math.round(n) : 0;
}

function toRate(v: unknown): number {
  if (v == null || v === "") return 0;
  if (typeof v === "number") {
    return v > 1 ? v / 100 : v;
  }
  const s = String(v);
  if (s.includes("%")) {
    const n = parseFloat(s.replace(/[^\d.-]/g, ""));
    return Number.isFinite(n) ? n / 100 : 0;
  }
  const n = parseFloat(s);
  return Number.isFinite(n) ? (n > 1 ? n / 100 : n) : 0;
}

export function parseMonthlyManagement(
  rows: string[][],
): ParsedMonthlyRow[] {
  const out: ParsedMonthlyRow[] = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.length === 0) continue;
    const yearMonth = parseJapaneseYearMonth(r[0] ?? "");
    if (!yearMonth) continue;
    const revenue = toInt(r[2]);
    const expense = toInt(r[3]);
    const profit = toInt(r[4]);
    const rate = toRate(r[5]);
    const memo = (r[6] ?? "").trim() || null;
    out.push({
      yearMonth,
      revenueInclTax: revenue,
      totalExpense: expense,
      grossProfit: profit || revenue - expense,
      grossMarginRate: rate,
      memo,
    });
  }
  return out;
}

export function parseShuekiSheet(rows: string[][]): ParsedShueki {
  let invoiceHeaderIdx = -1;
  let outsourcingHeaderIdx = -1;
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i] ?? [];
    if (r[0] === "No" && r[1] === "請求先") invoiceHeaderIdx = i;
    if (r[0] === "No" && r[1] === "外注費") outsourcingHeaderIdx = i;
  }

  const invoices: ParsedInvoiceRow[] = [];
  if (invoiceHeaderIdx >= 0) {
    const endIdx =
      outsourcingHeaderIdx >= 0 ? outsourcingHeaderIdx : rows.length;
    for (let i = invoiceHeaderIdx + 1; i < endIdx; i++) {
      const r = rows[i] ?? [];
      const no = r[0];
      const clientName = (r[1] ?? "").trim();
      if (!clientName) continue;
      if (clientName.includes("合計")) continue;
      if (!no && !clientName) continue;
      invoices.push({
        clientName,
        amountInclTax: toInt(r[2]),
        amountExclTax: toInt(r[3]),
        memo: (r[7] ?? "").trim() || null,
      });
    }
  }

  const outsourcing: ParsedOutsourcingRow[] = [];
  if (outsourcingHeaderIdx >= 0) {
    for (let i = outsourcingHeaderIdx + 1; i < rows.length; i++) {
      const r = rows[i] ?? [];
      const no = r[0];
      const name = (r[1] ?? "").trim();
      if (!name) continue;
      if (name.includes("合計")) continue;
      if (!no && !name) continue;
      outsourcing.push({
        contractorName: name,
        amountInclTax: toInt(r[2]),
        memo: (r[7] ?? "").trim() || null,
      });
    }
  }

  return { invoices, outsourcing };
}
