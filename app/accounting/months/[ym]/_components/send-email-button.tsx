"use client";

import type { Client, Invoice } from "@/lib/db/schema";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  buildSubject,
  buildBody,
  buildAttachmentName,
} from "@/lib/accounting/email/template";

type InvoiceWithClient = Invoice & { client: Client | null };

function parseEmails(text: string): string[] {
  return text
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function SendEmailButton({ invoice }: { invoice: InvoiceWithClient }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const client = invoice.client;
  const [toText, setToText] = useState("");
  const [ccText, setCcText] = useState("");

  const subject = useMemo(
    () =>
      client
        ? buildSubject(invoice.yearMonth, client.name, client.honorific)
        : "",
    [invoice.yearMonth, client],
  );
  const body = useMemo(
    () => (client ? buildBody(client.name, client.honorific) : ""),
    [client],
  );
  const filename = useMemo(
    () =>
      client ? buildAttachmentName(invoice.yearMonth, client.name) : "",
    [invoice.yearMonth, client],
  );

  // PDF未発行なら送付不可
  if (!invoice.pdfUrl) return null;

  function openDialog() {
    setError(null);
    setToText((client?.invoiceEmails ?? []).join("\n"));
    setCcText((client?.invoiceCcEmails ?? []).join("\n"));
    setOpen(true);
  }

  function send() {
    setError(null);
    const to = parseEmails(toText);
    const cc = parseEmails(ccText);
    if (to.length === 0) {
      setError("送付先（TO）を1件以上入力してください");
      return;
    }
    const bad = [...to, ...cc].find((e) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
    if (bad) {
      setError(`メールアドレスの形式が不正です: ${bad}`);
      return;
    }
    start(async () => {
      const res = await fetch(`/api/accounting/invoices/${invoice.id}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, cc }),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        setError(b.error ?? "送信に失敗しました");
        return;
      }
      setOpen(false);
      toast.success(`「${client?.name ?? ""}」へ請求書を送信しました`);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        className="text-sm text-emerald-700 hover:underline whitespace-nowrap"
        title="登録メールアドレスへ請求書PDFを送付します"
      >
        {invoice.sentAt ? "再送" : "メール送付"}
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !pending) setOpen(false);
          }}
        >
          <div className="w-full max-w-lg max-h-[90vh] overflow-auto rounded-lg bg-white p-5 shadow-xl text-left">
            <h2 className="text-base font-semibold text-neutral-900 mb-1">
              請求書をメール送付
            </h2>
            <p className="text-xs text-neutral-500 mb-4">
              送信元: 株式会社Mesut &lt;kohei.uda@mesut.co.jp&gt;
            </p>

            <label className="block mb-3">
              <span className="text-xs text-neutral-600 mb-1 block">
                宛先 TO（1行に1件）<span className="text-rose-600">*</span>
              </span>
              <textarea
                value={toText}
                onChange={(e) => setToText(e.target.value)}
                rows={2}
                placeholder="taro@example.com"
                className="acc-mail-input"
              />
            </label>

            <label className="block mb-3">
              <span className="text-xs text-neutral-600 mb-1 block">
                CC（1行に1件・任意）
              </span>
              <textarea
                value={ccText}
                onChange={(e) => setCcText(e.target.value)}
                rows={2}
                placeholder="keiri@example.com"
                className="acc-mail-input"
              />
            </label>

            <div className="mb-3">
              <span className="text-xs text-neutral-600 mb-1 block">件名</span>
              <div className="text-[13px] text-neutral-800 bg-neutral-50 border border-neutral-200 rounded px-2 py-1.5 break-all">
                {subject}
              </div>
            </div>

            <div className="mb-3">
              <span className="text-xs text-neutral-600 mb-1 block">本文</span>
              <pre className="text-[12px] text-neutral-700 bg-neutral-50 border border-neutral-200 rounded px-2 py-1.5 whitespace-pre-wrap font-sans max-h-48 overflow-auto">
                {body}
              </pre>
            </div>

            <div className="mb-4 text-xs text-neutral-600">
              添付: <span className="text-neutral-900">{filename}</span>
            </div>

            {error ? (
              <p className="text-xs text-rose-700 mb-3">{error}</p>
            ) : null}

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={pending}
                className="text-xs px-3 py-1.5 text-neutral-600 hover:text-neutral-900"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={send}
                disabled={pending}
                className="text-xs px-4 py-1.5 rounded bg-emerald-700 text-white hover:bg-emerald-800 disabled:bg-neutral-300"
              >
                {pending ? "送信中..." : "この内容で送信"}
              </button>
            </div>

            <style>{`
              .acc-mail-input {
                padding: 0.375rem 0.625rem;
                border: 1px solid #d4d4d4;
                border-radius: 0.375rem;
                font-size: 0.8125rem;
                width: 100%;
                background: white;
                font-family: inherit;
              }
              .acc-mail-input:focus {
                outline: none;
                border-color: #737373;
              }
            `}</style>
          </div>
        </div>
      ) : null}
    </>
  );
}
