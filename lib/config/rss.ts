export const DEFAULT_RSS_FEEDS: string[] = [
  // Google News (Japanese) — SEO / AI search / Google search related
  'https://news.google.com/rss/search?q=SEO+OR+%22AI%E6%A4%9C%E7%B4%A2%22+OR+%22Google%E6%A4%9C%E7%B4%A2%22&hl=ja&gl=JP&ceid=JP:ja',
  'https://news.google.com/rss/search?q=%22%E6%A4%9C%E7%B4%A2%E3%82%A8%E3%83%B3%E3%82%B8%E3%83%B3%22+OR+%22%E3%82%B3%E3%82%A2%E3%82%A6%E3%82%A7%E3%83%96%E3%83%90%E3%82%A4%E3%82%BF%E3%83%AB%22&hl=ja&gl=JP&ceid=JP:ja',
];

export const INCLUDE_KEYWORDS = [
  "SEO",
  "Google",
  "AI検索",
  "検索エンジン",
  "Bing",
  "ChatGPT検索",
  "コアアップデート",
  "Search Console",
];

export const EXCLUDE_DOMAINS = [
  "example-spam.com",
];

export const FETCH_HOURS_WINDOW = 24;
export const MAX_ARTICLES_PER_RUN = 10;
// Hobby plan: max 60s per function. Each draft run = 4 Claude calls + 1 editor.
// 3 articles * 5 calls ≈ 15 calls — fits comfortably in 60s.
export const MAX_DRAFTS_PER_RUN = 3;
