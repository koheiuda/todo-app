"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function RegenerateDraftButton({
  articleId,
  variant = "outline",
}: {
  articleId: string;
  variant?: "default" | "outline";
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <Button
      size="sm"
      variant={variant}
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await fetch(`/api/tweets/generate/${articleId}`, {
            method: "POST",
          });
          if (res.ok) {
            toast.success("ツイート案を生成しました");
            router.refresh();
          } else {
            const err = await res.json().catch(() => ({}));
            toast.error(`失敗: ${err.error ?? res.status}`);
          }
        })
      }
    >
      {pending ? "生成中…" : "ツイート案を生成"}
    </Button>
  );
}
