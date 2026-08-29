// 総合振込（全銀フォーマット）に必要なテーブル・カラムを追加する。
//   - deposit_type ENUM
//   - payee_accounts（外注先の振込口座マスタ）
//   - transfer_batches（振込ファイル書き出し履歴）
//   - company_settings の委託者・自社口座カラム
// 非破壊。既存テーブル（outsourcing_costs / invoices など）には一切触れないため、
// このマイグレーションを流す前のコードがそのまま動き続ける。
// 実行: npx tsx --env-file=.env.local scripts/migrate-add-payee-accounts.ts --apply

import { sql } from "drizzle-orm";
import { getDb } from "../lib/db";

const APPLY = process.argv.includes("--apply");

async function main() {
  const db = getDb();

  const steps: Array<[string, ReturnType<typeof sql>]> = [
    [
      "deposit_type ENUM を作成",
      sql`DO $$ BEGIN
            CREATE TYPE deposit_type AS ENUM ('ordinary', 'checking', 'savings', 'other');
          EXCEPTION WHEN duplicate_object THEN NULL;
          END $$`,
    ],
    [
      "payee_accounts テーブルを作成",
      sql`CREATE TABLE IF NOT EXISTS payee_accounts (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            contractor_name varchar(255) NOT NULL,
            bank_code varchar(4) NOT NULL,
            bank_name_kana varchar(15) NOT NULL,
            branch_code varchar(3) NOT NULL,
            branch_name_kana varchar(15) NOT NULL,
            deposit_type deposit_type NOT NULL DEFAULT 'ordinary',
            account_number varchar(7) NOT NULL,
            payee_name_kana varchar(30) NOT NULL,
            is_active boolean NOT NULL DEFAULT true,
            memo text,
            created_at timestamptz NOT NULL DEFAULT now(),
            updated_at timestamptz NOT NULL DEFAULT now()
          )`,
    ],
    [
      "payee_accounts.contractor_name に一意制約",
      sql`CREATE UNIQUE INDEX IF NOT EXISTS payee_accounts_contractor_name_uq
            ON payee_accounts (contractor_name)`,
    ],
    [
      "transfer_batches テーブルを作成",
      sql`CREATE TABLE IF NOT EXISTS transfer_batches (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            year_month varchar(7) NOT NULL,
            transfer_date date NOT NULL,
            item_count integer NOT NULL,
            total_amount integer NOT NULL,
            items jsonb NOT NULL,
            is_submitted boolean NOT NULL DEFAULT false,
            memo text,
            created_at timestamptz NOT NULL DEFAULT now()
          )`,
    ],
    [
      "transfer_batches.year_month にインデックス",
      sql`CREATE INDEX IF NOT EXISTS transfer_batches_year_month_idx
            ON transfer_batches (year_month)`,
    ],
    [
      "company_settings に委託者・自社口座カラムを追加",
      sql`ALTER TABLE company_settings
            ADD COLUMN IF NOT EXISTS consignor_code varchar(10),
            ADD COLUMN IF NOT EXISTS consignor_name_kana varchar(40),
            ADD COLUMN IF NOT EXISTS transfer_bank_code varchar(4),
            ADD COLUMN IF NOT EXISTS transfer_bank_name_kana varchar(15),
            ADD COLUMN IF NOT EXISTS transfer_branch_code varchar(3),
            ADD COLUMN IF NOT EXISTS transfer_branch_name_kana varchar(15),
            ADD COLUMN IF NOT EXISTS transfer_deposit_type deposit_type DEFAULT 'ordinary',
            ADD COLUMN IF NOT EXISTS transfer_account_number varchar(7)`,
    ],
  ];

  if (!APPLY) {
    console.log("(dry-run) --apply で以下を実行します:");
    for (const [label] of steps) console.log(`  - ${label}`);
    console.log(
      "\n※ 口座情報そのものは投入しません。移行後に会計画面から1件ずつ登録してください。",
    );
    process.exit(0);
  }

  for (const [label, statement] of steps) {
    await db.execute(statement);
    console.log(`✔ ${label}`);
  }

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
