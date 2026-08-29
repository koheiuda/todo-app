import { getDb } from "@/lib/db";
import { transferBatches } from "@/lib/db/schema";
import {
  buildTransferFileName,
  toZenginInput,
} from "@/lib/accounting/transfer/build";
import { getTransferPlan } from "@/lib/accounting/transfer/queries";
import { buildZenginFile } from "@/lib/accounting/transfer/zengin";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 総合振込（全銀フォーマット）ファイルを生成して返す。
 *
 * ここで返すのはあくまでファイル。実際の出金はGMOあおぞらネット銀行へ
 * アップロードして承認した時点で発生するため、このAPIが直接お金を動かすことはない。
 * 書き出した内容は transfer_batches に残し、二重振込の検知に使う。
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ ym: string }> },
) {
  const { ym } = await params;

  if (!/^\d{4}-\d{2}$/.test(ym)) {
    return NextResponse.json({ error: "年月の指定が不正です" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const rawDate = typeof body?.transferDate === "string" ? body.transferDate : "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
    return NextResponse.json(
      { error: "振込指定日を YYYY-MM-DD で指定してください" },
      { status: 400 },
    );
  }
  const [y, m, d] = rawDate.split("-").map((v) => parseInt(v, 10));
  const transferDate = new Date(y, m - 1, d);
  if (Number.isNaN(transferDate.getTime())) {
    return NextResponse.json({ error: "振込指定日が不正です" }, { status: 400 });
  }

  const { plan, remitter, migrationPending } = await getTransferPlan(ym);
  if (migrationPending) {
    return NextResponse.json(
      {
        error:
          "振込機能のセットアップが未完了です（scripts/migrate-add-payee-accounts.ts を実行してください）",
      },
      { status: 409 },
    );
  }
  if (!remitter) {
    return NextResponse.json(
      { error: "会社設定（振込元口座）が未登録です" },
      { status: 409 },
    );
  }
  if (plan.remitterErrors.length > 0) {
    return NextResponse.json(
      { error: plan.remitterErrors.join(" / ") },
      { status: 409 },
    );
  }
  if (plan.ready.length === 0) {
    return NextResponse.json(
      { error: "振込可能な明細がありません" },
      { status: 409 },
    );
  }

  let file: Uint8Array;
  try {
    file = buildZenginFile(toZenginInput(plan, remitter, transferDate));
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "ファイル生成に失敗しました" },
      { status: 422 },
    );
  }

  // 何を書き出したかを内容ごと残す。あとから通帳と突合できるようにするため。
  await getDb()
    .insert(transferBatches)
    .values({
      yearMonth: ym,
      transferDate: rawDate,
      itemCount: plan.ready.length,
      totalAmount: plan.totalAmount,
      items: plan.ready.map((line) => ({
        outsourcingId: line.outsourcingId,
        contractorName: line.contractorName,
        payeeNameKana: line.account?.payeeNameKana ?? "",
        bankCode: line.account?.bankCode ?? "",
        branchCode: line.account?.branchCode ?? "",
        accountNumber: line.account?.accountNumber ?? "",
        amount: line.amount,
      })),
    });

  revalidatePath(`/accounting/months/${ym}`);

  const filename = buildTransferFileName(ym, transferDate);
  const buf = Buffer.from(file);

  return new NextResponse(buf, {
    status: 200,
    headers: {
      // 全銀フォーマットはShift_JIS。テキスト扱いで文字化けさせないよう charset を明示する。
      "Content-Type": "text/plain; charset=Shift_JIS",
      "Content-Disposition": `attachment; filename="zengin_${ym}.txt"; filename*=UTF-8''${encodeURIComponent(
        filename,
      )}`,
      "Content-Length": String(buf.length),
      "Cache-Control": "private, no-store",
    },
  });
}
