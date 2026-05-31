"use client";

import type { Client } from "@/lib/db/schema";
import { useState } from "react";
import type { ClientFormValues } from "./client-row";

const EMPTY: ClientFormValues = {
  name: "",
  honorific: "御中",
  postalCode: null,
  address: null,
  department: null,
  contactPerson: null,
  contactEmail: null,
  contactPhone: null,
  invoiceEmails: [],
  invoiceCcEmails: [],
  billingNotes: null,
  defaultMemo: null,
  isActive: true,
};

export function ClientForm({
  initial,
  onSubmit,
  onCancel,
  pending,
  error,
}: {
  initial?: Partial<Client>;
  onSubmit: (values: ClientFormValues) => void | Promise<void>;
  onCancel: () => void;
  pending: boolean;
  error: string | null;
}) {
  const [values, setValues] = useState<ClientFormValues>(() => ({
    ...EMPTY,
    ...(initial
      ? {
          name: initial.name ?? "",
          honorific: initial.honorific ?? "御中",
          postalCode: initial.postalCode ?? null,
          address: initial.address ?? null,
          department: initial.department ?? null,
          contactPerson: initial.contactPerson ?? null,
          contactEmail: initial.contactEmail ?? null,
          contactPhone: initial.contactPhone ?? null,
          invoiceEmails: initial.invoiceEmails ?? [],
          invoiceCcEmails: initial.invoiceCcEmails ?? [],
          billingNotes: initial.billingNotes ?? null,
          defaultMemo: initial.defaultMemo ?? null,
          isActive: initial.isActive ?? true,
        }
      : {}),
  }));

  function set<K extends keyof ClientFormValues>(
    key: K,
    val: ClientFormValues[K],
  ) {
    setValues((v) => ({ ...v, [key]: val }));
  }

  function setStr(key: keyof ClientFormValues, val: string) {
    set(key, (val.trim() === "" ? null : val) as ClientFormValues[typeof key]);
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="請求先名" required>
          <input
            type="text"
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
            className="acc-input"
            autoFocus
          />
        </Field>
        <Field label="敬称">
          <input
            type="text"
            value={values.honorific}
            onChange={(e) => set("honorific", e.target.value)}
            placeholder="御中"
            className="acc-input w-24"
          />
        </Field>

        <Field label="部署">
          <input
            type="text"
            value={values.department ?? ""}
            onChange={(e) => setStr("department", e.target.value)}
            placeholder="経理部"
            className="acc-input"
          />
        </Field>
        <Field label="担当者">
          <input
            type="text"
            value={values.contactPerson ?? ""}
            onChange={(e) => setStr("contactPerson", e.target.value)}
            placeholder="山田 太郎"
            className="acc-input"
          />
        </Field>

        <Field label="メールアドレス（送付先）">
          <input
            type="email"
            value={values.contactEmail ?? ""}
            onChange={(e) => setStr("contactEmail", e.target.value)}
            placeholder="taro@example.com"
            className="acc-input"
          />
        </Field>
        <Field label="電話番号">
          <input
            type="tel"
            value={values.contactPhone ?? ""}
            onChange={(e) => setStr("contactPhone", e.target.value)}
            placeholder="03-1234-5678"
            className="acc-input"
          />
        </Field>

        <Field label="郵便番号">
          <input
            type="text"
            value={values.postalCode ?? ""}
            onChange={(e) => setStr("postalCode", e.target.value)}
            placeholder="141-0031"
            className="acc-input w-32"
          />
        </Field>
        <Field label="住所">
          <input
            type="text"
            value={values.address ?? ""}
            onChange={(e) => setStr("address", e.target.value)}
            placeholder="東京都品川区..."
            className="acc-input"
          />
        </Field>

        <Field label="請求書メール送付先 TO（1行に1件）" full>
          <textarea
            value={values.invoiceEmails.join("\n")}
            onChange={(e) =>
              set(
                "invoiceEmails",
                e.target.value
                  .split("\n")
                  .map((s) => s.trim())
                  .filter(Boolean),
              )
            }
            placeholder={"keiri@example.com\ntanto@example.com"}
            rows={2}
            className="acc-input font-sans"
          />
        </Field>
        <Field label="請求書メール CC（1行に1件）" full>
          <textarea
            value={values.invoiceCcEmails.join("\n")}
            onChange={(e) =>
              set(
                "invoiceCcEmails",
                e.target.value
                  .split("\n")
                  .map((s) => s.trim())
                  .filter(Boolean),
              )
            }
            placeholder={"cc1@example.com\ncc2@example.com"}
            rows={2}
            className="acc-input font-sans"
          />
        </Field>

        <Field label="請求書送付メモ" full>
          <textarea
            value={values.billingNotes ?? ""}
            onChange={(e) => setStr("billingNotes", e.target.value)}
            placeholder="支払いサイト、宛先指定の特記事項など"
            rows={2}
            className="acc-input font-sans"
          />
        </Field>
      </div>

      {error ? (
        <p className="mt-3 text-xs text-rose-700">{error}</p>
      ) : null}

      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={() => onSubmit(values)}
          disabled={pending || !values.name.trim()}
          className="text-xs px-3 py-1.5 rounded bg-neutral-900 text-white hover:bg-neutral-800 disabled:bg-neutral-300"
        >
          {pending ? "..." : "保存"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="text-xs px-3 py-1.5 text-neutral-600 hover:text-neutral-900"
        >
          キャンセル
        </button>
      </div>

      <style>{`
        .acc-input {
          padding: 0.375rem 0.625rem;
          border: 1px solid #d4d4d4;
          border-radius: 0.375rem;
          font-size: 0.8125rem;
          width: 100%;
          background: white;
        }
        .acc-input:focus {
          outline: none;
          border-color: #737373;
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  required,
  full,
  children,
}: {
  label: string;
  required?: boolean;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={`block ${full ? "md:col-span-2" : ""}`}>
      <span className="text-xs text-neutral-600 mb-1 block">
        {label}
        {required ? <span className="text-rose-600 ml-0.5">*</span> : null}
      </span>
      {children}
    </label>
  );
}
