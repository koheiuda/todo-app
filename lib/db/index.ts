import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.POSTGRES_URL;

if (!connectionString) {
  console.warn("[db] POSTGRES_URL is not set — DB calls will fail at runtime.");
}

const client = postgres(connectionString ?? "", { prepare: false });
export const db = drizzle(client, { schema });
export { schema };

// 会計モジュール（mesut-accounting 由来）互換 API。
// 元コードは `getDb()` で取得していたので、同じ呼び出し口を提供しておく。
export function getDb() {
  return db;
}
