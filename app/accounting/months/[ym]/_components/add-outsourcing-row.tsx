"use client";

import { useState, useTransition } from "react";
import { addOutsourcing } from "../actions";

export function AddOutsourcingRow({ yearMonth }: { yearMonth: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [pending, start] = useTransition();

  function submit() {
    if (!name || !amount) return;
    start(async () => {
      await addOutsourcing(yearMonth, {
        contractorName: name,
        amountInclTax: parseInt(amount, 10),
        memo: memo || null,
      });
      setName("");
      setAmount("");
      setMemo("");
      setOpen(false);
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs px-3 py-1.5 rounded bg-neutral-900 text-white hover:bg-neutral-800"
      >
        ＋ 外注費を追加
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="外注先名"
        className="text-xs px-2 py-1.5 border border-neutral-300 rounded w-48"
      />
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="税込金額"
        className="text-xs px-2 py-1.5 border border-neutral-300 rounded w-32 tabular-nums"
      />
      <input
        type="text"
        value={memo}
        onChange={(e) => setMemo(e.target.value)}
        placeholder="メモ"
        className="text-xs px-2 py-1.5 border border-neutral-300 rounded w-48"
      />
      <button
        type="button"
        onClick={submit}
        disabled={pending || !name || !amount}
        className="text-xs px-3 py-1.5 rounded bg-neutral-900 text-white hover:bg-neutral-800 disabled:bg-neutral-300"
      >
        {pending ? "..." : "保存"}
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        disabled={pending}
        className="text-xs px-2 py-1.5 text-neutral-600 hover:text-neutral-900"
      >
        キャンセル
      </button>
    </div>
  );
}
