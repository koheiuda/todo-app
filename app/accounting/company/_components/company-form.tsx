"use client";

import type { DepositType } from "@/lib/accounting/transfer/zengin";
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
  consignorCode: string | null;
  consignorNameKana: string | null;
  transferBankCode: string | null;
  transferBankNameKana: string | null;
  transferBranchCode: string | null;
  transferBranchNameKana: string | null;
  transferDepositType: DepositType;
  transferAccountNumber: string | null;
};

const DEPOSIT_OPTIONS: Array<{ value: DepositType; label: string }> = [
  { value: "ordinary", label: "普通" },
  { value: "checking", label: "当座" },
  { value: "savings", label: "貯蓄" },
  { value: "other", label: "その他" },
];

export function CompanyForm({ initial }: { initial: CompanySettings }) {
  const [values, setValues] = useState<FormValues>({
    name: initial.name,
    postalCode: initial.postalCode,
    address: initial.address,
    tel: initial.tel,
    email: initial.email,
    invoiceNumber: initial.invoiceNumber,
    bankInfo: initial.bankInfo,
    consignorCode: initial.consignorCode,
    consignorNameKana: initial.consignorNameKana,
    transferBankCode: initial.transferBankCode,
    transferBankNameKana: initial.transferBankNameKana,
    transferBranchCode: initial.transferBranchCode,
    transferBranchNameKana: initial.transferBranchNameKana,
    transferDepositType: (initial.transferDepositType ??
      "ordinary") as DepositType,
    transferAccountNumber: initial.transferAccountNumber,
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

      <div className="mt-8 pt-6 border-t border-neutral-200">
        <h2 className="text-sm font-semibold text-neutral-900">
          総合振込（振込元）
        </h2>
        <p className="text-xs text-neutral-500 mt-1 mb-4">
          外注費を一括振込するときに、全銀フォーマットのヘッダーへ入る自社情報です。
          委託者コードはGMOあおぞらネット銀行から払い出されます。
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="委託者コード（10桁）">
            <input
              type="text"
              inputMode="numeric"
              value={values.consignorCode ?? ""}
              onChange={(e) =>
                setStr("consignorCode", e.target.value.replace(/\D/g, ""))
              }
              maxLength={10}
              placeholder="1234567890"
              className="acc-input"
            />
          </Field>
          <Field label="委託者名（カナ）">
            <input
              type="text"
              value={values.consignorNameKana ?? ""}
              onChange={(e) => setStr("consignorNameKana", e.target.value)}
              placeholder="カ)メスト"
              className="acc-input"
            />
          </Field>

          <Field label="金融機関コード（4桁）">
            <input
              type="text"
              inputMode="numeric"
              value={values.transferBankCode ?? ""}
              onChange={(e) =>
                setStr("transferBankCode", e.target.value.replace(/\D/g, ""))
              }
              maxLength={4}
              placeholder="0310"
              className="acc-input"
            />
          </Field>
          <Field label="金融機関名（カナ）">
            <input
              type="text"
              value={values.transferBankNameKana ?? ""}
              onChange={(e) => setStr("transferBankNameKana", e.target.value)}
              placeholder="ジーエムオーアオゾラ"
              className="acc-input"
            />
          </Field>

          <Field label="支店コード（3桁）">
            <input
              type="text"
              inputMode="numeric"
              value={values.transferBranchCode ?? ""}
              onChange={(e) =>
                setStr("transferBranchCode", e.target.value.replace(/\D/g, ""))
              }
              maxLength={3}
              placeholder="101"
              className="acc-input"
            />
          </Field>
          <Field label="支店名（カナ）">
            <input
              type="text"
              value={values.transferBranchNameKana ?? ""}
              onChange={(e) => setStr("transferBranchNameKana", e.target.value)}
              placeholder="ホウジンエイギョウブ"
              className="acc-input"
            />
          </Field>

          <Field label="預金種目">
            <select
              value={values.transferDepositType}
              onChange={(e) =>
                set("transferDepositType", e.target.value as DepositType)
              }
              className="acc-input"
            >
              {DEPOSIT_OPTIONS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="口座番号（7桁以内）">
            <input
              type="text"
              inputMode="numeric"
              value={values.transferAccountNumber ?? ""}
              onChange={(e) =>
                setStr(
                  "transferAccountNumber",
                  e.target.value.replace(/\D/g, ""),
                )
              }
              maxLength={7}
              placeholder="2091728"
              className="acc-input"
            />
          </Field>
        </div>
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
