"use client";

import type { OutsourcingCost } from "@/lib/db/schema";
import { formatYen } from "@/lib/accounting/utils";
import { useState, useTransition } from "react";
import { deleteOutsourcing, updateOutsourcing } from "../actions";

export function OutsourcingRow({
  row,
  index,
}: {
  row: OutsourcingCost;
  index: number;
}) {
  const [editingName, setEditingName] = useState(false);
  const [editingAmount, setEditingAmount] = useState(false);
  const [editingMemo, setEditingMemo] = useState(false);
  const [name, setName] = useState(row.contractorName);
  const [amount, setAmount] = useState(row.amountInclTax.toString());
  const [memo, setMemo] = useState(row.memo ?? "");
  const [pending, start] = useTransition();

  function saveName() {
    start(async () => {
      await updateOutsourcing(row.id, "contractorName", name);
      setEditingName(false);
    });
  }
  function saveAmount() {
    start(async () => {
      await updateOutsourcing(row.id, "amountInclTax", parseInt(amount, 10));
      setEditingAmount(false);
    });
  }
  function saveMemo() {
    start(async () => {
      await updateOutsourcing(row.id, "memo", memo);
      setEditingMemo(false);
    });
  }

  function remove() {
    if (!confirm(`「${row.contractorName}」を削除しますか？`)) return;
    start(async () => {
      await deleteOutsourcing(row.id);
    });
  }

  return (
    <tr className="border-b border-neutral-100 last:border-b-0 hover:bg-neutral-50">
      <td className="px-2 py-3 text-center text-neutral-500 tabular-nums">{index + 1}</td>
      <td className="px-3 py-3 font-medium text-neutral-900">
        {editingName ? (
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="text-sm px-2 py-1.5 border border-neutral-300 rounded w-full"
            autoFocus
            onBlur={saveName}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveName();
              if (e.key === "Escape") setEditingName(false);
            }}
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditingName(true)}
            className="hover:bg-neutral-100 px-2 py-1.5 rounded w-full text-left text-sm"
          >
            {row.contractorName}
          </button>
        )}
      </td>
      <td className="px-2 py-3 text-right tabular-nums">
        {editingAmount ? (
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="text-base px-2 py-1.5 border border-neutral-300 rounded w-full text-right tabular-nums"
            autoFocus
            onBlur={saveAmount}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveAmount();
              if (e.key === "Escape") setEditingAmount(false);
            }}
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditingAmount(true)}
            className="hover:bg-neutral-100 px-2 py-1.5 rounded w-full text-right text-base"
          >
            {formatYen(row.amountInclTax)}
          </button>
        )}
      </td>
      <td className="px-2 py-3 text-neutral-600">
        {editingMemo ? (
          <input
            type="text"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            className="text-sm px-2 py-1.5 border border-neutral-300 rounded w-full"
            autoFocus
            onBlur={saveMemo}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveMemo();
              if (e.key === "Escape") setEditingMemo(false);
            }}
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditingMemo(true)}
            className="text-left hover:bg-neutral-100 px-2 py-1.5 rounded w-full min-h-[2rem] text-sm"
          >
            {row.memo ?? "—"}
          </button>
        )}
      </td>
      <td className="px-2 py-3 text-right">
        <button
          type="button"
          onClick={remove}
          disabled={pending}
          className="text-sm text-rose-600 hover:underline whitespace-nowrap"
        >
          削除
        </button>
      </td>
    </tr>
  );
}
