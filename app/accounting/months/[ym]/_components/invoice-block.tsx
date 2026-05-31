"use client";

import type { Client, Invoice, InvoiceLineItem } from "@/lib/db/schema";
import { formatYen } from "@/lib/accounting/utils";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  addLineItem,
  deleteInvoice,
  deleteLineItem,
  restoreInvoice,
  restoreLineItem,
  toggleInvoicePaid,
  toggleInvoiceSent,
  updateInvoiceAmount,
  updateInvoiceMemo,
  updateLineItem,
} from "../actions";
import { IssuePdfButton } from "./issue-pdf-button";
import { SendEmailButton } from "./send-email-button";
import { NumberCell, TextCell, TextareaCell } from "./editable-cells";
import { DragHandle } from "./drag-handle";
import type { RowDnd } from "./use-row-dnd";

type InvoiceWithClient = Invoice & { client: Client | null };

export function InvoiceBlock({
  invoice,
  index,
  lineItems,
  dnd,
}: {
  invoice: InvoiceWithClient;
  index: number;
  lineItems: InvoiceLineItem[];
  dnd?: RowDnd;
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
        dnd={dnd}
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
  dnd,
}: {
  invoice: InvoiceWithClient;
  index: number;
  spanCount: number;
  firstItem: InvoiceLineItem | null;
  dnd?: RowDnd;
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
      const snap = await deleteInvoice(invoice.id);
      if (snap) {
        toast.success(`「${invoice.client?.name ?? "請求先"}」を削除しました`, {
          action: {
            label: "元に戻す",
            onClick: () => {
              void restoreInvoice(snap);
            },
          },
        });
      }
    });
  }

  return (
    <tr
      className={`border-t-2 ${
        dnd?.isOver ? "border-blue-500" : "border-neutral-300"
      }`}
      draggable={dnd?.draggable ?? false}
      onDragStart={dnd?.onDragStart}
      onDragOver={dnd?.onDragOver}
      onDrop={dnd?.onDrop}
      onDragEnd={dnd?.onDragEnd}
    >
      <td
        rowSpan={spanCount}
        className="px-1 py-2 text-center text-neutral-500 tabular-nums align-top border-r border-neutral-200"
      >
        <div className="flex flex-col items-center gap-0.5">
          {dnd ? <DragHandle handle={dnd.handle} /> : null}
          <span>{index + 1}</span>
        </div>
      </td>
      <td
        rowSpan={spanCount}
        className="px-3 py-2 font-medium text-neutral-900 align-top border-r border-neutral-200 whitespace-nowrap"
      >
        {invoice.client?.name ?? "—"}
      </td>
      <td
        rowSpan={spanCount}
        className="px-1 py-1.5 text-right tabular-nums align-top border-r border-neutral-200"
      >
        {amountsLocked ? (
          <div className="px-2 py-1 text-right text-neutral-500 whitespace-nowrap" title="明細から自動計算">
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
        className="px-1 py-1.5 text-right tabular-nums text-neutral-600 align-top border-r border-neutral-200"
      >
        {amountsLocked ? (
          <div className="px-2 py-1 text-right text-neutral-500 whitespace-nowrap" title="明細から自動計算">
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
        className="px-2 py-2 text-center align-top border-r border-neutral-200"
      >
        <div className="flex flex-col items-center gap-1">
          <IssuePdfButton invoice={invoice} />
          <SendEmailButton invoice={invoice} />
        </div>
      </td>
      <td
        rowSpan={spanCount}
        className="px-2 py-2 text-center align-top border-r border-neutral-200"
      >
        <input
          type="checkbox"
          checked={!!invoice.sentAt}
          onChange={toggleSent}
          disabled={pending}
          className="size-4 accent-neutral-900 cursor-pointer"
          aria-label="請求書送付"
        />
      </td>
      <td
        rowSpan={spanCount}
        className="px-2 py-2 text-center align-top border-r border-neutral-200"
      >
        <input
          type="checkbox"
          checked={!!invoice.paidAt}
          onChange={togglePaid}
          disabled={pending}
          className="size-4 accent-emerald-600 cursor-pointer"
          aria-label="振込確認"
        />
      </td>

      {firstItem ? (
        <LineItemCells item={firstItem} />
      ) : (
        <>
          <td className="px-2 py-2 text-neutral-300 text-[13px] italic">明細なし</td>
          <td className="px-2 py-2" />
          <td className="px-2 py-2" />
          <td className="px-2 py-2" />
          <td className="px-2 py-2" />
        </>
      )}

      <td
        rowSpan={spanCount}
        className="px-1 py-1.5 text-[13px] text-neutral-600 align-top border-l border-neutral-200"
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
        className="px-2 py-2 text-right align-top border-l border-neutral-200"
      >
        <button
          type="button"
          onClick={removeInvoice}
          disabled={pending}
          className="text-[13px] text-rose-600 hover:underline whitespace-nowrap"
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
      const snap = await deleteLineItem(item.id);
      if (snap) {
        toast.success("明細を削除しました", {
          action: {
            label: "元に戻す",
            onClick: () => {
              void restoreLineItem(snap);
            },
          },
        });
      }
    });
  }

  return (
    <>
      <td className="px-1 py-0.5 text-[13px] text-neutral-700">
        <TextCell
          initial={item.description}
          save={(v) =>
            start(async () => {
              await updateLineItem(item.id, "description", v);
            })
          }
          placeholder="項目名"
          ariaLabel="項目名"
          className="whitespace-nowrap"
        />
      </td>
      <td className="px-1 py-0.5 text-right tabular-nums">
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
      <td className="px-1 py-0.5 text-right tabular-nums">
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
      <td className="px-1 py-0.5 text-[13px] text-neutral-600">
        <TextCell
          initial={item.unit ?? ""}
          save={(v) =>
            start(async () => {
              await updateLineItem(item.id, "unit", v);
            })
          }
          placeholder="単位"
          ariaLabel="単位"
        />
      </td>
      <td className="px-1 py-0.5 text-right tabular-nums group">
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
            className="text-neutral-300 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity text-[15px]"
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
  const [unitPrice, setUnitPrice] = useState("");
  const [qty, setQty] = useState("1");
  const [unit, setUnit] = useState("");
  const [pending, start] = useTransition();

  function submit() {
    if (!desc.trim()) return;
    start(async () => {
      await addLineItem(invoiceId, {
        description: desc.trim(),
        unitPrice: parseInt(unitPrice, 10) || 0,
        quantity: parseFloat(qty) || 1,
        unit: unit.trim() || null,
      });
      setDesc("");
      setUnitPrice("");
      setQty("1");
      setUnit("");
    });
  }

  const subtotal = (parseInt(unitPrice, 10) || 0) * (parseFloat(qty) || 0);

  return (
    <tr className="border-t border-neutral-100 bg-neutral-50/50">
      <td className="px-1 py-0.5">
        <input
          type="text"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="＋ 項目を追加"
          aria-label="項目名"
          className="text-[13px] px-2 py-1 border border-transparent rounded w-full bg-transparent hover:border-neutral-200 focus:border-neutral-400 focus:bg-white focus:outline-none transition-colors"
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
        />
      </td>
      <td className="px-1 py-0.5">
        <input
          type="text"
          inputMode="numeric"
          value={unitPrice}
          onChange={(e) => setUnitPrice(e.target.value.replace(/[^\d]/g, ""))}
          aria-label="単価"
          placeholder="単価"
          className="text-[13px] px-2 py-1 border border-transparent rounded w-full text-right tabular-nums bg-transparent hover:border-neutral-200 focus:border-neutral-400 focus:bg-white focus:outline-none transition-colors"
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
        />
      </td>
      <td className="px-1 py-0.5">
        <input
          type="text"
          inputMode="decimal"
          value={qty}
          onChange={(e) => setQty(e.target.value.replace(/[^\d.]/g, ""))}
          aria-label="個数"
          placeholder="個"
          className="text-[13px] px-2 py-1 border border-transparent rounded w-full text-right tabular-nums bg-transparent hover:border-neutral-200 focus:border-neutral-400 focus:bg-white focus:outline-none transition-colors"
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
        />
      </td>
      <td className="px-1 py-0.5">
        <input
          type="text"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          aria-label="単位"
          placeholder="単位"
          className="text-[13px] px-2 py-1 border border-transparent rounded w-full bg-transparent hover:border-neutral-200 focus:border-neutral-400 focus:bg-white focus:outline-none transition-colors"
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
        />
      </td>
      <td className="px-1 py-0.5">
        <div className="flex items-center justify-end gap-1">
          <span className="text-[13px] text-neutral-400 tabular-nums px-2">
            {subtotal > 0 ? subtotal.toLocaleString("ja-JP") : ""}
          </span>
          <button
            type="button"
            onClick={submit}
            disabled={pending || !desc.trim()}
            className="text-[15px] text-blue-700 hover:text-blue-900 disabled:text-neutral-300"
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
