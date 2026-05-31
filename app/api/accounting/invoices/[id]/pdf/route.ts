import { getInvoice } from "@/lib/accounting/queries";
import { buildPdfFileName } from "@/lib/accounting/email/template";
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
    return NextResponse.json({ error: "PDFが未発行です" }, { status: 404 });
  }

  // ファイル名を指定して配信したいので Blob をプロキシして返す（リダイレクトしない）。
  const upstream = await fetch(invoice.pdfUrl);
  if (!upstream.ok) {
    // 取得できなければ従来どおりリダイレクトにフォールバック
    return NextResponse.redirect(invoice.pdfUrl);
  }
  const buf = Buffer.from(await upstream.arrayBuffer());

  const filename = invoice.client
    ? buildPdfFileName(
        invoice.yearMonth,
        invoice.client.name,
        invoice.client.honorific,
      )
    : `${invoice.invoiceNumber}.pdf`;

  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      // 日本語ファイル名は RFC5987 の filename* でエンコード。ASCIIフォールバックも併記。
      "Content-Disposition": `attachment; filename="${invoice.invoiceNumber}.pdf"; filename*=UTF-8''${encodeURIComponent(
        filename,
      )}`,
      "Content-Length": String(buf.length),
      "Cache-Control": "private, no-store",
    },
  });
}
