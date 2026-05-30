"use client";

import type { OutsourcingCost } from "@/lib/db/schema";
import { useTransition } from "react";
import { deleteOutsourcing, updateOutsourcing } from "../actions";
import { NumberCell, TextCell } from "./editable-cells";
import { DragHandle } from "./drag-handle";
import type { RowDnd } from "./use-row-dnd";

export function OutsourcingRow({
  row,
  index,
  dnd,
}: {
  row: OutsourcingCost;
  index: number;
  dnd?: RowDnd;
}) {
  const [pending, start] = useTransition();

  function remove() {
    if (!confirm(`「${row.contractorName}」を削除しますか？`)) return;
    start(async () => {
      await deleteOutsourcing(row.id);
    });
  }

  return (
    <tr
      className={`border-b border-neutral-100 last:border-b-0 hover:bg-neutral-50 ${
        dnd?.isOver ? "border-t-2 border-t-blue-500" : ""
      }`}
      draggable={dnd?.draggable ?? false}
      onDragStart={dnd?.onDragStart}
      onDragOver={dnd?.onDragOver}
      onDrop={dnd?.onDrop}
      onDragEnd={dnd?.onDragEnd}
    >
      <td className="px-1 py-2 text-center text-neutral-500 tabular-nums">
        <div className="flex items-center justify-center gap-1">
          {dnd ? <DragHandle handle={dnd.handle} /> : null}
          <span>{index + 1}</span>
        </div>
      </td>
      <td className="px-2 py-1.5 font-medium text-neutral-900">
        <TextCell
          initial={row.contractorName}
          save={(v) =>
            start(async () => {
              await updateOutsourcing(row.id, "contractorName", v);
            })
          }
          placeholder="外注先"
          ariaLabel="外注先"
        />
      </td>
      <td className="px-2 py-1.5 text-right tabular-nums">
        <NumberCell
          initial={row.amountInclTax}
          save={(v) =>
            start(async () => {
              await updateOutsourcing(row.id, "amountInclTax", v);
            })
          }
          placeholder="税込"
          ariaLabel="税込金額"
        />
      </td>
      <td className="px-2 py-1.5 text-neutral-600">
        <TextCell
          initial={row.memo ?? ""}
          save={(v) =>
            start(async () => {
              await updateOutsourcing(row.id, "memo", v);
            })
          }
          placeholder="メモ"
          ariaLabel="メモ"
        />
      </td>
      <td className="px-2 py-2 text-right">
        <button
          type="button"
          onClick={remove}
          disabled={pending}
          className="text-[13px] text-rose-600 hover:underline whitespace-nowrap"
        >
          削除
        </button>
      </td>
    </tr>
  );
}
