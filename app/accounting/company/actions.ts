"use server";

import { getDb } from "@/lib/db";
import { companySettings } from "@/lib/db/schema";
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
