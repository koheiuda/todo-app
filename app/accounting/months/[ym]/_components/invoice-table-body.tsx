"use client";

import type { Client, Invoice, InvoiceLineItem } from "@/lib/db/schema";
import { reorderInvoices } from "../actions";
import { InvoiceBlock } from "./invoice-block";
import { useRowDnd } from "./use-row-dnd";

type InvoiceWithClient = Invoice & { client: Client | null };

export function InvoiceTableBody({
  yearMonth,
  invoices,
  lineItemsByInvoice,
}: {
  yearMonth: string;
  invoices: InvoiceWithClient[];
  lineItemsByInvoice: Record<string, InvoiceLineItem[]>;
}) {
  const { items, rowProps, handleProps } = useRowDnd(invoices, (ids) => {
    void reorderInvoices(yearMonth, ids);
  });

  return (
    <>
      {items.map((inv, i) => {
        const { isOver, ...rest } = rowProps(inv.id);
        return (
          <InvoiceBlock
            key={inv.id}
            invoice={inv}
            index={i}
            lineItems={lineItemsByInvoice[inv.id] ?? []}
            dnd={{ ...rest, isOver, handle: handleProps(inv.id) }}
          />
        );
      })}
    </>
  );
}
