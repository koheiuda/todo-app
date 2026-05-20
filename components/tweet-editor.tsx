"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

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
  drafts: DraftRow[];
};

export function TweetEditor({ drafts }: Props) {
  const recommendedIdx = Math.max(
    0,
    drafts.findIndex((d) => d.isRecommended)
  );

  const [active, setActive] = useState(String(recommendedIdx));
  const [bodies, setBodies] = useState<Record<string, string>>(() =>
    Object.fromEntries(drafts.map((d) => [d.id, d.body]))
  );

  const updateBody = (id: string, v: string) =>
    setBodies((prev) => ({ ...prev, [id]: v }));

  const charsOf = (s: string) => [...s].length;

  const openInX = () => {
    const draft = drafts[Number(active)];
    if (!draft) return;
    const body = bodies[draft.id];
    const url = `https://x.com/intent/post?text=${encodeURIComponent(body)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    toast.success("X.comの投稿画面を開きました", {
      description: "内容を確認して「ポスト」をクリックしてください",
    });
  };

  const copyToClipboard = async () => {
    const draft = drafts[Number(active)];
    if (!draft) return;
    try {
      await navigator.clipboard.writeText(bodies[draft.id]);
      toast.success("本文をコピーしました");
    } catch {
      toast.error("クリップボードに書き込めませんでした");
    }
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
                <div className="text-xs text-gray-500 bg-gray-100 rounded p-2">
                  <span className="font-medium">推薦理由：</span>
                  {d.recommendReason}
                </div>
              )}
              <Textarea
                value={bodies[d.id]}
                onChange={(e) => updateBody(d.id, e.target.value)}
                rows={14}
                className="font-mono text-sm"
              />
              <div className="text-xs text-gray-500">
                {charsOf(bodies[d.id])} 字
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <div className="mt-6 flex flex-col gap-3">
          <Button
            type="button"
            size="lg"
            className="bg-[#1e2a4a] hover:bg-[#2d4fd4] text-white"
            onClick={openInX}
          >
            X.comで開いて投稿
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={copyToClipboard}
          >
            本文をコピー
          </Button>
          <p className="text-xs text-gray-500">
            「X.comで開いて投稿」をクリックすると、本文がプリセットされたX投稿画面が別タブで開きます。内容を最終確認してX側で「ポスト」をクリックしてください。
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
