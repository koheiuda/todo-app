"use server";

import { getDb } from "@/lib/db";
import {
  clients,
  invoiceLineItems,
  invoices,
  outsourcingCosts,
  type Invoice,
  type InvoiceLineItem,
  type OutsourcingCost,
} from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  getClientByName,
  listInvoicesByMonth,
  listLineItemsByInvoiceIds,
  listOutsourcingByMonth,
  nextInvoiceNumber,
} from "@/lib/accounting/queries";

function shiftYearMonth(ym: string, delta: number): string {
  const [y, m] = ym.split("-").map((s) => parseInt(s, 10));
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function dueDateFor(yearMonth: string): string {
  const due = new Date(`${yearMonth}-01`);
  due.setMonth(due.getMonth() + 2);
  due.setDate(0);
  return due.toISOString().slice(0, 10);
}

async function nextInvoiceSortOrder(yearMonth: string): Promise<number> {
  const rows = await getDb()
    .select({ max: sql<number>`COALESCE(MAX(${invoices.sortOrder}), -1)` })
    .from(invoices)
    .where(eq(invoices.yearMonth, yearMonth));
  return Number(rows[0]?.max ?? -1) + 1;
}

async function nextOutsourcingSortOrder(yearMonth: string): Promise<number> {
  const rows = await getDb()
    .select({ max: sql<number>`COALESCE(MAX(${outsourcingCosts.sortOrder}), -1)` })
    .from(outsourcingCosts)
    .where(eq(outsourcingCosts.yearMonth, yearMonth));
  return Number(rows[0]?.max ?? -1) + 1;
}

/** 請求先の表示順を保存（D&D後）。id配列の順に sort_order を 0,1,2... で振り直す。 */
export async function reorderInvoices(yearMonth: string, orderedIds: string[]) {
  await getDb().transaction(async (tx) => {
    for (let i = 0; i < orderedIds.length; i++) {
      await tx
        .update(invoices)
        .set({ sortOrder: i, updatedAt: new Date() })
        .where(
          and(
            eq(invoices.id, orderedIds[i]),
            eq(invoices.yearMonth, yearMonth),
          ),
        );
    }
  });
  revalidatePath(`/accounting/months/${yearMonth}`);
}

/** 外注費の表示順を保存（D&D後）。 */
export async function reorderOutsourcing(
  yearMonth: string,
  orderedIds: string[],
) {
  await getDb().transaction(async (tx) => {
    for (let i = 0; i < orderedIds.length; i++) {
      await tx
        .update(outsourcingCosts)
        .set({ sortOrder: i, updatedAt: new Date() })
        .where(
          and(
            eq(outsourcingCosts.id, orderedIds[i]),
            eq(outsourcingCosts.yearMonth, yearMonth),
          ),
        );
    }
  });
  revalidatePath(`/accounting/months/${yearMonth}`);
}

export type CopyPrevMonthResult =
  | { ok: true; invoices: number; outsourcing: number; fromYm: string }
  | { ok: false; reason: "target-not-empty" | "source-empty" };

/**
 * 前月の請求先（明細含む）・外注費を当月へ丸ごとコピーする。
 * 見込みの叩き台用。当月が完全に空のときだけ実行（誤コピー防止）。
 * 送付/振込フラグ・PDF・明細の納品日はリセット、金額・明細はそのままコピー。
 */
export async function copyFromPreviousMonth(
  yearMonth: string,
): Promise<CopyPrevMonthResult> {
  const fromYm = shiftYearMonth(yearMonth, -1);

  const [curInvoices, curOutsourcing] = await Promise.all([
    listInvoicesByMonth(yearMonth),
    listOutsourcingByMonth(yearMonth),
  ]);
  if (curInvoices.length > 0 || curOutsourcing.length > 0) {
    return { ok: false, reason: "target-not-empty" };
  }

  const [prevInvoices, prevOutsourcing] = await Promise.all([
    listInvoicesByMonth(fromYm),
    listOutsourcingByMonth(fromYm),
  ]);
  if (prevInvoices.length === 0 && prevOutsourcing.length === 0) {
    return { ok: false, reason: "source-empty" };
  }

  const prevLineItems = await listLineItemsByInvoiceIds(
    prevInvoices.map((i) => i.id),
  );

  // 連番のベースを一度だけ取得し、ループ内ではローカル加算（トランザクション内の
  // 未コミット行は別クエリから見えないため、再採番せずローカルで採番する）
  const firstNumber = await nextInvoiceNumber(yearMonth);
  let seq = parseInt(firstNumber.slice(yearMonth.length + 1), 10) || 1;

  const issueDate = `${yearMonth}-01`;
  const dueDate = dueDateFor(yearMonth);

  await getDb().transaction(async (tx) => {
    let invSort = 0;
    for (const inv of prevInvoices) {
      const invoiceNumber = `${yearMonth}-${String(seq).padStart(3, "0")}`;
      seq += 1;
      const inserted = await tx
        .insert(invoices)
        .values({
          invoiceNumber,
          clientId: inv.clientId,
          yearMonth,
          issueDate,
          dueDate,
          amountInclTax: inv.amountInclTax,
          amountExclTax: inv.amountExclTax,
          taxAmount: inv.taxAmount,
          status: "draft",
          pdfUrl: null,
          memo: inv.memo,
          sentAt: null,
          paidAt: null,
          sortOrder: invSort++,
        })
        .returning({ id: invoices.id });
      const newInvoiceId = inserted[0].id;

      const items = prevLineItems[inv.id] ?? [];
      if (items.length > 0) {
        await tx.insert(invoiceLineItems).values(
          items.map((it) => ({
            invoiceId: newInvoiceId,
            description: it.description,
            deliveryDate: null,
            unitPrice: it.unitPrice,
            quantity: it.quantity,
            unit: it.unit,
            subtotal: it.subtotal,
            sortOrder: it.sortOrder,
          })),
        );
      }
    }

    if (prevOutsourcing.length > 0) {
      await tx.insert(outsourcingCosts).values(
        prevOutsourcing.map((o, i) => ({
          yearMonth,
          contractorName: o.contractorName,
          amountInclTax: o.amountInclTax,
          memo: o.memo,
          sortOrder: i,
        })),
      );
    }
  });

  revalidatePath(`/accounting/months/${yearMonth}`);
  return {
    ok: true,
    invoices: prevInvoices.length,
    outsourcing: prevOutsourcing.length,
    fromYm,
  };
}

async function recomputeInvoiceTotals(invoiceId: string): Promise<string | null> {
  const items = await getDb()
    .select()
    .from(invoiceLineItems)
    .where(eq(invoiceLineItems.invoiceId, invoiceId));
  const inv = await getDb()
    .select()
    .from(invoices)
    .where(eq(invoices.id, invoiceId))
    .limit(1);
  if (!inv[0]) return null;
  if (items.length === 0) return inv[0].yearMonth;
  const exclTax = items.reduce((s, i) => s + i.subtotal, 0);
  const inclTax = Math.round(exclTax * 1.1);
  const tax = inclTax - exclTax;
  await getDb()
    .update(invoices)
    .set({
      amountExclTax: exclTax,
      amountInclTax: inclTax,
      taxAmount: tax,
      updatedAt: new Date(),
    })
    .where(eq(invoices.id, invoiceId));
  return inv[0].yearMonth;
}

const InvoiceRowSchema = z.object({
  clientId: z.string().uuid(),
  amountInclTax: z.number().int().min(0),
  amountExclTax: z.number().int().min(0).optional(),
  memo: z.string().trim().optional().nullable(),
});

async function doAddInvoice(
  yearMonth: string,
  data: {
    clientId: string;
    amountInclTax: number;
    amountExclTax?: number;
    memo?: string | null;
  },
) {
  const invoiceNumber = await nextInvoiceNumber(yearMonth);
  const exclTax = data.amountExclTax ?? Math.round(data.amountInclTax / 1.1);
  const tax = data.amountInclTax - exclTax;
  const sortOrder = await nextInvoiceSortOrder(yearMonth);

  await getDb().insert(invoices).values({
    invoiceNumber,
    clientId: data.clientId,
    yearMonth,
    issueDate: `${yearMonth}-01`,
    dueDate: dueDateFor(yearMonth),
    amountInclTax: data.amountInclTax,
    amountExclTax: exclTax,
    taxAmount: tax,
    status: "draft",
    memo: data.memo ?? null,
    sortOrder,
  });
  revalidatePath(`/accounting/months/${yearMonth}`);
}

export async function addInvoice(yearMonth: string, input: unknown) {
  const data = InvoiceRowSchema.parse(input);
  await doAddInvoice(yearMonth, data);
}

const InvoiceByNameSchema = z.object({
  clientName: z.string().trim().min(1, "請求先名を入力してください"),
  amountInclTax: z.number().int().min(0),
  amountExclTax: z.number().int().min(0).optional(),
  memo: z.string().trim().optional().nullable(),
});

/**
 * 取引先名から請求先を追加。既存の取引先名なら再利用し、未登録なら
 * その場で取引先(clients)を新規作成してから請求先を追加する。
 * （事前に取引先マスタへ登録しなくても請求先を足せるようにするため）
 */
export async function addInvoiceByClientName(
  yearMonth: string,
  input: unknown,
) {
  const data = InvoiceByNameSchema.parse(input);
  const existing = await getClientByName(data.clientName);
  let clientId: string;
  if (existing) {
    clientId = existing.id;
  } else {
    const created = await getDb()
      .insert(clients)
      .values({ name: data.clientName, honorific: "御中", isActive: true })
      .returning({ id: clients.id });
    clientId = created[0].id;
    revalidatePath("/accounting/clients");
  }
  await doAddInvoice(yearMonth, {
    clientId,
    amountInclTax: data.amountInclTax,
    amountExclTax: data.amountExclTax,
    memo: data.memo,
  });
}

export async function updateInvoiceAmount(
  invoiceId: string,
  field: "inclTax" | "exclTax",
  value: number,
) {
  let inclTax: number;
  let exclTax: number;
  if (field === "inclTax") {
    inclTax = value;
    exclTax = Math.round(value / 1.1);
  } else {
    exclTax = value;
    inclTax = Math.round(value * 1.1);
  }
  const tax = inclTax - exclTax;
  const inv = await getDb()
    .select()
    .from(invoices)
    .where(eq(invoices.id, invoiceId))
    .limit(1);
  if (!inv[0]) return;
  await getDb()
    .update(invoices)
    .set({
      amountInclTax: inclTax,
      amountExclTax: exclTax,
      taxAmount: tax,
      updatedAt: new Date(),
    })
    .where(eq(invoices.id, invoiceId));
  revalidatePath(`/accounting/months/${inv[0].yearMonth}`);
}

export async function updateInvoiceMemo(invoiceId: string, memo: string) {
  const inv = await getDb()
    .select()
    .from(invoices)
    .where(eq(invoices.id, invoiceId))
    .limit(1);
  if (!inv[0]) return;
  await getDb()
    .update(invoices)
    .set({ memo: memo || null, updatedAt: new Date() })
    .where(eq(invoices.id, invoiceId));
  revalidatePath(`/accounting/months/${inv[0].yearMonth}`);
}

export async function toggleInvoiceSent(invoiceId: string, value: boolean) {
  const inv = await getDb()
    .select()
    .from(invoices)
    .where(eq(invoices.id, invoiceId))
    .limit(1);
  if (!inv[0]) return;
  const sentAt = value ? new Date() : null;
  const status: "draft" | "sent" | "paid" = inv[0].paidAt
    ? "paid"
    : value
      ? "sent"
      : "draft";
  await getDb()
    .update(invoices)
    .set({ sentAt, status, updatedAt: new Date() })
    .where(eq(invoices.id, invoiceId));
  revalidatePath(`/accounting/months/${inv[0].yearMonth}`);
}

export async function toggleInvoicePaid(invoiceId: string, value: boolean) {
  const inv = await getDb()
    .select()
    .from(invoices)
    .where(eq(invoices.id, invoiceId))
    .limit(1);
  if (!inv[0]) return;
  const paidAt = value ? new Date() : null;
  const status: "draft" | "sent" | "paid" = value
    ? "paid"
    : inv[0].sentAt
      ? "sent"
      : "draft";
  await getDb()
    .update(invoices)
    .set({ paidAt, status, updatedAt: new Date() })
    .where(eq(invoices.id, invoiceId));
  revalidatePath(`/accounting/months/${inv[0].yearMonth}`);
}

export type DeletedInvoiceSnapshot = {
  invoice: Invoice;
  lineItems: InvoiceLineItem[];
};

export async function deleteInvoice(
  invoiceId: string,
): Promise<DeletedInvoiceSnapshot | null> {
  const inv = await getDb()
    .select()
    .from(invoices)
    .where(eq(invoices.id, invoiceId))
    .limit(1);
  if (!inv[0]) return null;
  const items = await getDb()
    .select()
    .from(invoiceLineItems)
    .where(eq(invoiceLineItems.invoiceId, invoiceId));
  await getDb()
    .delete(invoiceLineItems)
    .where(eq(invoiceLineItems.invoiceId, invoiceId));
  await getDb().delete(invoices).where(eq(invoices.id, invoiceId));
  revalidatePath(`/accounting/months/${inv[0].yearMonth}`);
  return { invoice: inv[0], lineItems: items };
}

/** deleteInvoice で得たスナップショットから請求先（明細含む）を復元する。 */
export async function restoreInvoice(snapshot: DeletedInvoiceSnapshot) {
  const { invoice, lineItems } = snapshot;
  await getDb().transaction(async (tx) => {
    await tx.insert(invoices).values(invoice);
    if (lineItems.length > 0) {
      await tx.insert(invoiceLineItems).values(lineItems);
    }
  });
  revalidatePath(`/accounting/months/${invoice.yearMonth}`);
}

const OutsourcingSchema = z.object({
  contractorName: z.string().trim().min(1),
  amountInclTax: z.number().int().min(0),
  memo: z.string().trim().optional().nullable(),
});

export async function addOutsourcing(yearMonth: string, input: unknown) {
  const data = OutsourcingSchema.parse(input);
  const sortOrder = await nextOutsourcingSortOrder(yearMonth);
  await getDb().insert(outsourcingCosts).values({
    yearMonth,
    contractorName: data.contractorName,
    amountInclTax: data.amountInclTax,
    memo: data.memo ?? null,
    sortOrder,
  });
  revalidatePath(`/accounting/months/${yearMonth}`);
}

export async function updateOutsourcing(
  id: string,
  field: "contractorName" | "amountInclTax" | "memo",
  value: string | number,
) {
  const row = await getDb()
    .select()
    .from(outsourcingCosts)
    .where(eq(outsourcingCosts.id, id))
    .limit(1);
  if (!row[0]) return;
  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (field === "amountInclTax") patch.amountInclTax = Number(value);
  else if (field === "contractorName") patch.contractorName = String(value);
  else if (field === "memo") patch.memo = String(value) || null;
  await getDb()
    .update(outsourcingCosts)
    .set(patch)
    .where(eq(outsourcingCosts.id, id));
  revalidatePath(`/accounting/months/${row[0].yearMonth}`);
}

const LineItemAddSchema = z.object({
  description: z.string().trim().min(1, "項目を入力してください"),
  unitPrice: z.number().int().min(0).default(0),
  quantity: z.number().min(0).default(1),
  unit: z.string().trim().max(16).optional().nullable(),
});

export async function addLineItem(invoiceId: string, input: unknown) {
  const data = LineItemAddSchema.parse(input);
  const inv = await getDb()
    .select()
    .from(invoices)
    .where(eq(invoices.id, invoiceId))
    .limit(1);
  if (!inv[0]) return;
  const lastSort = await getDb()
    .select({ max: sql<number>`COALESCE(MAX(${invoiceLineItems.sortOrder}), 0)` })
    .from(invoiceLineItems)
    .where(eq(invoiceLineItems.invoiceId, invoiceId));
  const subtotal = Math.round(data.unitPrice * data.quantity);
  await getDb().insert(invoiceLineItems).values({
    invoiceId,
    description: data.description,
    deliveryDate: `${inv[0].yearMonth}-30`,
    unitPrice: data.unitPrice,
    quantity: data.quantity.toString(),
    unit: data.unit ?? null,
    subtotal,
    sortOrder: Number(lastSort[0]?.max ?? 0) + 1,
  });
  const ym = await recomputeInvoiceTotals(invoiceId);
  if (ym) revalidatePath(`/accounting/months/${ym}`);
}

export async function updateLineItem(
  itemId: string,
  field: "description" | "unitPrice" | "quantity" | "subtotal" | "unit",
  value: string | number,
) {
  const row = await getDb()
    .select()
    .from(invoiceLineItems)
    .where(eq(invoiceLineItems.id, itemId))
    .limit(1);
  if (!row[0]) return;
  const patch: Record<string, unknown> = {};
  if (field === "description") {
    patch.description = String(value);
  } else if (field === "unit") {
    const v = String(value).trim();
    patch.unit = v === "" ? null : v.slice(0, 16);
  } else if (field === "unitPrice") {
    const u = Number(value);
    const q = Number(row[0].quantity);
    patch.unitPrice = u;
    patch.subtotal = Math.round(u * q);
  } else if (field === "quantity") {
    const q = Number(value);
    const u = row[0].unitPrice;
    patch.quantity = q.toString();
    patch.subtotal = Math.round(u * q);
  } else if (field === "subtotal") {
    const s = Number(value);
    patch.subtotal = s;
    const q = Number(row[0].quantity);
    patch.unitPrice = q > 0 ? Math.round(s / q) : 0;
  }
  await getDb()
    .update(invoiceLineItems)
    .set(patch)
    .where(eq(invoiceLineItems.id, itemId));
  const ym = await recomputeInvoiceTotals(row[0].invoiceId);
  if (ym) revalidatePath(`/accounting/months/${ym}`);
}

export async function deleteLineItem(
  itemId: string,
): Promise<InvoiceLineItem | null> {
  const row = await getDb()
    .select()
    .from(invoiceLineItems)
    .where(eq(invoiceLineItems.id, itemId))
    .limit(1);
  if (!row[0]) return null;
  await getDb().delete(invoiceLineItems).where(eq(invoiceLineItems.id, itemId));
  const ym = await recomputeInvoiceTotals(row[0].invoiceId);
  if (ym) revalidatePath(`/accounting/months/${ym}`);
  return row[0];
}

/** deleteLineItem で得た明細を復元する。 */
export async function restoreLineItem(item: InvoiceLineItem) {
  await getDb().insert(invoiceLineItems).values(item);
  const ym = await recomputeInvoiceTotals(item.invoiceId);
  if (ym) revalidatePath(`/accounting/months/${ym}`);
}

export async function deleteOutsourcing(
  id: string,
): Promise<OutsourcingCost | null> {
  const row = await getDb()
    .select()
    .from(outsourcingCosts)
    .where(eq(outsourcingCosts.id, id))
    .limit(1);
  if (!row[0]) return null;
  await getDb().delete(outsourcingCosts).where(eq(outsourcingCosts.id, id));
  revalidatePath(`/accounting/months/${row[0].yearMonth}`);
  return row[0];
}

/** deleteOutsourcing で得た外注費を復元する。 */
export async function restoreOutsourcing(row: OutsourcingCost) {
  await getDb().insert(outsourcingCosts).values(row);
  revalidatePath(`/accounting/months/${row.yearMonth}`);
}
