import { getDb } from "@/lib/db";
import { getInvoice } from "@/lib/accounting/queries";
import { invoices } from "@/lib/db/schema";
import { sendInvoiceMail } from "@/lib/accounting/email/gmail";
import {
  buildSubject,
  buildBody,
  buildPdfFileName,
} from "@/lib/accounting/email/template";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  to: z.array(z.string().trim().email()).optional(),
  cc: z.array(z.string().trim().email()).optional(),
});

export async function POST(
  req: Request,
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
  if (!invoice.pdfUrl) {
    return NextResponse.json(
      { error: "先にPDFを発行してください" },
      { status: 400 },
    );
  }

  let parsed: z.infer<typeof BodySchema> = {};
  try {
    const json = await req.json().catch(() => ({}));
    parsed = BodySchema.parse(json);
  } catch {
    return NextResponse.json(
      { error: "メールアドレスの形式が不正です" },
      { status: 400 },
    );
  }

  // 宛先: リクエスト指定があれば優先、なければ会社登録分
  const to = (parsed.to ?? invoice.client.invoiceEmails ?? []).filter(Boolean);
  const cc = (parsed.cc ?? invoice.client.invoiceCcEmails ?? []).filter(Boolean);
  if (to.length === 0) {
    return NextResponse.json(
      { error: "送付先メールアドレス（TO）が登録されていません" },
      { status: 400 },
    );
  }

  // PDF を取得
  let pdfBuffer: Buffer;
  try {
    const res = await fetch(invoice.pdfUrl);
    if (!res.ok) throw new Error(`PDF取得失敗 (${res.status})`);
    pdfBuffer = Buffer.from(await res.arrayBuffer());
  } catch (e) {
    return NextResponse.json(
      { error: `PDF取得エラー: ${e instanceof Error ? e.message : String(e)}` },
      { status: 502 },
    );
  }

  const subject = buildSubject(
    invoice.yearMonth,
    invoice.client.name,
    invoice.client.honorific,
  );
  const body = buildBody(invoice.client.name, invoice.client.honorific);
  const filename = buildPdfFileName(
    invoice.yearMonth,
    invoice.client.name,
    invoice.client.honorific,
  );

  try {
    await sendInvoiceMail({
      to,
      cc,
      subject,
      body,
      attachment: { filename, content: pdfBuffer },
    });
  } catch (e) {
    return NextResponse.json(
      {
        error: `メール送信エラー: ${e instanceof Error ? e.message : String(e)}`,
      },
      { status: 500 },
    );
  }

  // 送付済みにする
  await getDb()
    .update(invoices)
    .set({ sentAt: new Date(), updatedAt: new Date() })
    .where(eq(invoices.id, invoice.id));

  return NextResponse.json({ ok: true, to, cc });
}
