"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function CancelButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <Button
      size="sm"
      variant="destructive"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await fetch(`/api/tweets/cancel/${id}`, { method: "POST" });
          if (res.ok) {
            toast.success("キャンセルしました");
            router.refresh();
          } else {
            const err = await res.json().catch(() => ({}));
            toast.error(`失敗: ${err.error ?? res.status}`);
          }
        })
      }
    >
      キャンセル
    </Button>
  );
}

export function RunNowButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <Button
      size="sm"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await fetch(`/api/tweets/run/${id}`, { method: "POST" });
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
            router.refresh();
          } else {
            const err = await res.json().catch(() => ({}));
            const hint =
              err.code === "credits_depleted"
                ? "X APIクレジットを補充してください"
                : err.error?.includes("tokens not found")
                ? "/settings から Xアカウントを接続"
                : err.error;
            toast.error("投稿失敗", { description: hint ?? `HTTP ${res.status}` });
          }
        })
      }
    >
      {pending ? "投稿中…" : "今すぐ実行"}
    </Button>
  );
}
