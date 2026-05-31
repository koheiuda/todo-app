// 請求書メールの件名・本文・添付ファイル名を生成する純粋関数群。
// サーバ（送信API）とクライアント（確認ダイアログのプレビュー）の両方から import して
// 文面を一致させる。サーバ専用の依存は持たせないこと。

const SENDER_COMPANY = "株式会社Mesut";

/** "2026-05" -> { year: 2026, month: 5 } */
export function parseYearMonth(yearMonth: string): { year: number; month: number } {
  const [y, m] = yearMonth.split("-");
  return { year: Number(y), month: Number(m) };
}

/** 件名: 【株式会社Mesut】2026年5月請求書_StockSun株式会社 御中 */
export function buildSubject(
  yearMonth: string,
  clientName: string,
  honorific = "御中",
): string {
  const { year, month } = parseYearMonth(yearMonth);
  return `【${SENDER_COMPANY}】${year}年${month}月請求書_${clientName} ${honorific}`;
}

/** 本文（固定テンプレ。先頭の宛名のみ会社名で差し替え）。 */
export function buildBody(clientName: string, honorific = "御中"): string {
  return `${clientName} ${honorific}

お世話になります。
${SENDER_COMPANY}の宇田晃平です。

請求書を送付させていただきます。
ご確認のほどよろしくお願いいたします。

引き続き何卒よろしくお願いいたします。

＝＝＝＝＝＝＝＝＝＝＝＝
・会社名：${SENDER_COMPANY}
・代表：宇田 晃平
・住所：〒160-0023
東京都新宿区西新宿７丁目５－１２岡田ビル３０２号
・法人番号：6010701046376
・HP：https://mesut.co.jp/
＝＝＝＝＝＝＝＝＝＝＝＝`;
}

/** PDFファイル名（ダウンロード・メール添付 共通）:
 *  【株式会社Mesut】2026年5月請求書_StockSun株式会社 御中.pdf */
export function buildPdfFileName(
  yearMonth: string,
  clientName: string,
  honorific = "御中",
): string {
  const { year, month } = parseYearMonth(yearMonth);
  // ファイル名に使えない文字のみ除去（全角や空白・括弧はそのまま残す）
  const safeName = clientName.replace(/[\\/:*?"<>|]/g, "");
  return `【${SENDER_COMPANY}】${year}年${month}月請求書_${safeName} ${honorific}.pdf`;
}

/** @deprecated buildPdfFileName を使う */
export const buildAttachmentName = buildPdfFileName;
