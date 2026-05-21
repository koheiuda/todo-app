import { getInvoice } from "@/lib/accounting/queries";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const invoice = await getInvoice(id);
  if (!invoice || !invoice.pdfUrl) {
    return NextResponse.json(
      { error: "PDFが未発行です" },
      { status: 404 },
    );
  }
  return NextResponse.redirect(invoice.pdfUrl);
}
