"use client";

import { useState, useTransition } from "react";
import { createClient } from "../actions";
import { ClientForm } from "./client-form";
import type { ClientFormValues } from "./client-row";

export function NewClientPanel() {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit(values: ClientFormValues) {
    setError(null);
    start(async () => {
      try {
        await createClient(values);
        setOpen(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "登録に失敗しました");
      }
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs px-3 py-1.5 rounded bg-neutral-900 text-white hover:bg-neutral-800"
      >
        ＋ 新規追加
      </button>
    );
  }

  return (
    <div className="mb-4 bg-white border border-neutral-200 rounded-xl p-6 shadow-sm">
      <h3 className="text-sm font-semibold mb-4">新規請求先を追加</h3>
      <ClientForm
        onSubmit={submit}
        onCancel={() => {
          setOpen(false);
          setError(null);
        }}
        pending={pending}
        error={error}
      />
    </div>
  );
}
