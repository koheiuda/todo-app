"use client";

import { useRef, useState } from "react";

export type RowDnd = {
  draggable: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  isOver: boolean;
  handle: { onMouseDown: () => void; onMouseUp: () => void };
};

/**
 * テーブル行を専用ハンドルでD&D並び替えするための共通フック。
 * - rowProps(id): 行 <tr> に展開（ハンドル押下時のみ draggable 化）
 * - handleProps(id): ハンドル要素に展開（mousedown でその行をドラッグ可能化）
 * - 並びが変わったら persist(orderedIds) を呼ぶ（楽観的更新）
 *
 * 親側は initial の id 集合が変わったとき key で再マウントして state をリセットする想定。
 */
export function useRowDnd<T extends { id: string }>(
  initial: T[],
  persist: (orderedIds: string[]) => void,
) {
  const [items, setItems] = useState<T[]>(initial);
  const dragId = useRef<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [enabledId, setEnabledId] = useState<string | null>(null);

  function cleanup() {
    dragId.current = null;
    setOverId(null);
    setEnabledId(null);
  }

  function rowProps(id: string) {
    return {
      draggable: enabledId === id,
      onDragStart: (e: React.DragEvent) => {
        dragId.current = id;
        e.dataTransfer.effectAllowed = "move";
      },
      onDragOver: (e: React.DragEvent) => {
        if (!dragId.current || dragId.current === id) return;
        e.preventDefault();
        setOverId(id);
      },
      onDrop: (e: React.DragEvent) => {
        e.preventDefault();
        const from = dragId.current;
        cleanup();
        if (!from || from === id) return;
        const a = [...items];
        const fromIdx = a.findIndex((x) => x.id === from);
        const toIdx = a.findIndex((x) => x.id === id);
        if (fromIdx === -1 || toIdx === -1) return;
        const [moved] = a.splice(fromIdx, 1);
        a.splice(toIdx, 0, moved);
        setItems(a);
        persist(a.map((x) => x.id));
      },
      onDragEnd: cleanup,
      isOver: overId === id && dragId.current !== id,
    };
  }

  function handleProps(id: string) {
    return {
      onMouseDown: () => setEnabledId(id),
      onMouseUp: () => setEnabledId(null),
    };
  }

  return { items, rowProps, handleProps };
}
