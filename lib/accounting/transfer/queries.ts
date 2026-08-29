import { asc, desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  companySettings,
  outsourcingCosts,
  payeeAccounts,
  transferBatches,
  type PayeeAccount,
  type TransferBatch,
} from "@/lib/db/schema";
import { buildTransferPlan, type RemitterLike, type TransferPlan } from "./build";

export async function listPayeeAccounts(): Promise<PayeeAccount[]> {
  return getDb()
    .select()
    .from(payeeAccounts)
    .orderBy(asc(payeeAccounts.contractorName));
}

/** 会社設定から委託者（振込元）情報だけを取り出す。未登録なら null。 */
export async function getRemitter(): Promise<RemitterLike | null> {
  const rows = await getDb()
    .select()
    .from(companySettings)
    .where(eq(companySettings.id, "default"))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  return {
    consignorCode: row.consignorCode,
    consignorNameKana: row.consignorNameKana,
    transferBankCode: row.transferBankCode,
    transferBankNameKana: row.transferBankNameKana,
    transferBranchCode: row.transferBranchCode,
    transferBranchNameKana: row.transferBranchNameKana,
    transferDepositType: row.transferDepositType,
    transferAccountNumber: row.transferAccountNumber,
  };
}

/** その月の外注費から振込プランを組み立てる。 */
export async function getTransferPlan(
  yearMonth: string,
): Promise<{ plan: TransferPlan; remitter: RemitterLike | null }> {
  const [rows, accounts, remitter] = await Promise.all([
    getDb()
      .select()
      .from(outsourcingCosts)
      .where(eq(outsourcingCosts.yearMonth, yearMonth))
      .orderBy(asc(outsourcingCosts.sortOrder), asc(outsourcingCosts.createdAt)),
    listPayeeAccounts(),
    getRemitter(),
  ]);

  const plan = buildTransferPlan({
    outsourcing: rows.map((r) => ({
      id: r.id,
      contractorName: r.contractorName,
      amountInclTax: r.amountInclTax,
      payeeAccountId: r.payeeAccountId,
    })),
    accounts: accounts.map((a) => ({
      id: a.id,
      contractorName: a.contractorName,
      bankCode: a.bankCode,
      bankNameKana: a.bankNameKana,
      branchCode: a.branchCode,
      branchNameKana: a.branchNameKana,
      depositType: a.depositType,
      accountNumber: a.accountNumber,
      payeeNameKana: a.payeeNameKana,
      isActive: a.isActive,
    })),
    remitter,
  });

  return { plan, remitter };
}

/** その月に既に書き出した振込バッチ（新しい順）。二重振込の警告に使う。 */
export async function listTransferBatches(
  yearMonth: string,
): Promise<TransferBatch[]> {
  return getDb()
    .select()
    .from(transferBatches)
    .where(eq(transferBatches.yearMonth, yearMonth))
    .orderBy(desc(transferBatches.createdAt));
}
