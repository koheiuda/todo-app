import { asc, desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { isMissingSchemaError } from "@/lib/accounting/db-errors";
import {
  companySettings,
  outsourcingCosts,
  payeeAccounts,
  transferBatches,
  type PayeeAccount,
  type TransferBatch,
} from "@/lib/db/schema";
import { buildTransferPlan, type RemitterLike, type TransferPlan } from "./build";

/**
 * 振込用のテーブルはマイグレーションで後から作られる。
 * デプロイがマイグレーションより先に走っても既存画面を落とさないよう、
 * 未作成なら「空」を返して呼び出し側に判断させる。
 */
export async function listPayeeAccounts(): Promise<PayeeAccount[]> {
  try {
    return await getDb()
      .select()
      .from(payeeAccounts)
      .orderBy(asc(payeeAccounts.contractorName));
  } catch (e) {
    if (isMissingSchemaError(e)) return [];
    throw e;
  }
}

/** payee_accounts テーブルが作成済みか。未作成なら振込機能は使えない。 */
export async function isTransferSchemaReady(): Promise<boolean> {
  try {
    await getDb().select({ id: payeeAccounts.id }).from(payeeAccounts).limit(1);
    return true;
  } catch (e) {
    if (isMissingSchemaError(e)) return false;
    throw e;
  }
}

/**
 * 会社設定から委託者（振込元）情報だけを取り出す。未登録なら null。
 * 振込用カラムがまだ無いDBでも落とさない（マイグレーション前は null 扱い）。
 */
export async function getRemitter(): Promise<RemitterLike | null> {
  let row;
  try {
    const rows = await getDb()
      .select()
      .from(companySettings)
      .where(eq(companySettings.id, "default"))
      .limit(1);
    row = rows[0];
  } catch (e) {
    if (isMissingSchemaError(e)) return null;
    throw e;
  }
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

export interface TransferPlanResult {
  plan: TransferPlan;
  remitter: RemitterLike | null;
  /** マイグレーション未実行のため振込機能が使えない状態か。 */
  migrationPending: boolean;
}

/** その月の外注費から振込プランを組み立てる。 */
export async function getTransferPlan(
  yearMonth: string,
): Promise<TransferPlanResult> {
  const [rows, accounts, remitter] = await Promise.all([
    getDb()
      .select()
      .from(outsourcingCosts)
      .where(eq(outsourcingCosts.yearMonth, yearMonth))
      .orderBy(asc(outsourcingCosts.sortOrder), asc(outsourcingCosts.createdAt)),
    listPayeeAccounts(),
    getRemitter(),
  ]);

  // 口座が0件なのは「未登録」と「テーブル未作成」の両方がありうる。
  // 表示するメッセージが変わるので、0件のときだけ追加で確かめる。
  const migrationPending =
    accounts.length === 0 ? !(await isTransferSchemaReady()) : false;

  const plan = buildTransferPlan({
    outsourcing: rows.map((r) => ({
      id: r.id,
      contractorName: r.contractorName,
      amountInclTax: r.amountInclTax,
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

  return { plan, remitter, migrationPending };
}

/** その月に既に書き出した振込バッチ（新しい順）。二重振込の警告に使う。 */
export async function listTransferBatches(
  yearMonth: string,
): Promise<TransferBatch[]> {
  try {
    return await getDb()
      .select()
      .from(transferBatches)
      .where(eq(transferBatches.yearMonth, yearMonth))
      .orderBy(desc(transferBatches.createdAt));
  } catch (e) {
    if (isMissingSchemaError(e)) return [];
    throw e;
  }
}
