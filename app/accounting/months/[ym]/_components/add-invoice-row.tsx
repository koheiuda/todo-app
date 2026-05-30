"use client";

import type { Client } from "@/lib/db/schema";
import { useId, useState, useTransition } from "react";
import { addInvoiceByClientName } from "../actions";

export function AddInvoiceRow({
  yearMonth,
  clients,
}: {
  yearMonth: string;
  clients: Client[];
}) {
  const [open, setOpen] = useState(false);
  const [clientName, setClientName] = useState("");
  const [incl, setIncl] = useState("");
  const [excl, setExcl] = useState("");
  const [memo, setMemo] = useState("");
  const [pending, start] = useTransition();
  const listId = useId();

  function onInclChange(v: string) {
    setIncl(v);
    if (v) {
      setExcl(String(Math.round(parseInt(v, 10) / 1.1)));
    }
  }

  function submit() {
    const name = clientName.trim();
    if (!name || !incl) return;
    start(async () => {
      await addInvoiceByClientName(yearMonth, {
        clientName: name,
        amountInclTax: parseInt(incl, 10),
        amountExclTax: excl ? parseInt(excl, 10) : undefined,
        memo: memo || null,
      });
      setClientName("");
      setIncl("");
      setExcl("");
      setMemo("");
      setOpen(false);
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm px-4 py-2 rounded bg-neutral-900 text-white hover:bg-neutral-800"
      >
        ＋ 請求先を追加
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <input
        type="text"
        value={clientName}
        onChange={(e) => setClientName(e.target.value)}
        list={listId}
        aria-label="請求先名"
        placeholder="請求先名（新規もOK）"
        className="text-sm px-2 py-2 border border-neutral-300 rounded w-64"
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
        }}
      />
      <datalist id={listId}>
        {clients.map((c) => (
          <option key={c.id} value={c.name} />
        ))}
      </datalist>
      <input
        type="number"
        value={incl}
        onChange={(e) => onInclChange(e.target.value)}
        placeholder="税込"
        className="text-sm px-2 py-2 border border-neutral-300 rounded w-32 tabular-nums text-right"
      />
      <input
        type="number"
        value={excl}
        onChange={(e) => setExcl(e.target.value)}
        placeholder="金額（税抜）"
        className="text-sm px-2 py-2 border border-neutral-300 rounded w-32 tabular-nums text-right"
      />
      <input
        type="text"
        value={memo}
        onChange={(e) => setMemo(e.target.value)}
        placeholder="メモ"
        className="text-sm px-2 py-2 border border-neutral-300 rounded w-56"
      />
      <button
        type="button"
        onClick={submit}
        disabled={pending || !clientName.trim() || !incl}
        className="text-sm px-4 py-2 rounded bg-neutral-900 text-white hover:bg-neutral-800 disabled:bg-neutral-300"
      >
        {pending ? "..." : "保存"}
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        disabled={pending}
        className="text-sm px-2 py-2 text-neutral-600 hover:text-neutral-900"
      >
        キャンセル
      </button>
    </div>
  );
}
