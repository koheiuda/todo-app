/**
 * マイグレーション未適用のDBに新しいコードが載ったときの検出。
 *
 * Drizzle の `.select()` はスキーマ定義の全カラムを SELECT するため、
 * カラム追加を含むデプロイがマイグレーションより先に走ると、
 * 「まだ存在しないカラム/テーブル」を参照して既存機能まで落ちる。
 * デプロイ順序に依存しないよう、この状態を検出して読み取り側で退避する。
 */

/** PostgreSQL のエラーコード。 */
const UNDEFINED_TABLE = "42P01";
const UNDEFINED_COLUMN = "42703";

/** テーブル/カラムが未作成であることによるエラーか。 */
export function isMissingSchemaError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const code = (error as { code?: unknown }).code;
  return code === UNDEFINED_TABLE || code === UNDEFINED_COLUMN;
}
