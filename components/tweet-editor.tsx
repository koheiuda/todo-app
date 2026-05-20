"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { jstNowIsoForInput, jstInputToIso } from "@/lib/format";

export type DraftRow = {
  id: string;
  persona: string;
  body: string;
  hashtags: string | null;
  charCount: number;
  isRecommended: boolean;
  recommendReason: string | null;
};

type Props = {
  articleUrl: string;
  drafts: DraftRow[];
};

export function TweetEditor({ articleUrl, drafts }: Props) {
  const router = useRouter();
  const recommendedIdx = Math.max(
    0,
    drafts.findIndex((d) => d.isRecommended)
  );

  const [active, setActive] = useState(String(recommendedIdx));
  const [bodies, setBodies] = useState<Record<string, string>>(() =>
    Object.fromEntries(drafts.map((d) => [d.id, d.body]))
  );
  const [treeMode, setTreeMode] = useState(true);
  const [attachUrl, setAttachUrl] = useState(true);
  const [scheduledAt, setScheduledAt] = useState(jstNowIsoForInput());
  const [pending, startTransition] = useTransition();

  const updateBody = (id: string, v: string) =>
    setBodies((prev) => ({ ...prev, [id]: v }));

  const charsOf = (s: string) => [...s].length;

  const submit = (postNow: boolean) => {
    const draft = drafts[Number(active)];
    if (!draft) return;
    const finalBody = bodies[draft.id];

    startTransition(async () => {
      if (postNow) {
        // Immediate post — call X API directly, bypass schedule queue.
        const res = await fetch("/api/tweets/post-now", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            draftId: draft.id,
            bodyFinal: finalBody,
            treeMode,
            attachUrl,
          }),
        });

        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          toast.success("投稿しました", {
            description: data.tweetUrl ? "投稿を表示" : undefined,
            action: data.tweetUrl
              ? {
                  label: "開く",
                  onClick: () => window.open(data.tweetUrl, "_blank"),
                }
              : undefined,
          });
          router.push("/scheduled");
        } else {
          const err = await res.json().catch(() => ({}));
          const hint =
            err.code === "credits_depleted"
              ? "X APIクレジットを補充してください（Wallet $5+）"
              : err.error?.includes("tokens not found")
              ? "/settings から Xアカウントを接続してください"
              : err.error;
          toast.error(`投稿失敗`, { description: hint ?? `HTTP ${res.status}` });
        }
        return;
      }

      // Scheduled post — into the queue
      const iso = jstInputToIso(scheduledAt);
      const res = await fetch("/api/tweets/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draftId: draft.id,
          bodyFinal: finalBody,
          scheduledAt: iso,
          treeMode,
          attachUrl,
        }),
      });

      if (res.ok) {
        toast.success("予約しました");
        router.push("/scheduled");
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(`失敗: ${err.error ?? res.status}`);
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">ツイート案（宇田晃平｜SEOコンサルタント）</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={active} onValueChange={setActive}>
          <TabsList className="flex flex-wrap">
            {drafts.map((d, i) => (
              <TabsTrigger key={d.id} value={String(i)} className="text-xs">
                {d.persona}
                {d.isRecommended && (
                  <Badge variant="default" className="ml-1 text-[10px]">推薦</Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {drafts.map((d, i) => (
            <TabsContent key={d.id} value={String(i)} className="space-y-3 pt-3">
              {d.recommendReason && (
                <div className="text-xs text-zinc-500 bg-zinc-100 dark:bg-zinc-800 rounded p-2">
                  <span className="font-medium">編集長推薦理由：</span>
                  {d.recommendReason}
                </div>
              )}
              <Textarea
                value={bodies[d.id]}
                onChange={(e) => updateBody(d.id, e.target.value)}
                rows={14}
                className="font-mono text-sm"
              />
              <div className="text-xs text-zinc-500">
                {charsOf(bodies[d.id])} 字
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <div className="mt-6 border-t pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm">予約日時（JST）</Label>
            <Input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
          </div>
          <div className="space-y-2 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={treeMode}
                onChange={(e) => setTreeMode(e.target.checked)}
              />
              ツリー投稿モード（URLをリプライにぶら下げてコスト最適化）
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={attachUrl}
                onChange={(e) => setAttachUrl(e.target.checked)}
              />
              記事URLを添付（{articleUrl.slice(0, 60)}...）
            </label>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          {/* Primary: free copy-paste flow */}
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              size="lg"
              className="bg-[#1e2a4a] hover:bg-[#2d4fd4] text-white"
              onClick={() => {
                const draft = drafts[Number(active)];
                if (!draft) return;
                const body = bodies[draft.id];
                const url = `https://x.com/intent/post?text=${encodeURIComponent(body)}`;
                window.open(url, "_blank", "noopener,noreferrer");
                toast.success("X.comの投稿画面を開きました", {
                  description: "内容を確認して「ポスト」をクリックしてください",
                });
              }}
            >
              X.comで開いて投稿（無料）
            </Button>
            <p className="text-xs text-gray-500">
              本文がプリセットされたX投稿画面が別タブで開きます。内容を確認して手動で「ポスト」を押してください。
            </p>
          </div>

          {/* Secondary: paid API flow */}
          <details className="border rounded-lg p-3 bg-gray-50">
            <summary className="text-xs text-gray-600 cursor-pointer select-none">
              ⚡ X API経由の自動投稿（要$5+チャージ）
            </summary>
            <div className="mt-3 space-y-3">
              <Button
                type="button"
                disabled={pending}
                variant="outline"
                size="sm"
                onClick={() => submit(true)}
              >
                {pending ? "投稿中…" : "いますぐAPI投稿"}
              </Button>
              <div className="flex items-end gap-2">
                <Button
                  type="button"
                  disabled={pending}
                  variant="outline"
                  size="sm"
                  onClick={() => submit(false)}
                >
                  予約投稿
                </Button>
                <span className="text-xs text-gray-400">↑ 上の予約日時欄で日時指定</span>
              </div>
              <p className="text-xs text-gray-500">
                X API有料化により、API投稿は1件 $0.025〜$0.20 のクレジット消費が発生します。
                クレジット未補充だと <code className="text-[10px]">402 CreditsDepleted</code> エラー、
                権限不足だと <code className="text-[10px]">403 Forbidden</code> エラーになります。
              </p>
            </div>
          </details>
        </div>
      </CardContent>
    </Card>
  );
}
