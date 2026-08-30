# SEO News X

SEO関連ニュースを自動収集し、AI社員4人体制でツイート案を生成、Webアプリ上で選択して **指定日時にX（旧Twitter）へ自動投稿** するアプリ。

完全仕様は [SPEC.md](./SPEC.md) を参照。

## クイックスタート

```bash
# 1. 依存をインストール
npm install

# 2. 環境変数を設定
cp .env.example .env.local
# → POSTGRES_URL / ANTHROPIC_API_KEY / X_* を埋める

# 3. DBスキーマを反映
npm run db:push

# 4. 起動
npm run dev
# → http://localhost:3000
```

## 環境変数

| 変数 | 用途 |
| --- | --- |
| `POSTGRES_URL` | Vercel Postgres / Neon の接続文字列 |
| `ANTHROPIC_API_KEY` | Claudeのキー |
| `X_CLIENT_ID` / `X_CLIENT_SECRET` | X Developer Portalで発行 |
| `X_REDIRECT_URI` | `${origin}/api/auth/x/callback` |
| `CRON_SECRET` | Vercel Cron 認可用シークレット |
| `NEXTAUTH_SECRET` / `NEXTAUTH_URL` | NextAuth |
| `GITHUB_TOKEN` | Claude Code ダッシュボード用。GitHub の読み取り専用トークン（`GH_TOKEN` でも可） |

## 手動Cronトリガ（開発時）

```bash
# ニュース取得＋ツイート案生成
curl "http://localhost:3000/api/cron/fetch-news?secret=$CRON_SECRET"

# 予約済み投稿の実行
curl "http://localhost:3000/api/cron/post-tweets?secret=$CRON_SECRET"
```

## 主要ディレクトリ

```
app/                       # Next.js App Router
  page.tsx                 # ニュース一覧
  articles/[id]/page.tsx   # 詳細＆ツイート編集
  scheduled/page.tsx       # 予約一覧
  settings/page.tsx        # 設定
  api/
    cron/                  # 取得・投稿のCron
    auth/x/                # X OAuth 2.0 (PKCE)
    tweets/                # 予約・キャンセル

lib/
  db/                      # Drizzle ORM (schema, client)
  rss/                     # RSS取得
  claude/                  # Anthropic SDK
  agents/                  # drafter (4人) + editor (編集長) + summarizer
  x/                       # OAuth + tokens + post (ツリー投稿対応)
  config/                  # personas, RSS feed list

app/claude-code/           # Claude Code ダッシュボード（概要 / ブランチ一覧）

lib/claude-code/
  github.ts                # GitHub GraphQL 取得＋5分キャッシュ
  naming.ts                # ブランチ名 → 日本語ラベル変換
  summary.ts               # 要整理判定・KPI集計

components/
  ui/                      # shadcn/ui
  claude-code/             # ダッシュボードUI
  tweet-editor.tsx         # 4案タブ＋編集＋予約UI
```

## コスト最適化（重要）

X APIの2026/4/20改定で、URL付き投稿が `$0.20`（通常投稿の約13倍）になりました。
本アプリは「ツリー投稿モード」をデフォルトON にして、本体は URL なし（$0.015）、URLはリプライ（$0.01）に分離します。
1記事あたり **$0.20 → $0.025** に圧縮。

## 筋トレコーチ（`/training`）

ベンチMAX 110→115kg（6月末）に向けて、毎日その日の状況を報告すると Claude が
パーソナルトレーナーとしてフィードバックを返し、逆算計画を都度リブラッシュアップするタブ。

- ベースプラン（プロフィール・栄養・4週ロードマップ）は [lib/training/plan.ts](./lib/training/plan.ts) に定数化。
- 報告ログ・下書きは **localStorage** に保存（ログイン・DB不要）。保存処理は [lib/training/store.ts](./lib/training/store.ts) に抽象化済みで、将来クラウドDBへ差し替え可能。
- AIフィードバックはサーバ側 API ルート [app/api/coach/route.ts](./app/api/coach/route.ts) 経由で Anthropic を呼ぶ。**APIキーはクライアントに露出しない。**
- モデルは `claude-opus-4-8`、取得失敗時は `claude-sonnet-4-6` に自動フォールバック。

### 必要な環境変数

`ANTHROPIC_API_KEY` のみ（上の環境変数テーブル参照、SEO News と共通）。

```bash
# .env.local（ローカル）
ANTHROPIC_API_KEY=sk-ant-...
```

Vercel では Settings → Environment Variables に `ANTHROPIC_API_KEY` を
Production / Preview / Development それぞれ設定すれば本番でも動作する。

## Claude Code タブ（`/claude-code`）

Claude Code で作ったリポジトリ・ブランチが増えて管理しきれない・ブランチ名が
英字だけで中身が分からない、という課題に対して **視認性を上げるためのダッシュボード**。

- ヘッダーの「Claude Code」タブから開く。データは GitHub GraphQL API から取得。
- **ブランチ名を日本語に読み替えて表示する。** 変換辞書と種別判定は
  [lib/claude-code/naming.ts](./lib/claude-code/naming.ts)。
  例：`claude/todo-accounting-improvements-0iwz13` → `[Claude生成] ToDo・会計・改善`
  （`claude/` 系ブランチ末尾の自動生成文字列は落とす。元のブランチ名も併記するので情報は失わない）
- 表示内容
  - KPI：リポジトリ数／ブランチ総数／**要整理ブランチ**（30日以上更新なし）／オープンPR／直近30日のコミット数（Claude関与率つき）
  - 直近30日のコミット推移グラフ（Claude 分とそれ以外を積み上げ表示）
  - リポジトリ別カード（ブランチ数・要整理数・オープンPR・最近動いたブランチ）
  - [`/claude-code/branches`](./app/claude-code/branches/page.tsx)：全ブランチ横断の検索・絞り込み・並び替え
- 各ブランチには最新コミットメッセージを併記する。コミットメッセージは日本語なので、
  ブランチ名だけより中身が分かりやすい。

### 必要な環境変数

`GITHUB_TOKEN`（読み取り専用の Personal Access Token）。未設定の場合はエラーにならず、
画面に設定手順が表示される。

```bash
# .env.local（ローカル）
GITHUB_TOKEN=ghp_...
```

Vercel では Settings → Environment Variables に `GITHUB_TOKEN` を設定する。
**必要な権限は repo の読み取りのみ。** 書き込み権限は付けないこと。

> GitHub API の呼びすぎを防ぐため、取得結果はサーバー側で5分間キャッシュする
> （[lib/claude-code/github.ts](./lib/claude-code/github.ts)）。

## デプロイ（Vercel）

1. このリポジトリをGitHubにpush
2. Vercelで新規プロジェクトを作成、リポジトリを接続
3. Vercel Postgres を Storage タブからアタッチ
4. 環境変数を Production / Preview / Development それぞれに設定
5. デプロイ後、Settings → Cron Jobs で `vercel.json` の設定が認識されているか確認
6. `/settings` を開き「Xアカウントを接続」を実行

> **Hobbyプランは1日1回のCronしか無料で動かない**ため、複数Cronを動かす本アプリは **Pro ($20/月)** を推奨。
