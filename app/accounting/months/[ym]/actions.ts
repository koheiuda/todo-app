"use server";

import { getDb } from "@/lib/db";
import {
  invoiceLineItems,
  invoices,
  outsourcingCosts,
} from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { nextInvoiceNumber } from "@/lib/accounting/queries";

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

export async function addInvoice(yearMonth: string, input: unknown) {
  const data = InvoiceRowSchema.parse(input);
  const invoiceNumber = await nextInvoiceNumber(yearMonth);
  const exclTax = data.amountExclTax ?? Math.round(data.amountInclTax / 1.1);
  const tax = data.amountInclTax - exclTax;
  const issueDate = `${yearMonth}-01`;
  const due = new Date(`${yearMonth}-01`);
  due.setMonth(due.getMonth() + 2);
  due.setDate(0);
  const dueDate = due.toISOString().slice(0, 10);

  await getDb().insert(invoices).values({
    invoiceNumber,
    clientId: data.clientId,
    yearMonth,
    issueDate,
    dueDate,
    amountInclTax: data.amountInclTax,
    amountExclTax: exclTax,
    taxAmount: tax,
    status: "draft",
    memo: data.memo ?? null,
  });
  revalidatePath(`/accounting/months/${yearMonth}`);
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

export async function deleteInvoice(invoiceId: string) {
  const inv = await getDb()
    .select()
    .from(invoices)
    .where(eq(invoices.id, invoiceId))
    .limit(1);
  if (!inv[0]) return;
  await getDb()
    .delete(invoiceLineItems)
    .where(eq(invoiceLineItems.invoiceId, invoiceId));
  await getDb().delete(invoices).where(eq(invoices.id, invoiceId));
  revalidatePath(`/accounting/months/${inv[0].yearMonth}`);
}

const OutsourcingSchema = z.object({
  contractorName: z.string().trim().min(1),
  amountInclTax: z.number().int().min(0),
  memo: z.string().trim().optional().nullable(),
});

export async function addOutsourcing(yearMonth: string, input: unknown) {
  const data = OutsourcingSchema.parse(input);
  await getDb().insert(outsourcingCosts).values({
    yearMonth,
    contractorName: data.contractorName,
    amountInclTax: data.amountInclTax,
    memo: data.memo ?? null,
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
    subtotal,
    sortOrder: Number(lastSort[0]?.max ?? 0) + 1,
  });
  const ym = await recomputeInvoiceTotals(invoiceId);
  if (ym) revalidatePath(`/accounting/months/${ym}`);
}

export async function updateLineItem(
  itemId: string,
  field: "description" | "unitPrice" | "quantity" | "subtotal",
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

export async function deleteLineItem(itemId: string) {
  const row = await getDb()
    .select()
    .from(invoiceLineItems)
    .where(eq(invoiceLineItems.id, itemId))
    .limit(1);
  if (!row[0]) return;
  await getDb().delete(invoiceLineItems).where(eq(invoiceLineItems.id, itemId));
  const ym = await recomputeInvoiceTotals(row[0].invoiceId);
  if (ym) revalidatePath(`/accounting/months/${ym}`);
}

export async function deleteOutsourcing(id: string) {
  const row = await getDb()
    .select()
    .from(outsourcingCosts)
    .where(eq(outsourcingCosts.id, id))
    .limit(1);
  if (!row[0]) return;
  await getDb().delete(outsourcingCosts).where(eq(outsourcingCosts.id, id));
  revalidatePath(`/accounting/months/${row[0].yearMonth}`);
}
