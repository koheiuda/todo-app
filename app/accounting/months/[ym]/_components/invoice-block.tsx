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
import { NumberCell, TextCell, TextareaCell } from "./editable-cells";

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
  const amountsLocked = firstItem !== null;

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
        className="px-1 py-2 text-right tabular-nums align-top border-r border-neutral-200 w-32"
      >
        {amountsLocked ? (
          <div className="px-2 py-1.5 text-right text-neutral-500" title="明細から自動計算">
            {formatYen(invoice.amountInclTax)}
          </div>
        ) : (
          <NumberCell
            initial={invoice.amountInclTax}
            save={(v) =>
              start(async () => {
                await updateInvoiceAmount(invoice.id, "inclTax", v);
              })
            }
            placeholder="税込"
            ariaLabel="税込金額"
          />
        )}
      </td>
      <td
        rowSpan={spanCount}
        className="px-1 py-2 text-right tabular-nums text-neutral-600 align-top border-r border-neutral-200 w-32"
      >
        {amountsLocked ? (
          <div className="px-2 py-1.5 text-right text-neutral-500" title="明細から自動計算">
            {formatYen(invoice.amountExclTax)}
          </div>
        ) : (
          <NumberCell
            initial={invoice.amountExclTax}
            save={(v) =>
              start(async () => {
                await updateInvoiceAmount(invoice.id, "exclTax", v);
              })
            }
            placeholder="税抜"
            ariaLabel="金額（税抜）"
          />
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
        className="px-1 py-2 text-sm text-neutral-600 align-top border-l border-neutral-200 w-56"
      >
        <TextareaCell
          initial={invoice.memo ?? ""}
          save={(v) =>
            start(async () => {
              await updateInvoiceMemo(invoice.id, v);
            })
          }
          placeholder="メモ"
          ariaLabel="メモ"
        />
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

  function remove() {
    start(async () => {
      await deleteLineItem(item.id);
    });
  }

  return (
    <>
      <td className="px-1 py-1 text-sm text-neutral-700 min-w-[180px]">
        <TextCell
          initial={item.description}
          save={(v) =>
            start(async () => {
              await updateLineItem(item.id, "description", v);
            })
          }
          placeholder="項目名"
          ariaLabel="項目名"
        />
      </td>
      <td className="px-1 py-1 text-right tabular-nums w-28">
        <NumberCell
          initial={item.unitPrice}
          save={(v) =>
            start(async () => {
              await updateLineItem(item.id, "unitPrice", v);
            })
          }
          placeholder="単価"
          ariaLabel="単価"
        />
      </td>
      <td className="px-1 py-1 text-right tabular-nums w-20">
        <NumberCell
          initial={Number(item.quantity)}
          save={(v) =>
            start(async () => {
              await updateLineItem(item.id, "quantity", v);
            })
          }
          placeholder="個"
          ariaLabel="個数"
          allowDecimal
        />
      </td>
      <td className="px-1 py-1 text-right tabular-nums w-28 group">
        <div className="flex items-center justify-end gap-1">
          <div className="flex-1">
            <NumberCell
              initial={item.subtotal}
              save={(v) =>
                start(async () => {
                  await updateLineItem(item.id, "subtotal", v);
                })
              }
              placeholder="合計"
              ariaLabel="合計"
            />
          </div>
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
    });
  }

  const subtotal = (parseInt(unit, 10) || 0) * (parseFloat(qty) || 0);

  return (
    <tr className="border-t border-neutral-100 bg-neutral-50/50">
      <td className="px-1 py-1 min-w-[180px]">
        <input
          type="text"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="＋ 項目を追加"
          aria-label="項目名"
          className="text-sm px-2 py-1.5 border border-transparent rounded w-full bg-transparent hover:border-neutral-200 focus:border-neutral-400 focus:bg-white focus:outline-none transition-colors"
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
        />
      </td>
      <td className="px-1 py-1 w-28">
        <input
          type="text"
          inputMode="numeric"
          value={unit}
          onChange={(e) => setUnit(e.target.value.replace(/[^\d]/g, ""))}
          aria-label="単価"
          placeholder="単価"
          className="text-sm px-2 py-1.5 border border-transparent rounded w-full text-right tabular-nums bg-transparent hover:border-neutral-200 focus:border-neutral-400 focus:bg-white focus:outline-none transition-colors"
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
        />
      </td>
      <td className="px-1 py-1 w-20">
        <input
          type="text"
          inputMode="decimal"
          value={qty}
          onChange={(e) => setQty(e.target.value.replace(/[^\d.]/g, ""))}
          aria-label="個数"
          placeholder="個"
          className="text-sm px-2 py-1.5 border border-transparent rounded w-full text-right tabular-nums bg-transparent hover:border-neutral-200 focus:border-neutral-400 focus:bg-white focus:outline-none transition-colors"
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
        />
      </td>
      <td className="px-1 py-1 w-28">
        <div className="flex items-center justify-end gap-1">
          <span className="text-sm text-neutral-400 tabular-nums px-2">
            {subtotal > 0 ? subtotal.toLocaleString("ja-JP") : ""}
          </span>
          <button
            type="button"
            onClick={submit}
            disabled={pending || !desc.trim()}
            className="text-base text-blue-700 hover:text-blue-900 disabled:text-neutral-300"
            aria-label="保存"
            title="Enter で保存"
          >
            ＋
          </button>
        </div>
      </td>
    </tr>
  );
}
