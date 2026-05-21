"use server";

import { getDb } from "@/lib/db";
import { clients } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const ClientSchema = z.object({
  name: z.string().trim().min(1, "請求先名を入力してください"),
  honorific: z.string().trim().min(1).default("御中"),
  postalCode: z.string().trim().nullable().optional(),
  address: z.string().trim().nullable().optional(),
  department: z.string().trim().nullable().optional(),
  contactPerson: z.string().trim().nullable().optional(),
  contactEmail: z
    .string()
    .trim()
    .email("メールアドレスの形式が不正です")
    .nullable()
    .optional()
    .or(z.literal("").transform(() => null)),
  contactPhone: z.string().trim().nullable().optional(),
  billingNotes: z.string().trim().nullable().optional(),
  defaultMemo: z.string().trim().nullable().optional(),
  isActive: z.boolean().default(true),
});

function normalize(input: z.infer<typeof ClientSchema>) {
  return {
    name: input.name,
    honorific: input.honorific,
    postalCode: input.postalCode || null,
    address: input.address || null,
    department: input.department || null,
    contactPerson: input.contactPerson || null,
    contactEmail: input.contactEmail || null,
    contactPhone: input.contactPhone || null,
    billingNotes: input.billingNotes || null,
    defaultMemo: input.defaultMemo || null,
    isActive: input.isActive,
  };
}

export async function createClient(input: unknown) {
  const data = ClientSchema.parse(input);
  await getDb().insert(clients).values(normalize(data));
  revalidatePath("/accounting/clients");
}

export async function updateClient(id: string, input: unknown) {
  const data = ClientSchema.parse(input);
  await getDb()
    .update(clients)
    .set({ ...normalize(data), updatedAt: new Date() })
    .where(eq(clients.id, id));
  revalidatePath("/accounting/clients");
}

export async function toggleClientActive(id: string, isActive: boolean) {
  await getDb()
    .update(clients)
    .set({ isActive, updatedAt: new Date() })
    .where(eq(clients.id, id));
  revalidatePath("/accounting/clients");
}

export async function deleteClient(id: string) {
  await getDb().delete(clients).where(eq(clients.id, id));
  revalidatePath("/accounting/clients");
}
