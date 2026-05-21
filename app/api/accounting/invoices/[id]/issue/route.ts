import { getDb } from "@/lib/db";
import {
  getInvoice,
  listLineItemsByInvoice,
} from "@/lib/accounting/queries";
import { invoices } from "@/lib/db/schema";
import { generateInvoicePdf } from "@/lib/accounting/pdf/generate";
import { put } from "@vercel/blob";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const invoice = await getInvoice(id);
  if (!invoice) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!invoice.client) {
    return NextResponse.json(
      { error: "請求先が紐付いていません" },
      { status: 400 },
    );
  }

  const lineItems = await listLineItemsByInvoice(invoice.id);

  let items = lineItems.map((li) => ({
    description: li.description,
    deliveryDate: li.deliveryDate,
    unitPrice: li.unitPrice,
    quantity: Number(li.quantity),
    subtotal: li.subtotal,
  }));

  if (items.length === 0) {
    items = [
      {
        description: `${invoice.yearMonth} 業務委託`,
        deliveryDate: `${invoice.yearMonth}-30`,
        unitPrice: invoice.amountExclTax,
        quantity: 1,
        subtotal: invoice.amountExclTax,
      },
    ];
  }

  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await generateInvoicePdf({
      invoiceNumber: invoice.invoiceNumber,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      clientName: invoice.client.name,
      clientHonorific: invoice.client.honorific,
      amountExclTax: invoice.amountExclTax,
      taxAmount: invoice.taxAmount,
      amountInclTax: invoice.amountInclTax,
      memo: invoice.memo,
      lineItems: items,
    });
  } catch (e) {
    return NextResponse.json(
      {
        error: `PDF生成エラー: ${e instanceof Error ? e.message : String(e)}`,
      },
      { status: 500 },
    );
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "BLOB_READ_WRITE_TOKEN が未設定です" },
      { status: 500 },
    );
  }

  const safeClientName = invoice.client.name
    .replace(/[\\/:*?"<>|]/g, "")
    .slice(0, 40);
  const path = `invoices/${invoice.invoiceNumber}_${safeClientName}.pdf`;

  const blob = await put(path, pdfBuffer, {
    access: "public",
    contentType: "application/pdf",
    addRandomSuffix: true,
  });

  await getDb()
    .update(invoices)
    .set({
      pdfUrl: blob.url,
      updatedAt: new Date(),
    })
    .where(eq(invoices.id, invoice.id));

  return NextResponse.json({ pdfUrl: blob.url });
}
