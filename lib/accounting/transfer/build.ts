/**
 * 外注費の行と口座マスタから、総合振込の内容を組み立てる。
 *
 * DBの型に直接依存させず構造的な型で受けるのは、この層を単体で検証できるようにするため。
 * 「振込めない行」を落とさず理由付きで返すので、UIはそのまま原因を出せる。
 */

import { findUnsupportedChars } from "./kana";
import {
  validatePayee,
  type DepositType,
  type ZenginFileInput,
  type ZenginPayee,
  type ZenginRemitter,
} from "./zengin";

/** outsourcing_costs の必要な部分。 */
export interface OutsourcingLike {
  id: string;
  contractorName: string;
  amountInclTax: number;
  payeeAccountId: string | null;
}

/** payee_accounts の必要な部分。 */
export interface PayeeAccountLike {
  id: string;
  contractorName: string;
  bankCode: string;
  bankNameKana: string;
  branchCode: string;
  branchNameKana: string;
  depositType: DepositType;
  accountNumber: string;
  payeeNameKana: string;
  isActive: boolean;
}

/** company_settings の振込関連部分。 */
export interface RemitterLike {
  consignorCode: string | null;
  consignorNameKana: string | null;
  transferBankCode: string | null;
  transferBankNameKana: string | null;
  transferBranchCode: string | null;
  transferBranchNameKana: string | null;
  transferDepositType: DepositType | null;
  transferAccountNumber: string | null;
}

export interface TransferLine {
  outsourcingId: string;
  contractorName: string;
  amount: number;
  account: PayeeAccountLike | null;
  /** 空なら振込可能。1件でもあれば除外される。 */
  errors: string[];
}

export interface TransferPlan {
  lines: TransferLine[];
  /** 振込可能な行だけ */
  ready: TransferLine[];
  /** 何らかの理由で振込めない行 */
  blocked: TransferLine[];
  /** 自社（委託者）側の設定不足 */
  remitterErrors: string[];
  /** ready の合計金額 */
  totalAmount: number;
}

/** 口座マスタを引き当てる。payee_account_id が最優先、無ければ外注先名で一致を見る。 */
function findAccount(
  row: OutsourcingLike,
  accounts: PayeeAccountLike[],
): PayeeAccountLike | null {
  if (row.payeeAccountId) {
    const byId = accounts.find((a) => a.id === row.payeeAccountId);
    if (byId) return byId;
  }
  const name = row.contractorName.trim();
  return accounts.find((a) => a.contractorName.trim() === name) ?? null;
}

/** 委託者（自社）情報の不足を洗い出す。 */
export function validateRemitter(remitter: RemitterLike | null): string[] {
  if (!remitter) return ["会社設定が未登録です"];
  const errors: string[] = [];
  if (!remitter.consignorCode?.trim()) {
    errors.push("委託者コードが未設定です（銀行から払い出される10桁）");
  } else if (!/^\d{1,10}$/.test(remitter.consignorCode.trim())) {
    errors.push("委託者コードは10桁以内の数字で入力してください");
  }
  if (!remitter.consignorNameKana?.trim()) {
    errors.push("委託者名（半角カナ）が未設定です");
  } else {
    const bad = findUnsupportedChars(remitter.consignorNameKana);
    if (bad.length > 0) {
      errors.push(`委託者名に使えない文字があります: ${bad.join(" ")}`);
    }
  }
  if (!/^\d{4}$/.test(remitter.transferBankCode ?? "")) {
    errors.push("振込元の金融機関コード（4桁）が未設定です");
  }
  if (!/^\d{3}$/.test(remitter.transferBranchCode ?? "")) {
    errors.push("振込元の支店コード（3桁）が未設定です");
  }
  if (!/^\d{1,7}$/.test(remitter.transferAccountNumber ?? "")) {
    errors.push("振込元の口座番号（7桁以内）が未設定です");
  }
  return errors;
}

/**
 * 外注費の一覧から振込プランを作る。
 * 金額0以下の行は「振込対象外」として静かに除外する（未確定の行を誤って送らないため）。
 */
export function buildTransferPlan(params: {
  outsourcing: OutsourcingLike[];
  accounts: PayeeAccountLike[];
  remitter: RemitterLike | null;
}): TransferPlan {
  const { outsourcing, accounts, remitter } = params;

  const lines: TransferLine[] = [];
  for (const row of outsourcing) {
    if (row.amountInclTax <= 0) continue;

    const account = findAccount(row, accounts);
    const errors: string[] = [];

    if (!account) {
      errors.push("振込先口座が未登録です");
    } else if (!account.isActive) {
      errors.push("振込先口座が無効化されています");
    } else {
      errors.push(
        ...validatePayee({
          bankCode: account.bankCode,
          bankName: account.bankNameKana,
          branchCode: account.branchCode,
          branchName: account.branchNameKana,
          depositType: account.depositType,
          accountNumber: account.accountNumber,
          payeeName: account.payeeNameKana,
          amount: row.amountInclTax,
        }),
      );
    }

    lines.push({
      outsourcingId: row.id,
      contractorName: row.contractorName,
      amount: row.amountInclTax,
      account,
      errors,
    });
  }

  const ready = lines.filter((l) => l.errors.length === 0);
  const blocked = lines.filter((l) => l.errors.length > 0);

  return {
    lines,
    ready,
    blocked,
    remitterErrors: validateRemitter(remitter),
    totalAmount: ready.reduce((sum, l) => sum + l.amount, 0),
  };
}

/**
 * 振込プランを全銀ファイル生成の入力へ変換する。
 * 振込可能な行が無い、または委託者情報が不足していれば例外にする。
 */
export function toZenginInput(
  plan: TransferPlan,
  remitter: RemitterLike,
  transferDate: Date,
): ZenginFileInput {
  if (plan.remitterErrors.length > 0) {
    throw new Error(
      `振込元の設定が不足しています: ${plan.remitterErrors.join(" / ")}`,
    );
  }
  if (plan.ready.length === 0) {
    throw new Error("振込可能な明細がありません");
  }

  const zenginRemitter: ZenginRemitter = {
    consignorCode: (remitter.consignorCode ?? "").trim(),
    consignorName: (remitter.consignorNameKana ?? "").trim(),
    bankCode: (remitter.transferBankCode ?? "").trim(),
    bankName: (remitter.transferBankNameKana ?? "").trim(),
    branchCode: (remitter.transferBranchCode ?? "").trim(),
    branchName: (remitter.transferBranchNameKana ?? "").trim(),
    depositType: remitter.transferDepositType ?? "ordinary",
    accountNumber: (remitter.transferAccountNumber ?? "").trim(),
  };

  const payees: ZenginPayee[] = plan.ready.map((line) => {
    // ready の行は account が非 null であることが buildTransferPlan で保証されている。
    const account = line.account as PayeeAccountLike;
    return {
      bankCode: account.bankCode,
      bankName: account.bankNameKana,
      branchCode: account.branchCode,
      branchName: account.branchNameKana,
      depositType: account.depositType,
      accountNumber: account.accountNumber,
      payeeName: account.payeeNameKana,
      amount: line.amount,
    };
  });

  return { remitter: zenginRemitter, payees, transferDate };
}

/** ダウンロードファイル名。例: 総合振込_2026-07_20260831.txt */
export function buildTransferFileName(
  yearMonth: string,
  transferDate: Date,
): string {
  const stamp =
    String(transferDate.getFullYear()) +
    String(transferDate.getMonth() + 1).padStart(2, "0") +
    String(transferDate.getDate()).padStart(2, "0");
  return `総合振込_${yearMonth}_${stamp}.txt`;
}
