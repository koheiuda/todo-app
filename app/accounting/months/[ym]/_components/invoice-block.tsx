"use client";

import type { Client, Invoice, InvoiceLineItem } from "@/lib/db/schema";
import { formatYen } from "@/lib/accounting/utils";
import { useState, useTransition } from "react";
import {
  addLineItem,
  deleteInvoice,
  deleteLineItem,
  toggleInvoicePaid,
  toggleInvoiceSent,
  updateInvoiceAmount,
  updateInvoiceMemo,
  updateLineItem,
} from "../actions";
import { IssuePdfButton } from "./issue-pdf-button";

type InvoiceWithClient = Invoice & { client: Client | null };

export function InvoiceBlock({
  invoice,
  index,
  lineItems,
}: {
  invoice: InvoiceWithClient;
  index: number;
  lineItems: InvoiceLineItem[];
}) {
  const hasItems = lineItems.length > 0;
  const totalRows = (hasItems ? lineItems.length : 1) + 1;

  return (
    <>
      <InvoiceFirstRow
        invoice={invoice}
        index={index}
        spanCount={totalRows}
        firstItem={lineItems[0] ?? null}
      />
      {lineItems.slice(1).map((item) => (
        <LineItemOnlyRow key={item.id} item={item} />
      ))}
      <AddLineItemRow invoiceId={invoice.id} />
    </>
  );
}

function InvoiceFirstRow({
  invoice,
  index,
  spanCount,
  firstItem,
}: {
  invoice: InvoiceWithClient;
  index: number;
  spanCount: number;
  firstItem: InvoiceLineItem | null;
}) {
  const [pending, start] = useTransition();
  const [editingIncl, setEditingIncl] = useState(false);
  const [editingExcl, setEditingExcl] = useState(false);
  const [editingMemo, setEditingMemo] = useState(false);
  const [incl, setIncl] = useState(invoice.amountInclTax.toString());
  const [excl, setExcl] = useState(invoice.amountExclTax.toString());
  const [memo, setMemo] = useState(invoice.memo ?? "");

  const hasItems = firstItem !== null;
  const amountsLocked = hasItems;

  function saveIncl() {
    start(async () => {
      await updateInvoiceAmount(invoice.id, "inclTax", parseInt(incl, 10) || 0);
      setEditingIncl(false);
    });
  }
  function saveExcl() {
    start(async () => {
      await updateInvoiceAmount(invoice.id, "exclTax", parseInt(excl, 10) || 0);
      setEditingExcl(false);
    });
  }
  function saveMemo() {
    start(async () => {
      await updateInvoiceMemo(invoice.id, memo);
      setEditingMemo(false);
    });
  }
  function toggleSent() {
    start(async () => {
      await toggleInvoiceSent(invoice.id, !invoice.sentAt);
    });
  }
  function togglePaid() {
    start(async () => {
      await toggleInvoicePaid(invoice.id, !invoice.paidAt);
    });
  }
  function removeInvoice() {
    if (!confirm(`「${invoice.client?.name ?? ""}」を削除しますか？`)) return;
    start(async () => {
      await deleteInvoice(invoice.id);
    });
  }

  return (
    <tr className="border-t-2 border-neutral-300">
      <td
        rowSpan={spanCount}
        className="px-2 py-3 text-center text-neutral-500 tabular-nums align-top border-r border-neutral-200"
      >
        {index + 1}
      </td>
      <td
        rowSpan={spanCount}
        className="px-3 py-3 font-medium text-neutral-900 align-top border-r border-neutral-200 min-w-[200px]"
      >
        {invoice.client?.name ?? "—"}
      </td>
      <td
        rowSpan={spanCount}
        className="px-2 py-3 text-right tabular-nums align-top border-r border-neutral-200 w-32"
      >
        {editingIncl && !amountsLocked ? (
          <input
            type="number"
            value={incl}
            onChange={(e) => setIncl(e.target.value)}
            className="text-base px-2 py-1.5 border border-neutral-300 rounded w-full text-right tabular-nums"
            autoFocus
            aria-label="税込金額"
            placeholder="税込"
            onBlur={saveIncl}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveIncl();
              if (e.key === "Escape") setEditingIncl(false);
            }}
          />
        ) : (
          <button
            type="button"
            onClick={() => !amountsLocked && setEditingIncl(true)}
            disabled={amountsLocked}
            title={amountsLocked ? "明細から自動計算" : "クリックで編集"}
            className={`px-2 py-1.5 rounded w-full text-right text-base ${
              amountsLocked
                ? "text-neutral-500 cursor-not-allowed"
                : "hover:bg-neutral-100"
            }`}
          >
            {formatYen(invoice.amountInclTax)}
          </button>
        )}
      </td>
      <td
        rowSpan={spanCount}
        className="px-2 py-3 text-right tabular-nums text-neutral-600 align-top border-r border-neutral-200 w-32"
      >
        {editingExcl && !amountsLocked ? (
          <input
            type="number"
            value={excl}
            onChange={(e) => setExcl(e.target.value)}
            className="text-base px-2 py-1.5 border border-neutral-300 rounded w-full text-right tabular-nums"
            autoFocus
            aria-label="金額（税抜）"
            placeholder="税抜"
            onBlur={saveExcl}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveExcl();
              if (e.key === "Escape") setEditingExcl(false);
            }}
          />
        ) : (
          <button
            type="button"
            onClick={() => !amountsLocked && setEditingExcl(true)}
            disabled={amountsLocked}
            title={amountsLocked ? "明細から自動計算" : "クリックで編集"}
            className={`px-2 py-1.5 rounded w-full text-right text-base ${
              amountsLocked
                ? "text-neutral-500 cursor-not-allowed"
                : "hover:bg-neutral-100"
            }`}
          >
            {formatYen(invoice.amountExclTax)}
          </button>
        )}
      </td>
      <td
        rowSpan={spanCount}
        className="px-2 py-3 text-center align-top border-r border-neutral-200 w-44"
      >
        <IssuePdfButton invoice={invoice} />
      </td>
      <td
        rowSpan={spanCount}
        className="px-2 py-3 text-center align-top border-r border-neutral-200 w-16"
      >
        <input
          type="checkbox"
          checked={!!invoice.sentAt}
          onChange={toggleSent}
          disabled={pending}
          className="size-5 accent-neutral-900 cursor-pointer"
          aria-label="請求書送付"
        />
      </td>
      <td
        rowSpan={spanCount}
        className="px-2 py-3 text-center align-top border-r border-neutral-200 w-16"
      >
        <input
          type="checkbox"
          checked={!!invoice.paidAt}
          onChange={togglePaid}
          disabled={pending}
          className="size-5 accent-emerald-600 cursor-pointer"
          aria-label="振込確認"
        />
      </td>

      {firstItem ? (
        <LineItemCells item={firstItem} />
      ) : (
        <>
          <td className="px-2 py-3 text-neutral-300 text-sm italic">明細なし</td>
          <td className="px-2 py-3" />
          <td className="px-2 py-3" />
          <td className="px-2 py-3" />
        </>
      )}

      <td
        rowSpan={spanCount}
        className="px-2 py-3 text-sm text-neutral-600 align-top border-l border-neutral-200 w-56"
      >
        {editingMemo ? (
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            className="text-sm px-2 py-1.5 border border-neutral-300 rounded w-full font-sans"
            rows={Math.max(2, memo.split("\n").length)}
            autoFocus
            aria-label="メモ"
            placeholder="メモ"
            onBlur={saveMemo}
            onKeyDown={(e) => {
              if (e.key === "Escape") setEditingMemo(false);
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) saveMemo();
            }}
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditingMemo(true)}
            className="text-left hover:bg-neutral-100 px-2 py-1.5 rounded w-full min-h-[2rem] whitespace-pre-line block"
          >
            {invoice.memo ?? "—"}
          </button>
        )}
      </td>
      <td
        rowSpan={spanCount}
        className="px-2 py-3 text-right align-top border-l border-neutral-200 w-20"
      >
        <button
          type="button"
          onClick={removeInvoice}
          disabled={pending}
          className="text-sm text-rose-600 hover:underline whitespace-nowrap"
        >
          削除
        </button>
      </td>
    </tr>
  );
}

function LineItemOnlyRow({ item }: { item: InvoiceLineItem }) {
  return (
    <tr className="border-t border-neutral-100">
      <LineItemCells item={item} />
    </tr>
  );
}

function LineItemCells({ item }: { item: InvoiceLineItem }) {
  const [pending, start] = useTransition();
  const [editingDesc, setEditingDesc] = useState(false);
  const [editingUnit, setEditingUnit] = useState(false);
  const [editingQty, setEditingQty] = useState(false);
  const [editingSub, setEditingSub] = useState(false);
  const [desc, setDesc] = useState(item.description);
  const [unit, setUnit] = useState(item.unitPrice.toString());
  const [qty, setQty] = useState(item.quantity);
  const [sub, setSub] = useState(item.subtotal.toString());

  function saveDesc() {
    start(async () => {
      await updateLineItem(item.id, "description", desc);
      setEditingDesc(false);
    });
  }
  function saveUnit() {
    start(async () => {
      await updateLineItem(item.id, "unitPrice", parseInt(unit, 10) || 0);
      setEditingUnit(false);
    });
  }
  function saveQty() {
    start(async () => {
      await updateLineItem(item.id, "quantity", parseFloat(qty) || 0);
      setEditingQty(false);
    });
  }
  function saveSub() {
    start(async () => {
      await updateLineItem(item.id, "subtotal", parseInt(sub, 10) || 0);
      setEditingSub(false);
    });
  }
  function remove() {
    start(async () => {
      await deleteLineItem(item.id);
    });
  }

  return (
    <>
      <td className="px-2 py-2 text-sm text-neutral-700 min-w-[180px]">
        {editingDesc ? (
          <input
            type="text"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            className="text-sm px-2 py-1.5 border border-neutral-300 rounded w-full"
            aria-label="項目名"
            placeholder="項目名"
            autoFocus
            onBlur={saveDesc}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveDesc();
              if (e.key === "Escape") setEditingDesc(false);
            }}
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditingDesc(true)}
            className="text-left hover:bg-neutral-100 px-2 py-1.5 rounded w-full"
          >
            {item.description}
          </button>
        )}
      </td>
      <td className="px-2 py-2 text-right tabular-nums w-28">
        {editingUnit ? (
          <input
            type="number"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="text-sm px-2 py-1.5 border border-neutral-300 rounded w-full text-right tabular-nums"
            aria-label="単価"
            placeholder="単価"
            autoFocus
            onBlur={saveUnit}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveUnit();
              if (e.key === "Escape") setEditingUnit(false);
            }}
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditingUnit(true)}
            className="px-2 py-1.5 rounded w-full text-right hover:bg-neutral-100 text-sm"
          >
            {item.unitPrice.toLocaleString("ja-JP")}
          </button>
        )}
      </td>
      <td className="px-2 py-2 text-right tabular-nums w-20">
        {editingQty ? (
          <input
            type="number"
            step="0.01"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            className="text-sm px-2 py-1.5 border border-neutral-300 rounded w-full text-right tabular-nums"
            aria-label="個数"
            placeholder="個数"
            autoFocus
            onBlur={saveQty}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveQty();
              if (e.key === "Escape") setEditingQty(false);
            }}
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditingQty(true)}
            className="px-2 py-1.5 rounded w-full text-right hover:bg-neutral-100 text-sm"
          >
            {Number(item.quantity).toLocaleString("ja-JP", {
              maximumFractionDigits: 2,
            })}
          </button>
        )}
      </td>
      <td className="px-2 py-2 text-right tabular-nums w-28 group">
        <div className="flex items-center justify-end gap-1">
          {editingSub ? (
            <input
              type="number"
              value={sub}
              onChange={(e) => setSub(e.target.value)}
              className="text-sm px-2 py-1.5 border border-neutral-300 rounded w-full text-right tabular-nums"
              aria-label="合計"
              placeholder="合計"
              autoFocus
              onBlur={saveSub}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveSub();
                if (e.key === "Escape") setEditingSub(false);
              }}
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditingSub(true)}
              className="px-2 py-1.5 rounded text-right hover:bg-neutral-100 flex-1 text-sm"
            >
              {item.subtotal.toLocaleString("ja-JP")}
            </button>
          )}
          <button
            type="button"
            onClick={remove}
            disabled={pending}
            aria-label="明細削除"
            title="明細削除"
            className="text-neutral-300 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity text-base"
          >
            ×
          </button>
        </div>
      </td>
    </>
  );
}

function AddLineItemRow({ invoiceId }: { invoiceId: string }) {
  const [open, setOpen] = useState(false);
  const [desc, setDesc] = useState("");
  const [unit, setUnit] = useState("");
  const [qty, setQty] = useState("1");
  const [pending, start] = useTransition();

  function submit() {
    if (!desc.trim()) return;
    start(async () => {
      await addLineItem(invoiceId, {
        description: desc.trim(),
        unitPrice: parseInt(unit, 10) || 0,
        quantity: parseFloat(qty) || 1,
      });
      setDesc("");
      setUnit("");
      setQty("1");
      setOpen(false);
    });
  }

  if (!open) {
    return (
      <tr className="border-t border-neutral-100">
        <td
          colSpan={4}
          className="px-2 py-1.5 bg-neutral-50/50"
        >
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="text-sm text-neutral-500 hover:text-neutral-900"
          >
            ＋ 項目を追加
          </button>
        </td>
      </tr>
    );
  }

  const subtotal =
    (parseInt(unit, 10) || 0) * (parseFloat(qty) || 0);

  return (
    <tr className="border-t border-neutral-100 bg-neutral-50">
      <td className="px-2 py-2 min-w-[180px]">
        <input
          type="text"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="項目"
          aria-label="項目名"
          autoFocus
          className="text-sm px-2 py-1.5 border border-neutral-300 rounded w-full bg-white"
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
            if (e.key === "Escape") setOpen(false);
          }}
        />
      </td>
      <td className="px-2 py-2 w-28">
        <input
          type="number"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          aria-label="単価"
          placeholder="単価"
          className="text-sm px-2 py-1.5 border border-neutral-300 rounded w-full text-right tabular-nums bg-white"
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
            if (e.key === "Escape") setOpen(false);
          }}
        />
      </td>
      <td className="px-2 py-2 w-20">
        <input
          type="number"
          step="0.01"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          aria-label="個数"
          placeholder="1"
          className="text-sm px-2 py-1.5 border border-neutral-300 rounded w-full text-right tabular-nums bg-white"
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
            if (e.key === "Escape") setOpen(false);
          }}
        />
      </td>
      <td className="px-2 py-2 w-28">
        <div className="flex items-center justify-end gap-1">
          <span className="text-sm text-neutral-500 tabular-nums">
            {subtotal.toLocaleString("ja-JP")}
          </span>
          <button
            type="button"
            onClick={submit}
            disabled={pending || !desc.trim()}
            className="text-base text-blue-700 hover:text-blue-900 disabled:text-neutral-300"
            aria-label="保存"
            title="保存"
          >
            ✓
          </button>
        </div>
      </td>
    </tr>
  );
}
