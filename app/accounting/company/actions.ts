"use server";

import { getDb } from "@/lib/db";
import { companySettings } from "@/lib/db/schema";
import { normalizePayeeName } from "@/lib/accounting/transfer/kana";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const CompanySchema = z.object({
  name: z.string().trim().min(1, "会社名を入力してください"),
  postalCode: z.string().trim().nullable().optional(),
  address: z.string().trim().nullable().optional(),
  tel: z.string().trim().nullable().optional(),
  email: z
    .string()
    .trim()
    .email("メールアドレスの形式が不正です")
    .nullable()
    .optional()
    .or(z.literal("").transform(() => null)),
  invoiceNumber: z.string().trim().nullable().optional(),
  bankInfo: z.string().trim().nullable().optional(),
  // 総合振込（全銀フォーマット）のヘッダーに入れる委託者情報。
  // 未入力のまま保存できてよい（振込を実行する段階で検証される）。
  consignorCode: z.string().trim().nullable().optional(),
  consignorNameKana: z.string().trim().nullable().optional(),
  transferBankCode: z.string().trim().nullable().optional(),
  transferBankNameKana: z.string().trim().nullable().optional(),
  transferBranchCode: z.string().trim().nullable().optional(),
  transferBranchNameKana: z.string().trim().nullable().optional(),
  transferDepositType: z
    .enum(["ordinary", "checking", "savings", "other"])
    .nullable()
    .optional(),
  transferAccountNumber: z.string().trim().nullable().optional(),
});

export async function updateCompanySettings(input: unknown) {
  const data = CompanySchema.parse(input);
  const patch = {
    name: data.name,
    postalCode: data.postalCode || null,
    address: data.address || null,
    tel: data.tel || null,
    email: data.email || null,
    invoiceNumber: data.invoiceNumber || null,
    bankInfo: data.bankInfo || null,
    consignorCode: data.consignorCode || null,
    // カナ項目は保存時に半角カナへ寄せる。全銀に通らない表記のまま持たないため。
    consignorNameKana: data.consignorNameKana
      ? normalizePayeeName(data.consignorNameKana)
      : null,
    transferBankCode: data.transferBankCode || null,
    transferBankNameKana: data.transferBankNameKana
      ? normalizePayeeName(data.transferBankNameKana)
      : null,
    transferBranchCode: data.transferBranchCode || null,
    transferBranchNameKana: data.transferBranchNameKana
      ? normalizePayeeName(data.transferBranchNameKana)
      : null,
    transferDepositType: data.transferDepositType ?? "ordinary",
    transferAccountNumber: data.transferAccountNumber || null,
    updatedAt: new Date(),
  };

  const exists = await getDb()
    .select()
    .from(companySettings)
    .where(eq(companySettings.id, "default"))
    .limit(1);
  if (exists[0]) {
    await getDb()
      .update(companySettings)
      .set(patch)
      .where(eq(companySettings.id, "default"));
  } else {
    await getDb()
      .insert(companySettings)
      .values({ id: "default", ...patch });
  }
  revalidatePath("/accounting/company");
}
