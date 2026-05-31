// clients に invoice_emails / invoice_cc_emails（text[]）を追加する。
// 請求書メール送付の宛先（TO 複数・CC 複数）を会社ごとに保持するため。
// 非破壊（ADD COLUMN IF NOT EXISTS / DEFAULT '{}'）。
// 既存の contact_email があれば invoice_emails の初期値としてバックフィルする。
// 実行: npx tsx --env-file=.env.local scripts/migrate-add-invoice-emails.ts --apply

import { sql } from "drizzle-orm";
import { getDb } from "../lib/db";

const APPLY = process.argv.includes("--apply");

async function main() {
  const db = getDb();

  if (!APPLY) {
    console.log("(dry-run) --apply で以下を実行します:");
    console.log("  ALTER TABLE clients ADD COLUMN IF NOT EXISTS invoice_emails text[] NOT NULL DEFAULT '{}'");
    console.log("  ALTER TABLE clients ADD COLUMN IF NOT EXISTS invoice_cc_emails text[] NOT NULL DEFAULT '{}'");
    console.log("  + contact_email があれば invoice_emails にバックフィル");
    process.exit(0);
  }

  await db.execute(
    sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS invoice_emails text[] NOT NULL DEFAULT '{}'`,
  );
  await db.execute(
    sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS invoice_cc_emails text[] NOT NULL DEFAULT '{}'`,
  );
  console.log("✔ カラム追加完了");

  // 既存の contact_email を初期 TO として流用（invoice_emails が空の行のみ）
  await db.execute(sql`
    UPDATE clients
    SET invoice_emails = ARRAY[contact_email]
    WHERE contact_email IS NOT NULL
      AND contact_email <> ''
      AND (invoice_emails IS NULL OR cardinality(invoice_emails) = 0)
  `);
  console.log("✔ contact_email をバックフィル完了");

  const check = await db.execute(sql`
    SELECT name, invoice_emails, invoice_cc_emails
    FROM clients ORDER BY name LIMIT 10
  `);
  console.log("確認(先頭10件):", check);

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
