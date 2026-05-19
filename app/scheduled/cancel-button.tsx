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
