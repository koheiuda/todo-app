import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  decimal,
  date,
  boolean,
  jsonb,
  pgEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

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

// ─────────────────────────────────────────────────────────────
// 会計管理（mesut-accounting 由来）
// ─────────────────────────────────────────────────────────────

export const invoiceStatusEnum = pgEnum("invoice_status", [
  "draft",
  "sent",
  "paid",
]);

export const fiscalPeriods = pgTable("fiscal_periods", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 64 }).notNull(),
  startDate: date("start_date", { mode: "string" }).notNull(),
  endDate: date("end_date", { mode: "string" }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const monthlySummaries = pgTable(
  "monthly_summaries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    fiscalPeriodId: uuid("fiscal_period_id")
      .notNull()
      .references(() => fiscalPeriods.id, { onDelete: "cascade" }),
    yearMonth: varchar("year_month", { length: 7 }).notNull(),
    revenueInclTax: integer("revenue_incl_tax").notNull().default(0),
    totalExpense: integer("total_expense").notNull().default(0),
    grossProfit: integer("gross_profit").notNull().default(0),
    grossMarginRate: decimal("gross_margin_rate", {
      precision: 5,
      scale: 4,
    })
      .notNull()
      .default("0"),
    memo: text("memo"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("monthly_summaries_year_month_uq").on(t.yearMonth)],
);

export const clients = pgTable("clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  honorific: varchar("honorific", { length: 16 }).notNull().default("御中"),
  postalCode: varchar("postal_code", { length: 16 }),
  address: varchar("address", { length: 255 }),
  department: varchar("department", { length: 128 }),
  contactPerson: varchar("contact_person", { length: 128 }),
  contactEmail: varchar("contact_email", { length: 255 }),
  contactPhone: varchar("contact_phone", { length: 64 }),
  billingNotes: text("billing_notes"),
  defaultMemo: text("default_memo"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const invoices = pgTable("invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoiceNumber: varchar("invoice_number", { length: 32 }).notNull().unique(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "restrict" }),
  yearMonth: varchar("year_month", { length: 7 }).notNull(),
  issueDate: date("issue_date", { mode: "string" }).notNull(),
  dueDate: date("due_date", { mode: "string" }).notNull(),
  amountExclTax: integer("amount_excl_tax").notNull().default(0),
  taxAmount: integer("tax_amount").notNull().default(0),
  amountInclTax: integer("amount_incl_tax").notNull().default(0),
  status: invoiceStatusEnum("status").notNull().default("draft"),
  pdfUrl: varchar("pdf_url", { length: 512 }),
  memo: text("memo"),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const invoiceLineItems = pgTable("invoice_line_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoiceId: uuid("invoice_id")
    .notNull()
    .references(() => invoices.id, { onDelete: "cascade" }),
  description: varchar("description", { length: 255 }).notNull(),
  deliveryDate: date("delivery_date", { mode: "string" }),
  unitPrice: integer("unit_price").notNull().default(0),
  quantity: decimal("quantity", { precision: 10, scale: 2 })
    .notNull()
    .default("1"),
  subtotal: integer("subtotal").notNull().default(0),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const outsourcingCosts = pgTable("outsourcing_costs", {
  id: uuid("id").primaryKey().defaultRandom(),
  yearMonth: varchar("year_month", { length: 7 }).notNull(),
  contractorName: varchar("contractor_name", { length: 255 }).notNull(),
  amountInclTax: integer("amount_incl_tax").notNull().default(0),
  memo: text("memo"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const companySettings = pgTable("company_settings", {
  id: varchar("id", { length: 32 }).primaryKey().default("default"),
  name: varchar("name", { length: 255 }).notNull().default("株式会社Mesut"),
  postalCode: varchar("postal_code", { length: 16 }),
  address: text("address"),
  tel: varchar("tel", { length: 64 }),
  email: varchar("email", { length: 255 }),
  invoiceNumber: varchar("invoice_number", { length: 32 }),
  bankInfo: text("bank_info"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const expenses = pgTable("expenses", {
  id: uuid("id").primaryKey().defaultRandom(),
  yearMonth: varchar("year_month", { length: 7 }).notNull(),
  category: varchar("category", { length: 64 }).notNull(),
  amount: integer("amount").notNull().default(0),
  memo: text("memo"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const fiscalPeriodsRelations = relations(fiscalPeriods, ({ many }) => ({
  monthlySummaries: many(monthlySummaries),
}));

export const monthlySummariesRelations = relations(
  monthlySummaries,
  ({ one }) => ({
    fiscalPeriod: one(fiscalPeriods, {
      fields: [monthlySummaries.fiscalPeriodId],
      references: [fiscalPeriods.id],
    }),
  }),
);

export const clientsRelations = relations(clients, ({ many }) => ({
  invoices: many(invoices),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  client: one(clients, {
    fields: [invoices.clientId],
    references: [clients.id],
  }),
  lineItems: many(invoiceLineItems),
}));

export const invoiceLineItemsRelations = relations(
  invoiceLineItems,
  ({ one }) => ({
    invoice: one(invoices, {
      fields: [invoiceLineItems.invoiceId],
      references: [invoices.id],
    }),
  }),
);

export type FiscalPeriod = typeof fiscalPeriods.$inferSelect;
export type MonthlySummary = typeof monthlySummaries.$inferSelect;
export type Client = typeof clients.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
export type InvoiceLineItem = typeof invoiceLineItems.$inferSelect;
export type OutsourcingCost = typeof outsourcingCosts.$inferSelect;
export type Expense = typeof expenses.$inferSelect;
export type CompanySettings = typeof companySettings.$inferSelect;
