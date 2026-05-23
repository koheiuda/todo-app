export type PriorityFeed = {
  url: string;
  label: string;
};

// 優先ソース：RSSが取れるサイト。
// keyword/window フィルタを **バイパス** して必ず取り込む。
export const PRIORITY_RSS_FEEDS: PriorityFeed[] = [
  { url: "https://www.plan-b.co.jp/blog/seo/feed/", label: "PLAN-B SEOブログ" },
  { url: "https://www.seojapan.com/blog/feed/", label: "SEO Japan" },
  { url: "https://www.tsuyoshikashiwazaki.jp/feed/", label: "SEO対策研究室（柏崎剛）" },
  { url: "https://blog.hubspot.jp/marketing/rss.xml", label: "HubSpot JP マーケティング" },
  { url: "https://developers.google.com/search/blog/feed.xml?hl=ja", label: "Google Search Central Blog" },
  { url: "https://www.suzukikenichi.com/blog/feed/", label: "海外SEO情報ブログ（鈴木謙一）" },
  { url: "https://webtan.impress.co.jp/rss.xml", label: "Web担当者Forum" },
  { url: "https://ahrefs.com/blog/feed/", label: "Ahrefs Blog" },
  { url: "https://www.semrush.com/blog/feed/", label: "Semrush Blog" },
  { url: "https://searchengineland.com/feed", label: "Search Engine Land" },
];

// RSSが提供されていないサイトは Google News の site: クエリで代替取得
// （seolab → getkeywords / lany / ferret-plus / zyppy）
export const PRIORITY_SITE_QUERIES: PriorityFeed[] = [
  {
    url: "https://news.google.com/rss/search?q=site:getkeywords.jp+OR+site:seolab.jp&hl=ja&gl=JP&ceid=JP:ja",
    label: "getkeywords (旧seolab)",
  },
  {
    url: "https://news.google.com/rss/search?q=site:lany.co.jp&hl=ja&gl=JP&ceid=JP:ja",
    label: "LANY",
  },
  {
    url: "https://news.google.com/rss/search?q=site:ferret-plus.com&hl=ja&gl=JP&ceid=JP:ja",
    label: "ferret",
  },
  {
    url: "https://news.google.com/rss/search?q=site:zyppy.com&hl=en&gl=US&ceid=US:en",
    label: "Zyppy",
  },
];

// 補助ソース：Google News の SEO 関連クエリ。
// keyword フィルタ + 24h ウィンドウで絞る。
export const SUPPLEMENTARY_RSS_FEEDS: string[] = [
  'https://news.google.com/rss/search?q=SEO+OR+%22AI%E6%A4%9C%E7%B4%A2%22+OR+%22Google%E6%A4%9C%E7%B4%A2%22&hl=ja&gl=JP&ceid=JP:ja',
  'https://news.google.com/rss/search?q=%22%E6%A4%9C%E7%B4%A2%E3%82%A8%E3%83%B3%E3%82%B8%E3%83%B3%22+OR+%22%E3%82%B3%E3%82%A2%E3%82%A6%E3%82%A7%E3%83%96%E3%83%90%E3%82%A4%E3%82%BF%E3%83%AB%22&hl=ja&gl=JP&ceid=JP:ja',
];

// 後方互換：既存のインポート箇所が DEFAULT_RSS_FEEDS を使っている場合のフォールバック
export const DEFAULT_RSS_FEEDS: string[] = SUPPLEMENTARY_RSS_FEEDS;

export const INCLUDE_KEYWORDS = [
  "SEO",
  "Google",
  "AI検索",
  "検索エンジン",
  "Bing",
  "ChatGPT検索",
  "コアアップデート",
  "Search Console",
  "AEO",
  "GEO",
  "LLMO",
];

export const EXCLUDE_DOMAINS = [
  "example-spam.com",
];

export const FETCH_HOURS_WINDOW = 24;

// 補助ソース（Google News）から拾う最大件数
export const MAX_SUPPLEMENTARY_PER_RUN = 10;

// Hobby plan: max 60s per function. Each draft run = 1 Claude call per article.
// 優先ソースが増えても draft 数が爆発しないよう上限を設ける。
export const MAX_DRAFTS_PER_RUN = 6;

// 後方互換
export const MAX_ARTICLES_PER_RUN = MAX_SUPPLEMENTARY_PER_RUN;
