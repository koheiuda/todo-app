"use server";

import { getDb } from "@/lib/db";
import { nextInvoiceNumber } from "@/lib/accounting/queries";
import {
  clients,
  fiscalPeriods,
  invoices,
  monthlySummaries,
  outsourcingCosts,
} from "@/lib/db/schema";
import { readRange } from "@/lib/accounting/sheets/client";
import {
  parseMonthlyManagement,
  parseShuekiSheet,
  type ParsedMonthlyRow,
} from "@/lib/accounting/sheets/parsers";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type ImportResult = {
  yearMonth: string;
  periodName: string;
  summary: ParsedMonthlyRow | null;
  invoicesInserted: number;
  invoicesSkipped: number;
  outsourcingInserted: number;
  clientsCreated: number;
};

function periodTabForYearMonth(yearMonth: string): "1期" | "2期" {
  return yearMonth >= "2025-08" ? "2期" : "1期";
}

async function ensurePeriod(periodTab: "1期" | "2期") {
  const existing = await getDb()
    .select()
    .from(fiscalPeriods)
    .where(eq(fiscalPeriods.name, periodTab))
    .limit(1);
  if (existing[0]) return existing[0];
  const range =
    periodTab === "1期"
      ? { startDate: "2024-08-01", endDate: "2025-07-31" }
      : { startDate: "2025-08-01", endDate: "2026-07-31" };
  const inserted = await getDb()
    .insert(fiscalPeriods)
    .values({ name: periodTab, ...range })
    .returning();
  return inserted[0];
}

async function ensureClient(name: string): Promise<{ id: string; created: boolean }> {
  const trimmed = name.trim();
  const found = await getDb()
    .select()
    .from(clients)
    .where(eq(clients.name, trimmed))
    .limit(1);
  if (found[0]) return { id: found[0].id, created: false };
  const inserted = await getDb()
    .insert(clients)
    .values({
      name: trimmed,
      honorific: "御中",
      isActive: true,
    })
    .returning();
  return { id: inserted[0].id, created: true };
}

export async function importMonth(yearMonth: string): Promise<ImportResult> {
  if (process.env.ENABLE_IMPORT !== "true") {
    throw new Error("ENABLE_IMPORT が true ではありません");
  }
  if (!/^\d{4}-\d{2}$/.test(yearMonth)) {
    throw new Error(`不正な年月: ${yearMonth}`);
  }

  const monthlyId = process.env.SHEETS_MONTHLY_MANAGEMENT_ID;
  if (!monthlyId) throw new Error("SHEETS_MONTHLY_MANAGEMENT_ID が未設定です");

  const shuekiId =
    yearMonth === "2026-04"
      ? process.env.SHEETS_INVOICE_2026_04_ID
      : yearMonth === "2026-05"
        ? process.env.SHEETS_INVOICE_2026_05_ID
        : undefined;
  if (!shuekiId) {
    throw new Error(
      `${yearMonth} の収支スプシIDが未設定です（SHEETS_INVOICE_${yearMonth.replace("-", "_")}_ID）`,
    );
  }

  const periodTab = periodTabForYearMonth(yearMonth);
  const period = await ensurePeriod(periodTab);

  const monthlyRows = await readRange(monthlyId, `${periodTab}!A1:G30`);
  const monthlyParsed = parseMonthlyManagement(monthlyRows);
  const targetSummary =
    monthlyParsed.find((m) => m.yearMonth === yearMonth) ?? null;

  if (targetSummary) {
    const exists = await getDb()
      .select()
      .from(monthlySummaries)
      .where(eq(monthlySummaries.yearMonth, yearMonth))
      .limit(1);
    if (exists[0]) {
      await getDb()
        .update(monthlySummaries)
        .set({
          fiscalPeriodId: period.id,
          revenueInclTax: targetSummary.revenueInclTax,
          totalExpense: targetSummary.totalExpense,
          grossProfit: targetSummary.grossProfit,
          grossMarginRate: targetSummary.grossMarginRate.toString(),
          memo: targetSummary.memo,
          updatedAt: new Date(),
        })
        .where(eq(monthlySummaries.id, exists[0].id));
    } else {
      await getDb().insert(monthlySummaries).values({
        fiscalPeriodId: period.id,
        yearMonth: targetSummary.yearMonth,
        revenueInclTax: targetSummary.revenueInclTax,
        totalExpense: targetSummary.totalExpense,
        grossProfit: targetSummary.grossProfit,
        grossMarginRate: targetSummary.grossMarginRate.toString(),
        memo: targetSummary.memo,
      });
    }
  }

  const shuekiRows = await readRange(shuekiId, `収支!A1:M60`);
  const parsed = parseShuekiSheet(shuekiRows);

  let invoicesInserted = 0;
  let invoicesSkipped = 0;
  let clientsCreated = 0;

  for (const row of parsed.invoices) {
    if (!row.clientName || row.amountInclTax === 0) {
      invoicesSkipped++;
      continue;
    }
    const { id: clientId, created } = await ensureClient(row.clientName);
    if (created) clientsCreated++;

    const existing = await getDb()
      .select()
      .from(invoices)
      .where(eq(invoices.clientId, clientId))
      .limit(50);
    const dup = existing.find(
      (i) => i.yearMonth === yearMonth && i.amountInclTax === row.amountInclTax,
    );
    if (dup) {
      invoicesSkipped++;
      continue;
    }

    const invoiceNumber = await nextInvoiceNumber(yearMonth);
    const tax = row.amountInclTax - row.amountExclTax;
    const issueDate = `${yearMonth}-01`;
    const due = new Date(`${yearMonth}-01`);
    due.setMonth(due.getMonth() + 2);
    due.setDate(0);
    const dueDate = due.toISOString().slice(0, 10);

    await getDb().insert(invoices).values({
      invoiceNumber,
      clientId,
      yearMonth,
      issueDate,
      dueDate,
      amountInclTax: row.amountInclTax,
      amountExclTax: row.amountExclTax,
      taxAmount: tax,
      status: "draft",
      memo: row.memo,
    });
    invoicesInserted++;
  }

  let outsourcingInserted = 0;
  for (const row of parsed.outsourcing) {
    if (!row.contractorName || row.amountInclTax === 0) continue;
    await getDb().insert(outsourcingCosts).values({
      yearMonth,
      contractorName: row.contractorName,
      amountInclTax: row.amountInclTax,
      memo: row.memo,
    });
    outsourcingInserted++;
  }

  revalidatePath("/accounting");
  revalidatePath("/accounting/periods");
  revalidatePath(`/accounting/periods/${period.id}`);
  revalidatePath(`/accounting/months/${yearMonth}`);
  revalidatePath("/accounting/clients");
  revalidatePath("/accounting/invoices");

  return {
    yearMonth,
    periodName: period.name,
    summary: targetSummary,
    invoicesInserted,
    invoicesSkipped,
    outsourcingInserted,
    clientsCreated,
  };
}
