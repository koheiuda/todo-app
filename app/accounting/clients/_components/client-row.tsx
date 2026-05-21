"use client";

import type { Client } from "@/lib/db/schema";
import { useState, useTransition } from "react";
import { toggleClientActive, updateClient } from "../actions";
import { ClientForm } from "./client-form";

export type ClientFormValues = {
  name: string;
  honorific: string;
  postalCode: string | null;
  address: string | null;
  department: string | null;
  contactPerson: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  billingNotes: string | null;
  defaultMemo: string | null;
  isActive: boolean;
};

export function ClientRow({ client }: { client: Client }) {
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle() {
    start(async () => {
      await toggleClientActive(client.id, !client.isActive);
    });
  }

  async function save(values: ClientFormValues) {
    setError(null);
    return new Promise<void>((resolve) => {
      start(async () => {
        try {
          await updateClient(client.id, values);
          setEditing(false);
          resolve();
        } catch (e) {
          setError(e instanceof Error ? e.message : "保存に失敗しました");
          resolve();
        }
      });
    });
  }

  if (editing) {
    return (
      <tr className="border-b border-neutral-100 bg-neutral-50">
        <td colSpan={4} className="px-6 py-4">
          <ClientForm
            initial={client}
            onSubmit={save}
            onCancel={() => setEditing(false)}
            pending={pending}
            error={error}
          />
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-neutral-100 last:border-b-0 hover:bg-neutral-50">
      <td className="px-4 py-3">
        <div className="font-medium text-neutral-900">{client.name}</div>
        <SubInfo client={client} />
      </td>
      <td className="px-4 py-3 text-neutral-700 align-top">{client.honorific}</td>
      <td className="px-4 py-3 text-center align-top">
        {client.isActive ? (
          <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
            有効
          </span>
        ) : (
          <span className="text-xs px-2 py-0.5 rounded bg-neutral-100 text-neutral-500">
            停止中
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-right align-top">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-xs text-blue-700 hover:underline mr-3"
        >
          編集
        </button>
        <button
          type="button"
          onClick={toggle}
          disabled={pending}
          className="text-xs text-neutral-600 hover:underline"
        >
          {client.isActive ? "停止" : "再開"}
        </button>
      </td>
    </tr>
  );
}

function SubInfo({ client }: { client: Client }) {
  const parts: string[] = [];
  if (client.contactPerson) {
    parts.push(`担当: ${client.contactPerson}`);
  }
  if (client.contactEmail) parts.push(client.contactEmail);
  if (client.contactPhone) parts.push(client.contactPhone);
  if (parts.length === 0 && !client.address) return null;

  return (
    <div className="text-xs text-neutral-500 mt-0.5 space-y-0.5">
      {parts.length > 0 ? <div>{parts.join(" / ")}</div> : null}
      {client.address ? (
        <div className="truncate">
          {client.postalCode ? `〒${client.postalCode} ` : ""}
          {client.address}
        </div>
      ) : null}
    </div>
  );
}
