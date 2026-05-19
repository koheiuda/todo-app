import type { NextRequest } from "next/server";

export function isAuthorizedCron(req: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;

  const header = req.headers.get("authorization");
  if (header === `Bearer ${expected}`) return true;

  const url = new URL(req.url);
  if (url.searchParams.get("secret") === expected) return true;

  return false;
}
