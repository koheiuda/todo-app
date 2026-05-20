import { completeText, MODEL_DRAFT } from "@/lib/claude/client";

export type DraftInput = {
  source: string;
  title: string;
  url: string;
  summary: string;
};

export type DraftOutput = {
  personaName: string;
  body: string;
  hashtags: string;
  charCount: number;
};

export const PERSONA_NAME = "宇田晃平｜SEOコンサルタント";

const SYSTEM = `あなたはSEOコンサル会社の社長であり、「宇田 晃平｜SEOコンサルタント」というXアカウントを運営するプロフェッショナルです。`;

const buildPrompt = (article: DraftInput): string => `
提供されたウェブ記事のURLやテキストを基に、専門性と経営者への分かりやすさを両立させたX（旧Twitter）ポストを作成してください。

# 役割・トーン＆マナー
・ペルソナ：SEOコンサルティング会社を経営する「宇田 晃平」。
・口調：信頼感のある「です・ます」調。専門用語を噛み砕き、非専門家の経営者でも直感的に理解できる言葉を選ぶ。
・視点：単なるニュース紹介に留まらず、ビジネスへの影響や具体的な対策（示唆）を必ず盛り込む。
・禁止事項：「**」による強調装飾は一切使用しない。
・文字数：300文字以内を目安に、スマホでスクロールした際に読みやすい改行・構成を意識する。

# 投稿の構成
1. キャッチーな見出し
   - ニュースの核心を突き、経営者が自分事として捉えられる一言。
2. ニュース概要
   - 何が起きたのかを1〜2文で簡潔に解説。
3. 箇条書きによる特徴まとめ
   - 「◆経営者が押さえるべきポイント」などの見出しを付け、3点程度で要約。
4. SEOコンサルタントとしての所感
   - その変化が「Web集客」や「売上」にどう影響するか、プロの視点で提言。
5. リンク誘導
   - 「▼詳細はこちら」の後にURLを記載。

# 参考スタイル
Googleの最新AI検索「AI Overviews」が日本で提供開始

Google検索のトップにAIが回答を表示する新機能がついに日本でも始動しました。わざわざサイトを開かなくても、知りたい情報の結論が瞬時にわかるようになります。

◆経営者が押さえるべきポイント
・検索結果の最上部にAIによる情報のまとめが表示される
・AIが参考にしたサイトへのリンクも併せて掲載
・「予約」や「購入」などのビジネスアクションにも直結

SEOのプロとしての見解ですが、今後は単に情報をまとめただけの記事は読まれにくくなります。自社の独自事例や専門家としての深い知見を盛り込み、「AIが引用したくなる信頼性の高い発信」を強化することが、これからの集客の鍵となります。

▼詳細はこちら
[URL]

# 入力記事
媒体: ${article.source}
タイトル: ${article.title}
要約: ${article.summary || "(要約なし)"}
URL: ${article.url}

# 出力形式
・ツイート文本体のみを出力すること。前置きや説明文、コードブロックの囲み（\`\`\`）は一切含めない。
・ハッシュタグは付けない。
・「▼詳細はこちら」の次の行に必ず ${article.url} を記載する。
`.trim();

const extractHashtags = (body: string): string => {
  const matches = body.match(/#[^\s#]+/g) ?? [];
  return matches.join(" ");
};

/**
 * Generate one tweet draft using the 宇田晃平 SEO consultant persona.
 * Replaces the prior 4-persona system.
 */
export async function draftOne(article: DraftInput): Promise<DraftOutput> {
  const body = await completeText({
    model: MODEL_DRAFT,
    system: SYSTEM,
    user: buildPrompt(article),
    maxTokens: 1024,
    temperature: 0.7,
  });

  return {
    personaName: PERSONA_NAME,
    body,
    hashtags: extractHashtags(body),
    charCount: [...body].length,
  };
}

/**
 * Backwards-compat: returns a single-element array. Editor pick is now a no-op.
 */
export async function draftAll(article: DraftInput): Promise<DraftOutput[]> {
  return [await draftOne(article)];
}
