"use client";

import type { CompanySettings } from "@/lib/db/schema";
import { useState, useTransition } from "react";
import { updateCompanySettings } from "../actions";

type FormValues = {
  name: string;
  postalCode: string | null;
  address: string | null;
  tel: string | null;
  email: string | null;
  invoiceNumber: string | null;
  bankInfo: string | null;
};

export function CompanyForm({ initial }: { initial: CompanySettings }) {
  const [values, setValues] = useState<FormValues>({
    name: initial.name,
    postalCode: initial.postalCode,
    address: initial.address,
    tel: initial.tel,
    email: initial.email,
    invoiceNumber: initial.invoiceNumber,
    bankInfo: initial.bankInfo,
  });
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  function set<K extends keyof FormValues>(key: K, val: FormValues[K]) {
    setValues((v) => ({ ...v, [key]: val }));
  }
  function setStr(key: keyof FormValues, val: string) {
    set(key, (val.trim() === "" ? null : val) as FormValues[typeof key]);
  }

  function submit() {
    setError(null);
    start(async () => {
      try {
        await updateCompanySettings(values);
        setSavedAt(new Date());
      } catch (e) {
        setError(e instanceof Error ? e.message : "保存に失敗しました");
      }
    });
  }

  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-6 max-w-3xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="会社名" required full>
          <input
            type="text"
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
            className="acc-input"
          />
        </Field>

        <Field label="郵便番号">
          <input
            type="text"
            value={values.postalCode ?? ""}
            onChange={(e) => setStr("postalCode", e.target.value)}
            placeholder="141-0031"
            className="acc-input"
          />
        </Field>
        <Field label="住所">
          <input
            type="text"
            value={values.address ?? ""}
            onChange={(e) => setStr("address", e.target.value)}
            placeholder="東京都品川区西五反田..."
            className="acc-input"
          />
        </Field>

        <Field label="電話番号">
          <input
            type="tel"
            value={values.tel ?? ""}
            onChange={(e) => setStr("tel", e.target.value)}
            placeholder="080-xxxx-xxxx"
            className="acc-input"
          />
        </Field>
        <Field label="メールアドレス">
          <input
            type="email"
            value={values.email ?? ""}
            onChange={(e) => setStr("email", e.target.value)}
            placeholder="info@mesut.co.jp"
            className="acc-input"
          />
        </Field>

        <Field label="インボイス登録番号" full>
          <input
            type="text"
            value={values.invoiceNumber ?? ""}
            onChange={(e) => setStr("invoiceNumber", e.target.value)}
            placeholder="T1234567890123"
            className="acc-input"
          />
          <p className="text-[11px] text-neutral-400 mt-1">
            適格請求書発行事業者の登録番号（T + 13桁）
          </p>
        </Field>

        <Field label="振込先" full>
          <textarea
            value={values.bankInfo ?? ""}
            onChange={(e) => setStr("bankInfo", e.target.value)}
            placeholder={
              "GMOあおぞらネット銀行 法人営業部 普通 2091728 カ)メスト"
            }
            rows={4}
            className="acc-input font-sans"
          />
          <p className="text-[11px] text-neutral-400 mt-1">
            PDFの「お振込先」欄にそのまま表示されます。複数行可。
          </p>
        </Field>
      </div>

      {error ? <p className="mt-4 text-xs text-rose-700">{error}</p> : null}

      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          onClick={submit}
          disabled={pending || !values.name.trim()}
          className="text-sm px-4 py-2 rounded bg-neutral-900 text-white hover:bg-neutral-800 disabled:bg-neutral-300"
        >
          {pending ? "保存中..." : "保存"}
        </button>
        {savedAt ? (
          <span className="text-xs text-emerald-700">
            ✓ 保存しました（{savedAt.toLocaleTimeString("ja-JP")}）
          </span>
        ) : null}
      </div>

      <style>{`
        .acc-input {
          padding: 0.5rem 0.75rem;
          border: 1px solid #d4d4d4;
          border-radius: 0.375rem;
          font-size: 0.875rem;
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
