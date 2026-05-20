import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PRIMARY_PERSONA } from "@/lib/config/personas";
import { DEFAULT_RSS_FEEDS, INCLUDE_KEYWORDS } from "@/lib/config/rss";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-gray-800">設定</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">ツイート生成ペルソナ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="border rounded p-3 bg-gray-50">
            <div className="font-semibold text-[#1e2a4a]">
              {PRIMARY_PERSONA.name}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              対象: {PRIMARY_PERSONA.targetAudience}
            </div>
            <div className="text-xs text-gray-500">
              口調: {PRIMARY_PERSONA.tone}
            </div>
            <p className="text-xs mt-2">{PRIMARY_PERSONA.description}</p>

            <div className="mt-3">
              <p className="text-xs font-semibold text-gray-700 mb-1">
                投稿の構成
              </p>
              <ol className="list-decimal list-inside text-xs space-y-0.5 text-gray-600">
                {PRIMARY_PERSONA.structure.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            プロンプト本体は <code>lib/agents/drafter.ts</code> に格納。編集はコードで行ってください。
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">監視RSSフィード</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {DEFAULT_RSS_FEEDS.map((u) => (
            <div key={u} className="text-xs break-all bg-gray-50 p-2 rounded border">
              {u}
            </div>
          ))}
          <div className="pt-2 text-xs text-gray-500">
            <span className="font-medium">含めるキーワード：</span>
            {INCLUDE_KEYWORDS.join(" / ")}
          </div>
          <p className="text-xs text-gray-500 pt-1">
            毎朝7時（JST）にRSSをチェック → 新着があれば最大3件のツイート案を自動生成。
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">運用フロー</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-gray-700">
          <ol className="list-decimal list-inside space-y-1">
            <li>毎朝、ニュース一覧（左サイドバーの「📰 SEO News」）に最新案が並ぶ</li>
            <li>記事を開き、ツイート案を確認・編集</li>
            <li>「X.comで開いて投稿」ボタンをクリック</li>
            <li>X.com別タブで内容を最終確認し、「ポスト」を押す</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
