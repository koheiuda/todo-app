const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  draft: {
    label: "下書き",
    className: "bg-neutral-100 text-neutral-700",
  },
  sent: {
    label: "送付済み",
    className: "bg-blue-50 text-blue-700",
  },
  paid: {
    label: "入金済み",
    className: "bg-emerald-50 text-emerald-700",
  },
};

export function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? {
    label: status,
    className: "bg-neutral-100 text-neutral-700",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${s.className}`}
    >
      {s.label}
    </span>
  );
}
