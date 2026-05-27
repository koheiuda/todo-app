"use client";

import type { Client, Invoice } from "@/lib/db/schema";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type InvoiceWithClient = Invoice & { client: Client | null };

export function IssuePdfButton({ invoice }: { invoice: InvoiceWithClient }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function issue() {
    setError(null);
    start(async () => {
      const res = await fetch(`/api/accounting/invoices/${invoice.id}/issue`, {
        method: "POST",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "PDF発行に失敗しました");
        return;
      }
      router.refresh();
    });
  }

  if (invoice.pdfUrl) {
    return (
      <div className="flex items-center justify-center gap-2 whitespace-nowrap">
        <a
          href={`/api/accounting/invoices/${invoice.id}/pdf`}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-blue-700 hover:underline"
        >
          ダウンロード
        </a>
        <button
          type="button"
          onClick={issue}
          disabled={pending}
          className="text-sm text-neutral-500 hover:underline"
          title="PDFを再生成します"
        >
          再発行
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={issue}
        disabled={pending}
        className="text-sm px-3 py-1.5 rounded bg-neutral-900 text-white hover:bg-neutral-800 disabled:bg-neutral-300 whitespace-nowrap"
      >
        {pending ? "発行中..." : "発行"}
      </button>
      {error ? (
        <p className="text-sm text-rose-700 mt-1">{error}</p>
      ) : null}
    </div>
  );
}
