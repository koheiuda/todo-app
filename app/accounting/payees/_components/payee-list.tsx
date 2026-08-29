"use client";

import type { PayeeAccount } from "@/lib/db/schema";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { deletePayeeAccount, setPayeeAccountActive } from "../actions";
import { PayeeForm } from "./payee-form";

const DEPOSIT_LABEL: Record<string, string> = {
  ordinary: "普通",
  checking: "当座",
  savings: "貯蓄",
  other: "その他",
};

function PayeeRow({ account }: { account: PayeeAccount }) {
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();

  function remove() {
    if (!confirm(`「${account.contractorName}」の振込先を削除しますか？`)) return;
    start(async () => {
      await deletePayeeAccount(account.id);
      toast.success(`「${account.contractorName}」を削除しました`);
      router.refresh();
    });
  }

  function toggleActive() {
    start(async () => {
      await setPayeeAccountActive(account.id, !account.isActive);
      router.refresh();
    });
  }

  if (editing) {
    return (
      <tr>
        <td colSpan={6} className="p-3 bg-neutral-50">
          <PayeeForm account={account} onDone={() => setEditing(false)} />
        </td>
      </tr>
    );
  }

  return (
    <tr
      className={`border-b border-neutral-100 last:border-b-0 hover:bg-neutral-50 ${
        account.isActive ? "" : "opacity-50"
      }`}
    >
      <td className="px-3 py-2 font-medium text-neutral-900">
        {account.contractorName}
        {account.isActive ? null : (
          <span className="ml-2 text-[11px] text-neutral-500">（無効）</span>
        )}
      </td>
      <td className="px-2 py-2 text-neutral-700">{account.payeeNameKana}</td>
      <td className="px-2 py-2 text-neutral-600 tabular-nums whitespace-nowrap">
        {account.bankCode} {account.bankNameKana}
      </td>
      <td className="px-2 py-2 text-neutral-600 tabular-nums whitespace-nowrap">
        {account.branchCode} {account.branchNameKana}
      </td>
      <td className="px-2 py-2 text-neutral-600 tabular-nums whitespace-nowrap">
        {DEPOSIT_LABEL[account.depositType] ?? account.depositType}{" "}
        {account.accountNumber}
      </td>
      <td className="px-2 py-2 text-right whitespace-nowrap">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-xs text-blue-700 hover:underline"
        >
          編集
        </button>
        <button
          type="button"
          onClick={toggleActive}
          disabled={pending}
          className="ml-2 text-xs text-neutral-600 hover:underline"
        >
          {account.isActive ? "無効化" : "有効化"}
        </button>
        <button
          type="button"
          onClick={remove}
          disabled={pending}
          className="ml-2 text-xs text-rose-600 hover:underline"
        >
          削除
        </button>
      </td>
    </tr>
  );
}

export function PayeeList({ accounts }: { accounts: PayeeAccount[] }) {
  const [adding, setAdding] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[13px] font-semibold text-neutral-700">
          登録済みの振込先（{accounts.length}件）
        </h2>
        {adding ? null : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="text-sm px-4 py-2 rounded bg-neutral-900 text-white hover:bg-neutral-800"
          >
            ＋ 振込先を追加
          </button>
        )}
      </div>

      {adding ? (
        <div className="mb-4">
          <PayeeForm onDone={() => setAdding(false)} />
        </div>
      ) : null}

      <div className="bg-white rounded-xl border border-neutral-200 overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              <th className="text-left px-3 py-2 font-medium text-neutral-600 min-w-[160px]">
                外注先
              </th>
              <th className="text-left px-2 py-2 font-medium text-neutral-600 min-w-[160px]">
                受取人名（カナ）
              </th>
              <th className="text-left px-2 py-2 font-medium text-neutral-600">
                金融機関
              </th>
              <th className="text-left px-2 py-2 font-medium text-neutral-600">
                支店
              </th>
              <th className="text-left px-2 py-2 font-medium text-neutral-600">
                口座
              </th>
              <th className="text-right px-2 py-2 font-medium text-neutral-600 w-[140px]">
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            {accounts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-neutral-400">
                  振込先がまだ登録されていません
                </td>
              </tr>
            ) : (
              accounts.map((a) => <PayeeRow key={a.id} account={a} />)
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
