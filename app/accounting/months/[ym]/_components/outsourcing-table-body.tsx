"use client";

import type { OutsourcingCost } from "@/lib/db/schema";
import { reorderOutsourcing } from "../actions";
import { OutsourcingRow } from "./outsourcing-row";
import { useRowDnd } from "./use-row-dnd";

export function OutsourcingTableBody({
  yearMonth,
  rows,
}: {
  yearMonth: string;
  rows: OutsourcingCost[];
}) {
  const { items, rowProps, handleProps } = useRowDnd(rows, (ids) => {
    void reorderOutsourcing(yearMonth, ids);
  });

  return (
    <>
      {items.map((row, i) => {
        const { isOver, ...rest } = rowProps(row.id);
        return (
          <OutsourcingRow
            key={row.id}
            row={row}
            index={i}
            dnd={{ ...rest, isOver, handle: handleProps(row.id) }}
          />
        );
      })}
    </>
  );
}
