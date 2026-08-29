"use client";

import { normalizePayeeName } from "@/lib/accounting/transfer/kana";
import type { DepositType } from "@/lib/accounting/transfer/zengin";
import type { PayeeAccount } from "@/lib/db/schema";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { savePayeeAccount } from "../actions";

const DEPOSIT_LABELS: Array<{ value: DepositType; label: string }> = [
  { value: "ordinary", label: "普通" },
  { value: "checking", label: "当座" },
  { value: "savings", label: "貯蓄" },
  { value: "other", label: "その他" },
];

const EMPTY = {
  contractorName: "",
  bankCode: "",
  bankNameKana: "",
  branchCode: "",
  branchNameKana: "",
  depositType: "ordinary" as DepositType,
  accountNumber: "",
  payeeNameKana: "",
  memo: "",
};

export function PayeeForm({
  account,
  onDone,
}: {
  account?: PayeeAccount;
  onDone?: () => void;
}) {
  const [form, setForm] = useState(
    account
      ? {
          contractorName: account.contractorName,
          bankCode: account.bankCode,
          bankNameKana: account.bankNameKana,
          branchCode: account.branchCode,
          branchNameKana: account.branchNameKana,
          depositType: account.depositType as DepositType,
          accountNumber: account.accountNumber,
          payeeNameKana: account.payeeNameKana,
          memo: account.memo ?? "",
        }
      : EMPTY,
  );
  const [errors, setErrors] = useState<string[]>([]);
  const [pending, start] = useTransition();
  const router = useRouter();

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  // 保存時に正規化されるが、入力中も結果を見せて桁溢れに気づけるようにする。
  const previewName = normalizePayeeName(form.payeeNameKana);
  const nameTooLong = previewName.length > 30;

  function submit() {
    setErrors([]);
    start(async () => {
      const result = await savePayeeAccount(account?.id ?? null, {
        ...form,
        memo: form.memo || null,
      });
      if (!result.ok) {
        setErrors(result.errors);
        return;
      }
      toast.success(`「${form.contractorName}」の振込先を保存しました`);
      if (!account) setForm(EMPTY);
      onDone?.();
      router.refresh();
    });
  }

  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="block md:col-span-2">
          <span className="text-xs text-neutral-600 mb-1 block">
            外注先名（外注費の名称と一致させる）
          </span>
          <input
            type="text"
            value={form.contractorName}
            onChange={(e) => set("contractorName", e.target.value)}
            placeholder="株式会社Optimum"
            className="w-full text-[13px] px-2 py-1.5 border border-neutral-300 rounded"
          />
        </label>

        <label className="block">
          <span className="text-xs text-neutral-600 mb-1 block">
            金融機関コード（4桁）
          </span>
          <input
            type="text"
            inputMode="numeric"
            value={form.bankCode}
            onChange={(e) => set("bankCode", e.target.value.replace(/\D/g, ""))}
            maxLength={4}
            placeholder="0001"
            className="w-full text-[13px] px-2 py-1.5 border border-neutral-300 rounded tabular-nums"
          />
        </label>
        <label className="block">
          <span className="text-xs text-neutral-600 mb-1 block">
            金融機関名（カナ）
          </span>
          <input
            type="text"
            value={form.bankNameKana}
            onChange={(e) => set("bankNameKana", e.target.value)}
            placeholder="ミズホ"
            className="w-full text-[13px] px-2 py-1.5 border border-neutral-300 rounded"
          />
        </label>

        <label className="block">
          <span className="text-xs text-neutral-600 mb-1 block">
            支店コード（3桁）
          </span>
          <input
            type="text"
            inputMode="numeric"
            value={form.branchCode}
            onChange={(e) =>
              set("branchCode", e.target.value.replace(/\D/g, ""))
            }
            maxLength={3}
            placeholder="001"
            className="w-full text-[13px] px-2 py-1.5 border border-neutral-300 rounded tabular-nums"
          />
        </label>
        <label className="block">
          <span className="text-xs text-neutral-600 mb-1 block">
            支店名（カナ）
          </span>
          <input
            type="text"
            value={form.branchNameKana}
            onChange={(e) => set("branchNameKana", e.target.value)}
            placeholder="トウキョウ"
            className="w-full text-[13px] px-2 py-1.5 border border-neutral-300 rounded"
          />
        </label>

        <label className="block">
          <span className="text-xs text-neutral-600 mb-1 block">預金種目</span>
          <select
            value={form.depositType}
            onChange={(e) => set("depositType", e.target.value as DepositType)}
            className="w-full text-[13px] px-2 py-1.5 border border-neutral-300 rounded bg-white"
          >
            {DEPOSIT_LABELS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs text-neutral-600 mb-1 block">
            口座番号（7桁以内）
          </span>
          <input
            type="text"
            inputMode="numeric"
            value={form.accountNumber}
            onChange={(e) =>
              set("accountNumber", e.target.value.replace(/\D/g, ""))
            }
            maxLength={7}
            placeholder="1234567"
            className="w-full text-[13px] px-2 py-1.5 border border-neutral-300 rounded tabular-nums"
          />
        </label>

        <label className="block md:col-span-2">
          <span className="text-xs text-neutral-600 mb-1 block">
            受取人名（通帳どおりのカナ）
          </span>
          <input
            type="text"
            value={form.payeeNameKana}
            onChange={(e) => set("payeeNameKana", e.target.value)}
            placeholder="カブシキガイシャオプティマム"
            className="w-full text-[13px] px-2 py-1.5 border border-neutral-300 rounded"
          />
          {form.payeeNameKana ? (
            <span
              className={`text-[11px] mt-1 block tabular-nums ${
                nameTooLong ? "text-rose-700" : "text-neutral-500"
              }`}
            >
              全銀表記: {previewName}（{previewName.length}/30文字
              {nameTooLong ? " — 超過しています" : ""}）
            </span>
          ) : null}
        </label>

        <label className="block md:col-span-2">
          <span className="text-xs text-neutral-600 mb-1 block">メモ（任意）</span>
          <input
            type="text"
            value={form.memo}
            onChange={(e) => set("memo", e.target.value)}
            className="w-full text-[13px] px-2 py-1.5 border border-neutral-300 rounded"
          />
        </label>
      </div>

      {errors.length > 0 ? (
        <ul className="mt-3 text-xs text-rose-700 list-disc pl-4 space-y-0.5">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      ) : null}

      <div className="mt-4 flex items-center justify-end gap-2">
        {onDone ? (
          <button
            type="button"
            onClick={onDone}
            disabled={pending}
            className="text-xs px-3 py-1.5 text-neutral-600 hover:text-neutral-900"
          >
            キャンセル
          </button>
        ) : null}
        <button
          type="button"
          onClick={submit}
          disabled={pending || !form.contractorName}
          className="text-xs px-4 py-1.5 rounded bg-neutral-900 text-white hover:bg-neutral-800 disabled:bg-neutral-300"
        >
          {pending ? "保存中..." : account ? "更新" : "登録"}
        </button>
      </div>
    </div>
  );
}
