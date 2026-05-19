import Parser from "rss-parser";
import {
  DEFAULT_RSS_FEEDS,
  INCLUDE_KEYWORDS,
  EXCLUDE_DOMAINS,
  FETCH_HOURS_WINDOW,
  MAX_ARTICLES_PER_RUN,
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
  headers: { "User-Agent": "seo-news-x/1.0 (+https://example.com)" },
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

export async function fetchAllFeeds(
  feeds: string[] = DEFAULT_RSS_FEEDS
): Promise<RssArticle[]> {
  const results: RssArticle[] = [];

  for (const feedUrl of feeds) {
    try {
      const feed = await parser.parseURL(feedUrl);
      const feedTitle = feed.title ?? domainOf(feedUrl);

      for (const item of feed.items ?? []) {
        if (!item.link) continue;

        const url = item.link;
        if (EXCLUDE_DOMAINS.some((d) => domainOf(url).endsWith(d))) continue;

        const title = stripHtml(item.title);
        const summary = stripHtml(item.contentSnippet ?? item.content ?? "");
        const publishedAt = item.isoDate ? new Date(item.isoDate) : null;

        if (!isWithinWindow(publishedAt, FETCH_HOURS_WINDOW)) continue;
        if (!matchesKeyword(title, summary)) continue;

        results.push({
          source: feedTitle,
          title,
          url,
          summary,
          publishedAt,
        });
      }
    } catch (err) {
      console.error("[rss] failed:", feedUrl, err);
    }
  }

  const dedup = new Map<string, RssArticle>();
  for (const a of results) {
    if (!dedup.has(a.url)) dedup.set(a.url, a);
  }

  return Array.from(dedup.values())
    .sort((a, b) => {
      const ta = a.publishedAt?.getTime() ?? 0;
      const tb = b.publishedAt?.getTime() ?? 0;
      return tb - ta;
    })
    .slice(0, MAX_ARTICLES_PER_RUN);
}
