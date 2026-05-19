# Claude Code 指示書：SEOニュース集約 ＆ X自動投稿アプリ

## 0. プロジェクトの目的

現状、Claude Code（ターミナル）で以下を運用している：

- SEO関連ニュースをRSSで自動収集（直近24時間）
- AI社員4人体制で各記事に対しツイート案を4案生成
- 編集長エージェントが1案を推薦
- Chatworkに通知

この一連のフローを **Vercel上のWebアプリ** に移植し、さらに以下を追加する：

- Webアプリ上でニュースとツイート案を一覧表示
- ユーザーが選択した記事を **指定日時にXへ自動投稿**

## 1. 技術スタック

| 領域 | 採用技術 | 理由 |
| --- | --- | --- |
| フレームワーク | Next.js 15 (App Router) + TypeScript | Vercel最適、Server Actions利用可 |
| UI | Tailwind CSS + shadcn/ui | スピード優先、見た目も整う |
| DB | Vercel Postgres (Neon) | Vercelネイティブで設定楽 |
| ORM | Drizzle ORM | 軽量・型安全・Vercel Edge互換 |
| 認証 | NextAuth.js (Credentials) | 単一ユーザー想定なら最小実装 |
| AI | Anthropic Claude API（claude-sonnet-4-6） | 既存ロジックの踏襲 |
| ニュース取得 | Google News RSS + rss-parser | 現状フローと同じ |
| スケジューラ | Vercel Cron Jobs | 別途インフラ不要 |
| X連携 | X API v2 + OAuth 2.0 User Context | 自動投稿に必須 |
| デプロイ | Vercel | 要件 |

## 2. 機能要件

### 2-1. ニュース自動収集（Cron）
- 1日2回（例：07:00 / 19:00 JST）にRSSをポーリング
- 直近24時間以内の記事のみ抽出
- 重複URLは除外
- DBの `articles` テーブルに保存

### 2-2. ツイート案自動生成
- 新規取得した各記事に対し、AI社員4人体制で4案を生成
- 編集長エージェントが1案を推薦＋推薦理由を付与
- `tweet_drafts` テーブルに4案＋推薦フラグを保存

### 2-3. ニュース一覧画面（`/`）
- カード形式で記事を表示（取得日時降順）
- 各カードに：媒体名・取得日時・記事タイトル・推薦ツイート案の冒頭・元記事リンク
- クリックで詳細画面へ

### 2-4. 記事詳細＆ツイート編集画面（`/articles/[id]`）
- 4案をタブ切替で表示（推薦案にバッジ）
- 各案の推薦理由を表示
- テキストエリアで自由編集可
- 文字数リアルタイム表示
- ハッシュタグ編集可
- 「予約投稿」「即時投稿」ボタン

### 2-5. 投稿予約
- 日時ピッカー（分単位）
- 「いますぐ投稿」もしくは「予約」を選択
- `scheduled_posts` テーブルに登録

### 2-6. 予約一覧画面（`/scheduled`）
- 予約済み投稿の一覧
- ステータス（待機中／成功／失敗）
- キャンセル・編集可

### 2-7. 投稿実行（Cron）
- Vercel Cronで5分おきに `scheduled_posts` をチェック
- 投稿時刻を過ぎた `pending` レコードをX APIへPOST
- 成功時：`posted`、失敗時：`failed` + エラーメッセージを保存

### 2-8. 設定画面（`/settings`）
- ツイート生成プロンプト編集（4人分 + 編集長分）
- 監視RSSフィードのURL編集
- ハッシュタグのデフォルト値
- X API認証情報（環境変数で管理する場合は不要）

## 3. データモデル（Drizzle スキーマ）

```ts
// articles テーブル
{
  id: uuid (PK),
  source: text,           // 媒体名（例：ツギノジダイ）
  title: text,
  url: text (unique),
  summary: text,          // 記事概要（Claudeで要約）
  fetched_at: timestamp,
  published_at: timestamp,
}

// tweet_drafts テーブル
{
  id: uuid (PK),
  article_id: uuid (FK),
  persona: text,          // 経営者視点 / マーケター視点 など
  body: text,             // ツイート本文
  hashtags: text,         // "#SEO #経営"
  char_count: int,
  is_recommended: boolean,
  recommend_reason: text, // 編集長の推薦理由
  created_at: timestamp,
}

// scheduled_posts テーブル
{
  id: uuid (PK),
  draft_id: uuid (FK),
  body_final: text,       // 編集後の最終本文
  scheduled_at: timestamp,
  status: enum('pending', 'posted', 'failed', 'canceled'),
  posted_tweet_id: text,  // 投稿成功時のX側ID
  error_message: text,
  created_at: timestamp,
  updated_at: timestamp,
}

// settings テーブル（key-value）
{
  key: text (PK),
  value: jsonb,
}
```

## 4. ツイート生成プロンプト（重要）

現状のスクリーンショットから抽出した **ツイート文構造** とAI社員4人体制を明文化する。

### 4-1. ツイートのフォーマット

```
[絵文字] [フックタイトル：問いかけ or 断定的なインパクト]

[2〜3文で記事内容を要約]

◆ポイント
・[具体ポイント1]
・[具体ポイント2]
・[具体ポイント3]

[締めの一文：経営判断・行動喚起の視点]

▼[記事URL]

#SEO #[文脈ハッシュタグ]
```

### 4-2. AI社員4人のペルソナ（編集可能なテンプレ）

| 社員 | 視点 | 想定読者 | 口調 |
| --- | --- | --- | --- |
| 経営者視点 | 売上・採用・競争優位への直結 | 中小企業経営者 | 断定的・行動喚起型 |
| マーケター視点 | 戦略・施策・効果検証 | マーケティング担当者 | データ重視・実務的 |
| 実務者視点 | 具体的なTipsと運用ハック | SEO担当・Web担当 | カジュアル・実践的 |
| 大局視点 | 業界トレンド・未来予測 | 経営企画・コンサル | 俯瞰的・洞察的 |

※プロンプトは `settings` テーブルでGUI編集可能にする。

### 4-3. 編集長エージェントの選定基準

スクリーンショットの推薦理由から以下を抽出：

1. **フックの強さ**：冒頭でスクロールを止められるか
2. **専門性との合致**：投稿者（宇田氏）の専門領域と合うか
3. **読者像の明確さ**：中小企業経営者など想定読者に刺さるか
4. **行動喚起**：断定的な口調で行動を促しているか
5. **文字数の適切さ**：350〜420字程度を目安

### 4-4. 生成プロンプトのテンプレ（実装例）

```ts
const generateTweetPrompt = (article, persona) => `
あなたは「${persona.name}」の視点でXのツイート文を作成するライターです。

【記事情報】
媒体: ${article.source}
タイトル: ${article.title}
要約: ${article.summary}
URL: ${article.url}

【投稿者プロフィール】
宇田晃平（StockSun・SEO/WEBマーケ専門家）

【ペルソナ】
${persona.description}
想定読者: ${persona.targetAudience}
口調: ${persona.tone}

【厳守フォーマット】
[絵文字1つ][フックタイトル]

[2-3文で記事の要約]

◆ポイント
・[ポイント1]
・[ポイント2]
・[ポイント3]

[締めの一文]

▼${article.url}

#SEO #[文脈ハッシュタグ1つ]

【制約】
- 全体で350〜420字
- ハッシュタグは2つまで
- 断定調で行動喚起を含めること

出力はツイート本文のみ。前置きや説明は不要。
`;

const editorChiefPrompt = (drafts, article) => `
あなたは編集長です。以下4案のツイートから最も優れた1案を選び、
推薦理由を100字以内で述べてください。

【選定基準】
1. フックの強さ（冒頭で読者の手を止められるか）
2. 投稿者の専門性と合致しているか
3. 想定読者像が明確で刺さるか
4. 断定的な口調で行動を促しているか
5. 文字数が350〜420字に収まっているか

【4案】
${drafts.map((d, i) => `--- 案${i+1}（${d.persona}）---\n${d.body}`).join('\n\n')}

JSON形式で出力：
{
  "selected_index": 0-3,
  "reason": "100字以内"
}
`;
```

## 5. ニュース選定条件（現状フローの踏襲）

- **対象RSS**：Google News RSSで「SEO」「AI検索」「Google検索」関連のクエリ
  - 例：`https://news.google.com/rss/search?q=SEO+OR+"AI検索"&hl=ja&gl=JP&ceid=JP:ja`
- **絞り込み**：
  - 直近24時間以内に公開
  - タイトルまたは要約に「SEO」「Google」「AI検索」「検索エンジン」のいずれかを含む
  - スパム・低品質ドメインを除外（ブラックリスト方式）
- **件数**：1回の取得で最大10件、ツイート案生成は最大6件まで（コスト管理）

## 6. X API連携（重要・コスト最適化）

### 6-1. 認証
- OAuth 2.0 User Context（PKCE）
- 必要スコープ：`tweet.read`, `tweet.write`, `users.read`, `offline.access`
- refresh tokenでアクセストークンを自動更新（実装必須）

### 6-2. コスト（2026年5月時点）

| 項目 | 単価 | 備考 |
| --- | --- | --- |
| 通常投稿 | $0.015 | 4/20改定後 |
| **URL含む投稿** | **$0.20** | **20倍に値上げ** |
| Summoned Reply（リプライ） | $0.01 | URL含んでもこの価格 |
| 読み取り（自分のデータ） | $0.001 | 大幅値下げ |
| 最低チャージ | $5 | プリペイド方式 |

### 6-3. コスト最適化パターン（強く推奨）

**メイン投稿にはURLを入れず、リプライにURLをぶら下げる「ツリー投稿」を実装する。**

```
[メイン投稿 = $0.015]
[絵文字][フック]
[本文]
◆ポイント
・...
[締め]
#SEO #経営

  └─ [リプライ = $0.01]
     詳細はこちら ▼
     [URL]
```

これで1記事の投稿コストが **$0.20 → $0.025** に下がる（約87%削減）。
アルゴリズム上もURL付き投稿よりリーチが伸びやすい副次効果あり。

### 6-4. 投稿API
- **通常投稿**：`POST /2/tweets` with `{ text }`
- **リプライ**：`POST /2/tweets` with `{ text, reply: { in_reply_to_tweet_id } }`
- 設定画面で「ツリー投稿モード」のON/OFFトグルを設ける

### 6-5. エラーハンドリング
- `402 CreditsDepleted`：クレジット不足。UIに警告表示＆通知
- `429 Rate Limit`：再試行（指数バックオフ）
- `403 Forbidden`：禁止ワード等。`failed` ステータスで保存し通知
- リトライは最大3回まで、それでも失敗したら `failed` に

## 7. ディレクトリ構成

```
/app
  /(dashboard)
    /page.tsx                  # ニュース一覧
    /articles/[id]/page.tsx    # 詳細＆ツイート編集
    /scheduled/page.tsx        # 予約一覧
    /settings/page.tsx         # 設定
  /api
    /cron
      /fetch-news/route.ts     # ニュース取得Cron
      /post-tweets/route.ts    # 投稿実行Cron
    /tweets
      /schedule/route.ts       # 予約POST
      /cancel/[id]/route.ts    # 予約取消
    /auth
      /x/route.ts              # X OAuth開始
      /x/callback/route.ts     # X OAuthコールバック
/lib
  /db                          # Drizzle定義
  /x                           # X APIクライアント
  /claude                      # Anthropic APIクライアント
  /agents                      # 4人＋編集長エージェント
  /rss                         # RSS取得
/components
  /ui                          # shadcn/ui
  /tweet-editor.tsx
  /article-card.tsx
  /schedule-picker.tsx
/drizzle                       # マイグレーション
vercel.json                    # Cron設定
```

### vercel.json（Cron設定）

```json
{
  "crons": [
    { "path": "/api/cron/fetch-news", "schedule": "0 22,10 * * *" },
    { "path": "/api/cron/post-tweets", "schedule": "*/5 * * * *" }
  ]
}
```

※ScheduleはUTC。22:00 UTC = 07:00 JST、10:00 UTC = 19:00 JST

## 8. 環境変数（`.env.local` / Vercel側）

```
# DB
POSTGRES_URL=

# Claude
ANTHROPIC_API_KEY=

# X API（OAuth 2.0用）
X_CLIENT_ID=
X_CLIENT_SECRET=
X_REDIRECT_URI=https://your-app.vercel.app/api/auth/x/callback

# 認証（NextAuth）
NEXTAUTH_SECRET=
NEXTAUTH_URL=https://your-app.vercel.app
ADMIN_EMAIL=    # 単一ユーザーログイン用
ADMIN_PASSWORD_HASH=

# Cron（Vercel Cron認証）
CRON_SECRET=
```

## 9. 実装順序（推奨）

1. **DB & 認証セットアップ**：Drizzle定義、NextAuth実装、Vercel Postgres接続
2. **ニュース取得Cron**：RSSパーサ、`articles` 保存、手動トリガでテスト
3. **AIエージェント実装**：4人＋編集長、`tweet_drafts` 保存
4. **一覧UI & 詳細UI**：shadcn/uiでざっくり
5. **X OAuth実装**：認証フロー、refresh token保存
6. **予約UI & 予約Cron**：投稿実行ロジック
7. **ツリー投稿モード**：URL分離リプライ
8. **設定画面**：プロンプト・RSS編集
9. **デプロイ & Cron動作確認**：Vercelデプロイ、実投稿テスト

## 10. 注意事項

- **X API利用は事前に最低$5チャージが必要**。新規Developerアカウントは無課金だと `402 CreditsDepleted` が返る
- **Vercel Hobbyプランは毎日1回までのCronしか無料で動かせない**。複数Cronを使うなら Pro（$20/月）必須
- OAuth Redirect URIはXのDeveloper Portalで事前登録が必要
- AnthropicのAPI使用料も発生する（1記事あたり数円程度）
- タイムゾーンはUI表示はJST、DBはUTCで統一
- 長時間Cron処理（45秒超）はEdge Functionsの制限に注意。News取得が長引く場合はQueueに切り出し
