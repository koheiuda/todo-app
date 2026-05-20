"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { Task, Workspace } from "@/lib/todo/types";
import {
  loadTasks,
  saveTasks,
  loadWorkspaces,
  saveWorkspaces,
  generateId,
} from "@/lib/todo/store";

export type TodoView = "list" | "today" | "done";

type Ctx = {
  hydrated: boolean;
  tasks: Task[];
  workspaces: Workspace[];
  activeWorkspace: string;
  activeView: TodoView;
  setTasks: (next: Task[] | ((prev: Task[]) => Task[])) => void;
  setActiveWorkspace: (id: string) => void;
  setActiveView: (v: TodoView) => void;
  addWorkspace: () => void;
  deleteWorkspace: (id: string) => void;
  renameWorkspace: (id: string, name: string) => void;
  reorderWorkspaces: (next: Workspace[]) => void;
  toggleIsToday: (id: string) => void;
};

const TodoContext = createContext<Ctx | null>(null);

export function TodoProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [tasks, setTasksState] = useState<Task[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState("personal");
  const [activeView, setActiveView] = useState<TodoView>("list");

  useEffect(() => {
    const ws = loadWorkspaces();
    setWorkspaces(ws);
    setActiveWorkspace(ws[0]?.id ?? "personal");
    setTasksState(loadTasks());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveTasks(tasks);
  }, [tasks, hydrated]);

  useEffect(() => {
    if (hydrated) saveWorkspaces(workspaces);
  }, [workspaces, hydrated]);

  const setTasks: Ctx["setTasks"] = useCallback((next) => {
    setTasksState((prev) => (typeof next === "function" ? next(prev) : next));
  }, []);

  const addWorkspace = useCallback(() => {
    const name = prompt("ワークスペース名を入力:");
    if (!name?.trim()) return;
    const ws: Workspace = { id: generateId(), name: name.trim() };
    setWorkspaces((prev) => [...prev, ws]);
    setActiveWorkspace(ws.id);
  }, []);

  const deleteWorkspace = useCallback(
    (id: string) => {
      if (!confirm("このカテゴリを削除しますか？\n（タスクは「Personal」に移動します）"))
        return;
      setWorkspaces((prev) => {
        const remaining = prev.filter((w) => w.id !== id);
        if (activeWorkspace === id) {
          setActiveWorkspace(remaining[0]?.id ?? "personal");
        }
        return remaining;
      });
      setTasksState((prev) =>
        prev.map((t) =>
          t.workspace === id ? { ...t, workspace: "personal" } : t
        )
      );
    },
    [activeWorkspace]
  );

  const renameWorkspace = useCallback((id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setWorkspaces((prev) =>
      prev.map((w) => (w.id === id ? { ...w, name: trimmed } : w))
    );
  }, []);

  const reorderWorkspaces = useCallback((next: Workspace[]) => {
    setWorkspaces(next);
  }, []);

  const toggleIsToday = useCallback((id: string) => {
    setTasksState((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isToday: !t.isToday } : t))
    );
  }, []);

  const value: Ctx = {
    hydrated,
    tasks,
    workspaces,
    activeWorkspace,
    activeView,
    setTasks,
    setActiveWorkspace,
    setActiveView,
    addWorkspace,
    deleteWorkspace,
    renameWorkspace,
    reorderWorkspaces,
    toggleIsToday,
  };

  return <TodoContext.Provider value={value}>{children}</TodoContext.Provider>;
}

export function useTodo(): Ctx {
  const ctx = useContext(TodoContext);
  if (!ctx) {
    throw new Error("useTodo must be used inside <TodoProvider>");
  }
  return ctx;
}
