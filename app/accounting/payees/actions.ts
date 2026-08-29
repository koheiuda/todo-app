"use server";

import { getDb } from "@/lib/db";
import { payeeAccounts, type PayeeAccount } from "@/lib/db/schema";
import { normalizePayeeName } from "@/lib/accounting/transfer/kana";
import { validatePayee } from "@/lib/accounting/transfer/zengin";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const PayeeSchema = z.object({
  contractorName: z.string().trim().min(1, "外注先名を入力してください"),
  bankCode: z.string().trim().regex(/^\d{4}$/, "金融機関コードは4桁の数字です"),
  bankNameKana: z.string().trim().min(1, "金融機関名（カナ）を入力してください"),
  branchCode: z.string().trim().regex(/^\d{3}$/, "支店コードは3桁の数字です"),
  branchNameKana: z.string().trim().min(1, "支店名（カナ）を入力してください"),
  depositType: z.enum(["ordinary", "checking", "savings", "other"]),
  accountNumber: z
    .string()
    .trim()
    .regex(/^\d{1,7}$/, "口座番号は7桁以内の数字です"),
  payeeNameKana: z.string().trim().min(1, "受取人名（カナ）を入力してください"),
  memo: z.string().trim().optional().nullable(),
});

export type PayeeActionResult =
  | { ok: true }
  | { ok: false; errors: string[] };

/**
 * 振込先口座を登録・更新する。
 * カナ項目は保存時に必ず半角カナへ正規化し、そのうえで全銀の検証を通す。
 * ここで弾いておかないと、振込当日にファイルごと蹴られる。
 */
export async function savePayeeAccount(
  id: string | null,
  input: unknown,
): Promise<PayeeActionResult> {
  const parsed = PayeeSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues.map((i) => i.message),
    };
  }
  const data = parsed.data;

  const normalized = {
    ...data,
    bankNameKana: normalizePayeeName(data.bankNameKana),
    branchNameKana: normalizePayeeName(data.branchNameKana),
    payeeNameKana: normalizePayeeName(data.payeeNameKana),
  };

  // 金額はここでは決まらないので、桁チェックだけ通せる 1 円で検証する。
  const errors = validatePayee({
    bankCode: normalized.bankCode,
    bankName: normalized.bankNameKana,
    branchCode: normalized.branchCode,
    branchName: normalized.branchNameKana,
    depositType: normalized.depositType,
    accountNumber: normalized.accountNumber,
    payeeName: normalized.payeeNameKana,
    amount: 1,
  });
  if (errors.length > 0) return { ok: false, errors };

  const values = {
    contractorName: normalized.contractorName,
    bankCode: normalized.bankCode,
    bankNameKana: normalized.bankNameKana,
    branchCode: normalized.branchCode,
    branchNameKana: normalized.branchNameKana,
    depositType: normalized.depositType,
    accountNumber: normalized.accountNumber,
    payeeNameKana: normalized.payeeNameKana,
    memo: normalized.memo ?? null,
    updatedAt: new Date(),
  };

  if (id) {
    await getDb()
      .update(payeeAccounts)
      .set(values)
      .where(eq(payeeAccounts.id, id));
  } else {
    await getDb()
      .insert(payeeAccounts)
      .values(values)
      .onConflictDoUpdate({
        target: payeeAccounts.contractorName,
        set: values,
      });
  }

  revalidatePath("/accounting/payees");
  return { ok: true };
}

export async function setPayeeAccountActive(
  id: string,
  isActive: boolean,
): Promise<void> {
  await getDb()
    .update(payeeAccounts)
    .set({ isActive, updatedAt: new Date() })
    .where(eq(payeeAccounts.id, id));
  revalidatePath("/accounting/payees");
}

export async function deletePayeeAccount(
  id: string,
): Promise<PayeeAccount | null> {
  const rows = await getDb()
    .select()
    .from(payeeAccounts)
    .where(eq(payeeAccounts.id, id))
    .limit(1);
  if (!rows[0]) return null;
  await getDb().delete(payeeAccounts).where(eq(payeeAccounts.id, id));
  revalidatePath("/accounting/payees");
  return rows[0];
}
