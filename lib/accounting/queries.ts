import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  clients,
  companySettings,
  expenses,
  fiscalPeriods,
  invoiceLineItems,
  invoices,
  monthlySummaries,
  outsourcingCosts,
  type Client,
  type CompanySettings,
  type FiscalPeriod,
  type Invoice,
  type InvoiceLineItem,
  type MonthlySummary,
  type OutsourcingCost,
} from "@/lib/db/schema";

export async function listFiscalPeriods(): Promise<FiscalPeriod[]> {
  return getDb()
    .select()
    .from(fiscalPeriods)
    .orderBy(asc(fiscalPeriods.startDate));
}

export async function getFiscalPeriod(
  id: string,
): Promise<FiscalPeriod | undefined> {
  const rows = await getDb()
    .select()
    .from(fiscalPeriods)
    .where(eq(fiscalPeriods.id, id))
    .limit(1);
  return rows[0];
}

export async function getCurrentFiscalPeriod(
  today = new Date(),
): Promise<FiscalPeriod | undefined> {
  const dateStr = today.toISOString().slice(0, 10);
  const rows = await getDb()
    .select()
    .from(fiscalPeriods)
    .where(
      and(
        sql`${fiscalPeriods.startDate} <= ${dateStr}`,
        sql`${fiscalPeriods.endDate} >= ${dateStr}`,
      ),
    )
    .limit(1);
  if (rows[0]) return rows[0];
  const fallback = await getDb()
    .select()
    .from(fiscalPeriods)
    .orderBy(desc(fiscalPeriods.startDate))
    .limit(1);
  return fallback[0];
}

export async function listMonthlySummariesByPeriod(
  periodId: string,
): Promise<MonthlySummary[]> {
  return getDb()
    .select()
    .from(monthlySummaries)
    .where(eq(monthlySummaries.fiscalPeriodId, periodId))
    .orderBy(asc(monthlySummaries.yearMonth));
}

export async function getMonthlySummary(
  yearMonth: string,
): Promise<MonthlySummary | undefined> {
  const rows = await getDb()
    .select()
    .from(monthlySummaries)
    .where(eq(monthlySummaries.yearMonth, yearMonth))
    .limit(1);
  return rows[0];
}

export async function listClients(
  options: { onlyActive?: boolean } = {},
): Promise<Client[]> {
  const q = getDb().select().from(clients).orderBy(asc(clients.name));
  if (options.onlyActive) {
    return q.where(eq(clients.isActive, true));
  }
  return q;
}

export async function getClient(id: string): Promise<Client | undefined> {
  const rows = await getDb()
    .select()
    .from(clients)
    .where(eq(clients.id, id))
    .limit(1);
  return rows[0];
}

export async function getClientByName(
  name: string,
): Promise<Client | undefined> {
  const rows = await getDb()
    .select()
    .from(clients)
    .where(eq(clients.name, name))
    .limit(1);
  return rows[0];
}

export async function listInvoicesByMonth(
  yearMonth: string,
): Promise<(Invoice & { client: Client | null })[]> {
  const rows = await getDb()
    .select({
      invoice: invoices,
      client: clients,
    })
    .from(invoices)
    .leftJoin(clients, eq(invoices.clientId, clients.id))
    .where(eq(invoices.yearMonth, yearMonth))
    .orderBy(asc(invoices.invoiceNumber));
  return rows.map((r) => ({ ...r.invoice, client: r.client }));
}

export async function listAllInvoices(): Promise<
  (Invoice & { client: Client | null })[]
> {
  const rows = await getDb()
    .select({ invoice: invoices, client: clients })
    .from(invoices)
    .leftJoin(clients, eq(invoices.clientId, clients.id))
    .orderBy(desc(invoices.invoiceNumber));
  return rows.map((r) => ({ ...r.invoice, client: r.client }));
}

export async function getInvoice(
  id: string,
): Promise<(Invoice & { client: Client | null }) | undefined> {
  const rows = await getDb()
    .select({ invoice: invoices, client: clients })
    .from(invoices)
    .leftJoin(clients, eq(invoices.clientId, clients.id))
    .where(eq(invoices.id, id))
    .limit(1);
  if (!rows[0]) return undefined;
  return { ...rows[0].invoice, client: rows[0].client };
}

export async function listLineItemsByInvoice(
  invoiceId: string,
): Promise<InvoiceLineItem[]> {
  return getDb()
    .select()
    .from(invoiceLineItems)
    .where(eq(invoiceLineItems.invoiceId, invoiceId))
    .orderBy(asc(invoiceLineItems.sortOrder));
}

export async function listLineItemsByInvoiceIds(
  invoiceIds: string[],
): Promise<Record<string, InvoiceLineItem[]>> {
  if (invoiceIds.length === 0) return {};
  const rows = await getDb()
    .select()
    .from(invoiceLineItems)
    .where(inArray(invoiceLineItems.invoiceId, invoiceIds))
    .orderBy(asc(invoiceLineItems.sortOrder));
  const grouped: Record<string, InvoiceLineItem[]> = {};
  for (const r of rows) {
    if (!grouped[r.invoiceId]) grouped[r.invoiceId] = [];
    grouped[r.invoiceId].push(r);
  }
  return grouped;
}

export async function listOutsourcingByMonth(
  yearMonth: string,
): Promise<OutsourcingCost[]> {
  return getDb()
    .select()
    .from(outsourcingCosts)
    .where(eq(outsourcingCosts.yearMonth, yearMonth))
    .orderBy(asc(outsourcingCosts.createdAt));
}

export async function nextInvoiceNumber(yearMonth: string): Promise<string> {
  const rows = await getDb()
    .select({ num: invoices.invoiceNumber })
    .from(invoices)
    .where(sql`${invoices.invoiceNumber} LIKE ${`${yearMonth}-%`}`);
  const max = rows.reduce((acc, r) => {
    const suffix = r.num.slice(yearMonth.length + 1);
    const n = parseInt(suffix, 10);
    return Number.isFinite(n) && n > acc ? n : acc;
  }, 0);
  return `${yearMonth}-${String(max + 1).padStart(3, "0")}`;
}

export async function getMonthRevenue(yearMonth: string): Promise<number> {
  const rows = await getDb()
    .select({
      total: sql<number>`COALESCE(SUM(${invoices.amountInclTax}), 0)`,
    })
    .from(invoices)
    .where(eq(invoices.yearMonth, yearMonth));
  return Number(rows[0]?.total ?? 0);
}

export async function getMonthOutsourcingTotal(
  yearMonth: string,
): Promise<number> {
  const rows = await getDb()
    .select({
      total: sql<number>`COALESCE(SUM(${outsourcingCosts.amountInclTax}), 0)`,
    })
    .from(outsourcingCosts)
    .where(eq(outsourcingCosts.yearMonth, yearMonth));
  return Number(rows[0]?.total ?? 0);
}

export async function getCompanySettings(): Promise<CompanySettings> {
  const rows = await getDb()
    .select()
    .from(companySettings)
    .where(eq(companySettings.id, "default"))
    .limit(1);
  if (rows[0]) return rows[0];
  const inserted = await getDb()
    .insert(companySettings)
    .values({
      id: "default",
      name: process.env.COMPANY_NAME ?? "株式会社Mesut",
      postalCode: null,
      address: process.env.COMPANY_ADDRESS ?? null,
      tel: process.env.COMPANY_TEL ?? null,
      email: null,
      invoiceNumber: process.env.COMPANY_INVOICE_NUMBER ?? null,
      bankInfo: process.env.COMPANY_BANK_INFO ?? null,
    })
    .returning();
  return inserted[0];
}

export async function getMonthExpenseTotal(
  yearMonth: string,
): Promise<number> {
  const rows = await getDb()
    .select({ total: sql<number>`COALESCE(SUM(${expenses.amount}), 0)` })
    .from(expenses)
    .where(eq(expenses.yearMonth, yearMonth));
  return Number(rows[0]?.total ?? 0);
}
