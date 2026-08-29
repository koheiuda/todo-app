/**
 * 全銀協フォーマット（総合振込・種別コード21）のファイル生成。
 *
 * 1レコード120バイト固定長・Shift_JIS。ヘッダ→データ×N→トレーラ→エンドの順で並べる。
 * 出来上がったファイルはGMOあおぞらネット銀行の「総合振込（ファイル伝送）」に
 * そのままアップロードできる。銀行側で内容を確認してから承認する運用なので、
 * このファイルを作った時点では現金は動かない。
 */

import { findUnsupportedChars } from "./kana";

/** 預金種目コード。全銀の定義値。 */
export const DEPOSIT_TYPE_CODE = {
  ordinary: "1", // 普通
  checking: "2", // 当座
  savings: "4", // 貯蓄
  other: "9", // その他
} as const;

export type DepositType = keyof typeof DEPOSIT_TYPE_CODE;

/** 振込元（委託者）の口座。会社設定から渡す。 */
export interface ZenginRemitter {
  /** 銀行から払い出される委託者コード（10桁） */
  consignorCode: string;
  /** 委託者名（全銀の40桁枠。半角カナ済みの文字列） */
  consignorName: string;
  bankCode: string;
  bankName: string;
  branchCode: string;
  branchName: string;
  depositType: DepositType;
  accountNumber: string;
}

/** 振込先1件。 */
export interface ZenginPayee {
  bankCode: string;
  bankName: string;
  branchCode: string;
  branchName: string;
  depositType: DepositType;
  accountNumber: string;
  /** 受取人名。normalizePayeeName を通した半角カナであること。 */
  payeeName: string;
  /** 振込金額（円・整数） */
  amount: number;
}

export interface ZenginFileInput {
  remitter: ZenginRemitter;
  payees: ZenginPayee[];
  /** 振込指定日 */
  transferDate: Date;
}

const RECORD_LENGTH = 120;
const CRLF = "\r\n";

/**
 * 全銀で使える文字だけを含む文字列を Shift_JIS バイト列へ変換する。
 * 許容文字はすべて1バイトなので、多バイト文字の考慮は不要（あれば例外にする）。
 */
export function encodeZenginSjis(value: string): Uint8Array {
  const bytes = new Uint8Array(value.length);
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code >= 0x20 && code <= 0x7e) {
      // ASCII 図形文字はそのまま
      bytes[i] = code;
    } else if (code >= 0xff61 && code <= 0xff9f) {
      // 半角カナは 0xA1〜0xDF へ写す
      bytes[i] = code - 0xff61 + 0xa1;
    } else {
      throw new Error(
        `全銀フォーマットで使えない文字が含まれています: "${value[i]}" (U+${code
          .toString(16)
          .toUpperCase()
          .padStart(4, "0")})`,
      );
    }
  }
  return bytes;
}

/** 右をスペースで埋める。溢れた分は切り捨てる（全銀は固定長のため）。 */
function padName(value: string, length: number): string {
  const safe = value.slice(0, length);
  return safe.padEnd(length, " ");
}

/** 左を0で埋める。数字以外が来たら例外。 */
function padNumber(value: string | number, length: number): string {
  const text = String(value);
  if (!/^\d*$/.test(text)) {
    throw new Error(`数字以外が含まれています: "${text}"`);
  }
  if (text.length > length) {
    throw new Error(`${length}桁に収まりません: "${text}"`);
  }
  return text.padStart(length, "0");
}

function headerRecord(input: ZenginFileInput): string {
  const { remitter, transferDate } = input;
  const mmdd =
    String(transferDate.getMonth() + 1).padStart(2, "0") +
    String(transferDate.getDate()).padStart(2, "0");

  const record =
    "1" + // データ区分
    "21" + // 種別コード（総合振込）
    "0" + // コード区分（0=JIS）
    padNumber(remitter.consignorCode, 10) +
    padName(remitter.consignorName, 40) +
    mmdd + // 取組日 MMDD
    padNumber(remitter.bankCode, 4) +
    padName(remitter.bankName, 15) +
    padNumber(remitter.branchCode, 3) +
    padName(remitter.branchName, 15) +
    DEPOSIT_TYPE_CODE[remitter.depositType] +
    padNumber(remitter.accountNumber, 7) +
    " ".repeat(17); // ダミー
  return record;
}

function dataRecord(payee: ZenginPayee): string {
  const record =
    "2" + // データ区分
    padNumber(payee.bankCode, 4) +
    padName(payee.bankName, 15) +
    padNumber(payee.branchCode, 3) +
    padName(payee.branchName, 15) +
    " ".repeat(4) + // 手形交換所番号（未使用）
    DEPOSIT_TYPE_CODE[payee.depositType] +
    padNumber(payee.accountNumber, 7) +
    padName(payee.payeeName, 30) +
    padNumber(payee.amount, 10) +
    "0" + // 新規コード（0=その他）
    " ".repeat(10) + // 顧客コード1（未使用）
    " ".repeat(10) + // 顧客コード2（未使用）
    "7" + // 振込指定区分（7=電信）
    " " + // 識別表示
    " ".repeat(7); // ダミー
  return record;
}

function trailerRecord(payees: ZenginPayee[]): string {
  const total = payees.reduce((sum, p) => sum + p.amount, 0);
  return (
    "8" + // データ区分
    padNumber(payees.length, 6) +
    padNumber(total, 12) +
    " ".repeat(101)
  );
}

function endRecord(): string {
  return "9" + " ".repeat(119);
}

/** 各レコードが厳密に120バイトであることを保証する。 */
function assertRecordLength(record: string, label: string): void {
  const bytes = encodeZenginSjis(record);
  if (bytes.length !== RECORD_LENGTH) {
    throw new Error(
      `${label}レコードが${RECORD_LENGTH}バイトではありません: ${bytes.length}バイト`,
    );
  }
}

/**
 * 全銀フォーマットの各レコード（120バイト固定長・改行なし）を順に組み立てる。
 * 改行を含めないのは、encodeZenginSjis が制御文字を許さないため。
 */
export function buildZenginRecords(input: ZenginFileInput): string[] {
  if (input.payees.length === 0) {
    throw new Error("振込先が1件もありません");
  }

  const header = headerRecord(input);
  assertRecordLength(header, "ヘッダー");

  const records = [header];
  for (const payee of input.payees) {
    if (!Number.isInteger(payee.amount) || payee.amount <= 0) {
      throw new Error(
        `振込金額が不正です（${payee.payeeName}）: ${payee.amount}`,
      );
    }
    const record = dataRecord(payee);
    assertRecordLength(record, `データ(${payee.payeeName})`);
    records.push(record);
  }

  const trailer = trailerRecord(input.payees);
  assertRecordLength(trailer, "トレーラ");
  records.push(trailer);

  const end = endRecord();
  assertRecordLength(end, "エンド");
  records.push(end);

  return records;
}

/** 全銀フォーマットのテキスト（Shift_JIS化前）。目視確認・テスト用。 */
export function buildZenginText(input: ZenginFileInput): string {
  return buildZenginRecords(input).join(CRLF) + CRLF;
}

/**
 * 全銀フォーマットのファイル本体（Shift_JIS）を生成する。
 * レコード本体だけをエンコードし、区切りのCRLFはバイトで直接挿入する。
 */
export function buildZenginFile(input: ZenginFileInput): Uint8Array {
  const records = buildZenginRecords(input);
  const encoded = records.map(encodeZenginSjis);
  const total = encoded.reduce((sum, r) => sum + r.length + 2, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const record of encoded) {
    out.set(record, offset);
    offset += record.length;
    out[offset++] = 0x0d; // CR
    out[offset++] = 0x0a; // LF
  }
  return out;
}

/**
 * 振込先の内容を事前検証する。ファイル生成前にUIで潰しきるために使う。
 * 例外ではなくエラー文言の配列を返す。
 */
export function validatePayee(payee: ZenginPayee): string[] {
  const errors: string[] = [];

  if (!/^\d{4}$/.test(payee.bankCode)) {
    errors.push("金融機関コードは4桁の数字で入力してください");
  }
  if (!/^\d{3}$/.test(payee.branchCode)) {
    errors.push("支店コードは3桁の数字で入力してください");
  }
  if (!/^\d{1,7}$/.test(payee.accountNumber)) {
    errors.push("口座番号は7桁以内の数字で入力してください");
  }
  if (!payee.payeeName.trim()) {
    errors.push("受取人名（カナ）を入力してください");
  }
  if (payee.payeeName.length > 30) {
    errors.push(
      `受取人名が30文字を超えています（${payee.payeeName.length}文字）。濁点も1文字と数えます`,
    );
  }
  const badName = findUnsupportedChars(payee.payeeName);
  if (badName.length > 0) {
    errors.push(
      `受取人名に使えない文字があります: ${badName.join(" ")}（半角カナ・英大文字・数字のみ）`,
    );
  }
  const badBank = findUnsupportedChars(payee.bankName + payee.branchName);
  if (badBank.length > 0) {
    errors.push(
      `金融機関名・支店名に使えない文字があります: ${badBank.join(" ")}`,
    );
  }
  if (!Number.isInteger(payee.amount) || payee.amount <= 0) {
    errors.push("振込金額は1円以上の整数で入力してください");
  }
  if (payee.amount > 9_999_999_999) {
    errors.push("振込金額が全銀の桁数（10桁）を超えています");
  }

  return errors;
}
