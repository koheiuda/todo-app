"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { copyFromPreviousMonth } from "../actions";

export function CopyPreviousMonthButton({
  yearMonth,
  prevLabel,
}: {
  yearMonth: string;
  prevLabel: string;
}) {
  const [pending, start] = useTransition();
  const router = useRouter();

  function run() {
    if (
      !window.confirm(
        `${prevLabel}の請求先・外注費を当月へコピーします。よろしいですか？`,
      )
    ) {
      return;
    }
    start(async () => {
      const res = await copyFromPreviousMonth(yearMonth);
      if (res.ok) {
        toast.success(
          `${prevLabel}からコピーしました（請求先 ${res.invoices}件 / 外注費 ${res.outsourcing}件）`,
        );
        router.refresh();
      } else if (res.reason === "source-empty") {
        toast.error(`${prevLabel}にコピーできるデータがありません`);
      } else {
        toast.error(
          "当月に既にデータがあるためコピーできません（空のときのみ実行できます）",
        );
        router.refresh();
      }
    });
  }

  return (
    <button
      type="button"
      onClick={run}
      disabled={pending}
      className="text-sm px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:bg-neutral-300"
    >
      {pending ? "コピー中…" : `📋 ${prevLabel}の内容をコピー`}
    </button>
  );
}
