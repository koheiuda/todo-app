"use client";

/** 行の並び替え用ドラッグハンドル（⠿）。押下した行だけ draggable になる。 */
export function DragHandle({
  handle,
}: {
  handle: { onMouseDown: () => void; onMouseUp: () => void };
}) {
  return (
    <span
      {...handle}
      role="button"
      tabIndex={-1}
      aria-label="ドラッグして並び替え"
      title="ドラッグで並び替え"
      className="inline-flex items-center justify-center text-neutral-300 hover:text-neutral-600 cursor-grab active:cursor-grabbing select-none leading-none text-[15px]"
    >
      ⠿
    </span>
  );
}
