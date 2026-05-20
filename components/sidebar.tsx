"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTodo, type TodoView } from "@/components/todo/todo-context";
import type { Workspace } from "@/lib/todo/types";

type ViewMenuItem = { id: TodoView; icon: string; label: string };
type RouteMenuItem = { href: string; icon: string; label: string; badge?: number };

const viewMenu: ViewMenuItem[] = [
  { id: "list", icon: "📅", label: "ToDo" },
  { id: "done", icon: "📈", label: "完了済み" },
];

const routeMenu: RouteMenuItem[] = [
  { href: "/news", icon: "📰", label: "SEO News" },
  { href: "/scheduled", icon: "⏰", label: "予約投稿" },
  { href: "/settings", icon: "⚙️", label: "設定" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const isTodoRoute = pathname === "/";

  const todo = useTodo();
  const {
    workspaces,
    activeWorkspace,
    activeView,
    tasks,
    setActiveWorkspace,
    setActiveView,
    addWorkspace,
    deleteWorkspace,
    renameWorkspace,
    reorderWorkspaces,
  } = todo;

  const completedCount = tasks.filter((t) => t.completed).length;

  const [contextMenu, setContextMenu] = useState<{ wsId: string; x: number; y: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [editingWsId, setEditingWsId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const dragWsId = useRef<string | null>(null);
  const [dragOverWsId, setDragOverWsId] = useState<string | null>(null);
  const [portalReady, setPortalReady] = useState(false);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    if (!contextMenu) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [contextMenu]);

  const startEdit = (ws: Workspace) => {
    setEditingWsId(ws.id);
    setEditName(ws.name);
  };

  const submitEdit = () => {
    if (!editingWsId) return;
    const ws = workspaces.find((w) => w.id === editingWsId);
    const trimmed = editName.trim();
    if (ws && trimmed && trimmed !== ws.name) {
      renameWorkspace(editingWsId, trimmed);
    }
    setEditingWsId(null);
  };

  const cancelEdit = () => setEditingWsId(null);

  const handleWsDrop = (targetId: string) => {
    const dragId = dragWsId.current;
    dragWsId.current = null;
    setDragOverWsId(null);
    if (!dragId || dragId === targetId) return;
    const dragIdx = workspaces.findIndex((w) => w.id === dragId);
    const targetIdx = workspaces.findIndex((w) => w.id === targetId);
    if (dragIdx === -1 || targetIdx === -1) return;
    const reordered = [...workspaces];
    const [moved] = reordered.splice(dragIdx, 1);
    reordered.splice(targetIdx, 0, moved);
    reorderWorkspaces(reordered);
  };

  const handleSwitchWorkspace = (id: string) => {
    setActiveWorkspace(id);
    if (!isTodoRoute) {
      router.push("/");
    }
  };

  const handleSwitchView = (v: TodoView) => {
    setActiveView(v);
    if (!isTodoRoute) router.push("/");
  };

  return (
    <aside className="hidden md:block w-56 shrink-0 space-y-4">
      {/* ─── Box 1: ToDo ─── */}
      <div className="bg-white rounded-xl shadow-sm p-3">
        <p className="px-3 pt-1 pb-2 text-xs font-semibold text-[#2d4fd4] uppercase tracking-wide">
          ToDo
        </p>

        {/* Workspaces */}
        <div className="space-y-1 mb-2">
          <p className="px-3 pt-1 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">
            カテゴリ
          </p>
          {workspaces.map((ws) => {
            const isEditing = editingWsId === ws.id;
            const isActive = isTodoRoute && activeWorkspace === ws.id;
            const isDragOver =
              dragOverWsId === ws.id && dragWsId.current !== ws.id;
            return (
              <div
                key={ws.id}
                draggable={!isEditing}
                onDragStart={(e) => {
                  dragWsId.current = ws.id;
                  e.dataTransfer.effectAllowed = "move";
                  e.dataTransfer.setData("text/plain", ws.id);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (dragWsId.current && dragWsId.current !== ws.id) {
                    setDragOverWsId(ws.id);
                  }
                }}
                onDragLeave={() => {
                  if (dragOverWsId === ws.id) setDragOverWsId(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  handleWsDrop(ws.id);
                }}
                onDragEnd={() => {
                  dragWsId.current = null;
                  setDragOverWsId(null);
                }}
                className={`rounded-lg transition-shadow ${
                  isDragOver ? "ring-2 ring-[#2d4fd4]" : ""
                }`}
              >
                {isEditing ? (
                  <input
                    autoFocus
                    aria-label="カテゴリ名"
                    placeholder="カテゴリ名"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={submitEdit}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") submitEdit();
                      if (e.key === "Escape") cancelEdit();
                    }}
                    className="w-full px-3 py-2 rounded-lg text-sm font-medium bg-white border border-[#2d4fd4] text-gray-800 outline-none"
                  />
                ) : (
                  <button
                    onClick={() => handleSwitchWorkspace(ws.id)}
                    onDoubleClick={() => startEdit(ws)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setContextMenu({ wsId: ws.id, x: e.clientX, y: e.clientY });
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-grab active:cursor-grabbing truncate ${
                      isActive
                        ? "bg-[#2d4fd4]/10 text-[#2d4fd4]"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {ws.name}
                  </button>
                )}
              </div>
            );
          })}
          <button
            onClick={addWorkspace}
            className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-50 hover:text-[#2d4fd4] transition-colors"
          >
            + 追加
          </button>
        </div>

        <div className="border-t border-gray-100 my-2" />

        {/* Todo view nav */}
        <nav className="space-y-1">
          {viewMenu.map((item) => {
            const isActive = isTodoRoute && activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSwitchView(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                  isActive
                    ? "bg-[#2d4fd4]/10 text-[#2d4fd4]"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
                {item.id === "done" && completedCount > 0 && (
                  <span className="ml-auto bg-[#22c55e] text-white text-xs px-2 py-0.5 rounded-full">
                    {completedCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

      </div>

      {/* ─── Box 2: SEO News ─── */}
      <div className="bg-white rounded-xl shadow-sm p-3">
        <p className="px-3 pt-1 pb-2 text-xs font-semibold text-[#2d4fd4] uppercase tracking-wide">
          SEO News
        </p>
        <nav className="space-y-1">
          {routeMenu.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                  isActive
                    ? "bg-[#2d4fd4]/10 text-[#2d4fd4]"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {contextMenu &&
        portalReady &&
        createPortal(
          <div
            ref={menuRef}
            style={{ position: "fixed", top: contextMenu.y, left: contextMenu.x }}
            className="bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 min-w-[140px]"
          >
            <button
              onClick={() => {
                const ws = workspaces.find((w) => w.id === contextMenu.wsId);
                if (ws) startEdit(ws);
                setContextMenu(null);
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            >
              名前変更
            </button>
            <button
              onClick={() => {
                deleteWorkspace(contextMenu.wsId);
                setContextMenu(null);
              }}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              削除
            </button>
          </div>,
          document.body
        )}
    </aside>
  );
}
