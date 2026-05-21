"use client";

import type { Client } from "@/lib/db/schema";
import { useState, useTransition } from "react";
import { addInvoice } from "../actions";

export function AddInvoiceRow({
  yearMonth,
  clients,
}: {
  yearMonth: string;
  clients: Client[];
}) {
  const [open, setOpen] = useState(false);
  const [clientId, setClientId] = useState("");
  const [incl, setIncl] = useState("");
  const [excl, setExcl] = useState("");
  const [memo, setMemo] = useState("");
  const [pending, start] = useTransition();

  function onInclChange(v: string) {
    setIncl(v);
    if (v) {
      setExcl(String(Math.round(parseInt(v, 10) / 1.1)));
    }
  }

  function submit() {
    if (!clientId || !incl) return;
    start(async () => {
      await addInvoice(yearMonth, {
        clientId,
        amountInclTax: parseInt(incl, 10),
        amountExclTax: excl ? parseInt(excl, 10) : undefined,
        memo: memo || null,
      });
      setClientId("");
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
        className="text-xs px-3 py-1.5 rounded bg-neutral-900 text-white hover:bg-neutral-800"
      >
        ＋ 請求先を追加
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <select
        value={clientId}
        onChange={(e) => setClientId(e.target.value)}
        aria-label="請求先"
        className="text-xs px-2 py-1.5 border border-neutral-300 rounded w-56"
      >
        <option value="">請求先を選択...</option>
        {clients.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <input
        type="number"
        value={incl}
        onChange={(e) => onInclChange(e.target.value)}
        placeholder="税込"
        className="text-xs px-2 py-1.5 border border-neutral-300 rounded w-24 tabular-nums text-right"
      />
      <input
        type="number"
        value={excl}
        onChange={(e) => setExcl(e.target.value)}
        placeholder="金額（税抜）"
        className="text-xs px-2 py-1.5 border border-neutral-300 rounded w-28 tabular-nums text-right"
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
        disabled={pending || !clientId || !incl}
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
