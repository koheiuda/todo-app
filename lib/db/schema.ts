import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  pgEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const postStatusEnum = pgEnum("post_status", [
  "pending",
  "posted",
  "failed",
  "canceled",
]);

export const articles = pgTable(
  "articles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    source: text("source").notNull(),
    title: text("title").notNull(),
    url: text("url").notNull(),
    summary: text("summary"),
    fetchedAt: timestamp("fetched_at", { withTimezone: true }).defaultNow().notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
  },
  (t) => ({
    urlUnique: uniqueIndex("articles_url_unique").on(t.url),
    fetchedAtIdx: index("articles_fetched_at_idx").on(t.fetchedAt),
  })
);

export const tweetDrafts = pgTable(
  "tweet_drafts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    articleId: uuid("article_id")
      .notNull()
      .references(() => articles.id, { onDelete: "cascade" }),
    persona: text("persona").notNull(),
    body: text("body").notNull(),
    hashtags: text("hashtags"),
    charCount: integer("char_count").notNull(),
    isRecommended: boolean("is_recommended").default(false).notNull(),
    recommendReason: text("recommend_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    articleIdx: index("tweet_drafts_article_idx").on(t.articleId),
  })
);

export const scheduledPosts = pgTable(
  "scheduled_posts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    draftId: uuid("draft_id")
      .notNull()
      .references(() => tweetDrafts.id, { onDelete: "cascade" }),
    bodyFinal: text("body_final").notNull(),
    urlAttached: text("url_attached"),
    treeMode: boolean("tree_mode").default(true).notNull(),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
    status: postStatusEnum("status").default("pending").notNull(),
    postedTweetId: text("posted_tweet_id"),
    postedReplyId: text("posted_reply_id"),
    errorMessage: text("error_message"),
    retryCount: integer("retry_count").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    statusScheduledIdx: index("scheduled_posts_status_scheduled_idx").on(
      t.status,
      t.scheduledAt
    ),
  })
);

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const xTokens = pgTable("x_tokens", {
  id: text("id").primaryKey().default("default"),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  scope: text("scope"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Article = typeof articles.$inferSelect;
export type NewArticle = typeof articles.$inferInsert;
export type TweetDraft = typeof tweetDrafts.$inferSelect;
export type NewTweetDraft = typeof tweetDrafts.$inferInsert;
export type ScheduledPost = typeof scheduledPosts.$inferSelect;
export type NewScheduledPost = typeof scheduledPosts.$inferInsert;
export type Setting = typeof settings.$inferSelect;
export type XToken = typeof xTokens.$inferSelect;
