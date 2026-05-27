"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

const baseCls =
  "px-2 py-1.5 rounded border border-transparent bg-transparent hover:border-neutral-200 focus:border-neutral-400 focus:bg-white focus:outline-none w-full transition-colors";

export function TextCell({
  initial,
  save,
  className = "",
  placeholder,
  ariaLabel,
}: {
  initial: string;
  save: (v: string) => void;
  className?: string;
  placeholder?: string;
  ariaLabel?: string;
}) {
  const [v, setV] = useState(initial);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setV(initial);
  }, [initial, focused]);

  return (
    <input
      type="text"
      value={v}
      onChange={(e) => setV(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false);
        if (v !== initial) save(v);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape") {
          setV(initial);
          requestAnimationFrame(() => e.currentTarget.blur());
        }
      }}
      placeholder={placeholder}
      aria-label={ariaLabel}
      className={`${baseCls} text-sm ${className}`}
    />
  );
}

export function NumberCell({
  initial,
  save,
  className = "",
  placeholder,
  ariaLabel,
  allowDecimal = false,
}: {
  initial: number;
  save: (v: number) => void;
  className?: string;
  placeholder?: string;
  ariaLabel?: string;
  allowDecimal?: boolean;
}) {
  const [raw, setRaw] = useState(initial.toString());
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setRaw(initial.toString());
  }, [initial, focused]);

  const display = focused
    ? raw
    : (allowDecimal ? Number(raw || 0) : parseInt(raw || "0", 10) || 0)
        .toLocaleString("ja-JP", { maximumFractionDigits: 2 });

  return (
    <input
      type="text"
      inputMode={allowDecimal ? "decimal" : "numeric"}
      value={display}
      onChange={(e) =>
        setRaw(
          e.target.value.replace(allowDecimal ? /[^\d.\-]/g : /[^\d\-]/g, ""),
        )
      }
      onFocus={(e) => {
        setFocused(true);
        requestAnimationFrame(() => e.target.select());
      }}
      onBlur={() => {
        setFocused(false);
        const n = allowDecimal
          ? parseFloat(raw || "0") || 0
          : parseInt(raw || "0", 10) || 0;
        if (n !== initial) save(n);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape") {
          setRaw(initial.toString());
          requestAnimationFrame(() => e.currentTarget.blur());
        }
      }}
      placeholder={placeholder}
      aria-label={ariaLabel}
      className={`${baseCls} text-right tabular-nums text-sm ${className}`}
    />
  );
}

export function TextareaCell({
  initial,
  save,
  className = "",
  placeholder,
  ariaLabel,
}: {
  initial: string;
  save: (v: string) => void;
  className?: string;
  placeholder?: string;
  ariaLabel?: string;
}) {
  const [v, setV] = useState(initial);
  const [focused, setFocused] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!focused) setV(initial);
  }, [initial, focused]);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [v]);

  return (
    <textarea
      ref={ref}
      value={v}
      onChange={(e) => setV(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false);
        if (v !== initial) save(v);
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          setV(initial);
          requestAnimationFrame(() => e.currentTarget.blur());
        }
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
          e.currentTarget.blur();
        }
      }}
      rows={1}
      placeholder={placeholder}
      aria-label={ariaLabel}
      className={`${baseCls} text-sm resize-none font-sans whitespace-pre-line block ${className}`}
    />
  );
}
