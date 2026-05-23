// Quick smoke test for fetchAllFeeds().
// Run: npx tsx scripts/test-fetch-feeds.ts
import { fetchAllFeeds } from "../lib/rss/fetch";

(async () => {
  const start = Date.now();
  const articles = await fetchAllFeeds();
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);

  console.log(`\n=== fetched ${articles.length} articles in ${elapsed}s ===\n`);

  const bySource = new Map<string, number>();
  for (const a of articles) {
    bySource.set(a.source, (bySource.get(a.source) ?? 0) + 1);
  }
  console.log("By source:");
  for (const [src, n] of [...bySource.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${n.toString().padStart(3)}  ${src}`);
  }

  console.log("\nTop 5 articles:");
  for (const a of articles.slice(0, 5)) {
    console.log(`- [${a.source}] ${a.title}`);
    console.log(`  ${a.url}`);
    console.log(`  ${a.publishedAt?.toISOString() ?? "(no date)"}\n`);
  }
})();
