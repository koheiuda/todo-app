import Parser from "rss-parser";
import {
  PRIORITY_RSS_FEEDS,
  PRIORITY_SITE_QUERIES,
  SUPPLEMENTARY_RSS_FEEDS,
  INCLUDE_KEYWORDS,
  EXCLUDE_DOMAINS,
  FETCH_HOURS_WINDOW,
  MAX_SUPPLEMENTARY_PER_RUN,
  type PriorityFeed,
} from "@/lib/config/rss";

export type RssArticle = {
  source: string;
  title: string;
  url: string;
  summary: string;
  publishedAt: Date | null;
};

const parser = new Parser({
  timeout: 15000,
  headers: { "User-Agent": "seo-news-x/1.0 (+https://todo-app-ashy-nu.vercel.app)" },
});

const stripHtml = (s: string | undefined): string =>
  (s ?? "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();

const domainOf = (url: string): string => {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
};

const isWithinWindow = (date: Date | null, hours: number): boolean => {
  if (!date) return true;
  const diff = Date.now() - date.getTime();
  return diff <= hours * 3600 * 1000;
};

const matchesKeyword = (title: string, summary: string): boolean => {
  const haystack = `${title} ${summary}`.toLowerCase();
  return INCLUDE_KEYWORDS.some((k) => haystack.includes(k.toLowerCase()));
};

async function parsePriorityFeed(feed: PriorityFeed): Promise<RssArticle[]> {
  try {
    const parsed = await parser.parseURL(feed.url);
    const items = parsed.items ?? [];
    return items
      .filter((item) => !!item.link)
      .filter((item) => !EXCLUDE_DOMAINS.some((d) => domainOf(item.link!).endsWith(d)))
      .map<RssArticle>((item) => ({
        source: feed.label,
        title: stripHtml(item.title),
        url: item.link!,
        summary: stripHtml(item.contentSnippet ?? item.content ?? ""),
        publishedAt: item.isoDate ? new Date(item.isoDate) : null,
      }));
  } catch (err) {
    console.error("[rss:priority] failed:", feed.url, err);
    return [];
  }
}

async function parseSupplementaryFeed(feedUrl: string): Promise<RssArticle[]> {
  try {
    const feed = await parser.parseURL(feedUrl);
    const feedTitle = feed.title ?? domainOf(feedUrl);
    const out: RssArticle[] = [];

    for (const item of feed.items ?? []) {
      if (!item.link) continue;
      const url = item.link;
      if (EXCLUDE_DOMAINS.some((d) => domainOf(url).endsWith(d))) continue;

      const title = stripHtml(item.title);
      const summary = stripHtml(item.contentSnippet ?? item.content ?? "");
      const publishedAt = item.isoDate ? new Date(item.isoDate) : null;

      // 補助ソースは「直近24h」かつ「SEO関連キーワード」のみ通す
      if (!isWithinWindow(publishedAt, FETCH_HOURS_WINDOW)) continue;
      if (!matchesKeyword(title, summary)) continue;

      out.push({ source: feedTitle, title, url, summary, publishedAt });
    }
    return out;
  } catch (err) {
    console.error("[rss:supplementary] failed:", feedUrl, err);
    return [];
  }
}

const dedupByUrl = (arr: RssArticle[]): RssArticle[] => {
  const map = new Map<string, RssArticle>();
  for (const a of arr) {
    if (!map.has(a.url)) map.set(a.url, a);
  }
  return Array.from(map.values());
};

const sortByPublishedDesc = (arr: RssArticle[]): RssArticle[] =>
  [...arr].sort((a, b) => {
    const ta = a.publishedAt?.getTime() ?? 0;
    const tb = b.publishedAt?.getTime() ?? 0;
    return tb - ta;
  });

export async function fetchAllFeeds(): Promise<RssArticle[]> {
  // 優先ソース：全件を並列取得（キーワードフィルタ・件数制限は適用しない）
  const priorityResults = await Promise.all([
    ...PRIORITY_RSS_FEEDS.map(parsePriorityFeed),
    ...PRIORITY_SITE_QUERIES.map(parsePriorityFeed),
  ]);
  const priorityArticles = sortByPublishedDesc(dedupByUrl(priorityResults.flat()));

  // 補助ソース：Google News 全般。キーワード・期間フィルタ後、上限で打ち切る
  const supplementaryResults = await Promise.all(
    SUPPLEMENTARY_RSS_FEEDS.map(parseSupplementaryFeed)
  );
  const supplementaryArticles = sortByPublishedDesc(
    dedupByUrl(supplementaryResults.flat())
  ).slice(0, MAX_SUPPLEMENTARY_PER_RUN);

  // 優先 → 補助 の順で結合し、URL重複を除外
  return dedupByUrl([...priorityArticles, ...supplementaryArticles]);
}
