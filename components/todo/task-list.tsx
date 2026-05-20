"use client";

import { useState, useRef } from "react";
import type { Task, Workspace } from "@/lib/todo/types";
import { TaskItem } from "./task-item";
import { generateId } from "@/lib/todo/store";

interface TaskListProps {
  tasks: Task[];
  workspaces: Workspace[];
  activeWorkspace: string;
  activeView: string;
  onTasksChange: (tasks: Task[]) => void;
  onToggleIsToday: (id: string) => void;
}

export function TaskList({
  tasks,
  workspaces,
  activeWorkspace,
  activeView,
  onTasksChange,
  onToggleIsToday,
}: TaskListProps) {
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const dragItem = useRef<string | null>(null);

  const filteredTasks = tasks.filter((t) => {
    if (t.workspace !== activeWorkspace) return false;
    if (activeView === "done") return t.completed;
    if (activeView === "today") return t.isToday && !t.completed;
    return !t.completed;
  });

  const parentTasks = filteredTasks
    .filter((t) => t.parentId === null)
    .sort((a, b) => {
      if (a.isToday !== b.isToday) return a.isToday ? -1 : 1;
      return a.order - b.order;
    });

  const getSubtasks = (parentId: string) =>
    filteredTasks
      .filter((t) => t.parentId === parentId)
      .sort((a, b) => a.order - b.order);

  const handleAdd = () => {
    const trimmed = newTaskTitle.trim();
    if (!trimmed) return;
    const maxOrder = tasks.reduce((max, t) => Math.max(max, t.order), -1);
    const newTask: Task = {
      id: generateId(),
      title: trimmed,
      description: "",
      completed: false,
      workspace: activeWorkspace,
      isToday: false,
      parentId: null,
      order: maxOrder + 1,
      createdAt: new Date().toISOString(),
    };
    onTasksChange([...tasks, newTask]);
    setNewTaskTitle("");
  };

  const handleToggle = (id: string) => {
    onTasksChange(
      tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const handleDelete = (id: string) => {
    onTasksChange(tasks.filter((t) => t.id !== id && t.parentId !== id));
  };

  const handleEdit = (id: string, title: string) => {
    onTasksChange(tasks.map((t) => (t.id === id ? { ...t, title } : t)));
  };

  const handleEditDescription = (id: string, description: string) => {
    onTasksChange(tasks.map((t) => (t.id === id ? { ...t, description } : t)));
  };

  const handleAddSubtask = (parentId: string) => {
    const parent = tasks.find((t) => t.id === parentId);
    if (!parent) return;
    const subs = tasks.filter((t) => t.parentId === parentId);
    const maxOrder = subs.reduce((max, t) => Math.max(max, t.order), -1);
    const newSub: Task = {
      id: generateId(),
      title: "新しいサブタスク",
      description: "",
      completed: false,
      workspace: parent.workspace,
      isToday: parent.isToday,
      parentId,
      order: maxOrder + 1,
      createdAt: new Date().toISOString(),
    };
    onTasksChange([...tasks, newSub]);
  };

  const handleDragStart = (_e: React.DragEvent, id: string) => {
    dragItem.current = id;
  };

  const handleDragOver = (e: React.DragEvent, _id: string) => {
    e.preventDefault();
  };

  const handleDrop = (_e: React.DragEvent, targetId: string) => {
    const dragId = dragItem.current;
    if (!dragId || dragId === targetId) return;

    const dragTask = tasks.find((t) => t.id === dragId);
    const targetTask = tasks.find((t) => t.id === targetId);
    if (!dragTask || !targetTask) return;
    if (dragTask.parentId !== null || targetTask.parentId !== null) return;

    const currentParents = parentTasks.map((t) => t.id);
    const dragIdx = currentParents.indexOf(dragId);
    const targetIdx = currentParents.indexOf(targetId);
    if (dragIdx === -1 || targetIdx === -1) return;

    const reordered = [...currentParents];
    reordered.splice(dragIdx, 1);
    reordered.splice(targetIdx, 0, dragId);

    const updated = tasks.map((t) => {
      const newIdx = reordered.indexOf(t.id);
      if (newIdx !== -1) return { ...t, order: newIdx };
      return t;
    });

    onTasksChange(updated);
    dragItem.current = null;
  };

  const viewTitle =
    activeView === "done"
      ? "完了済み"
      : activeView === "today"
      ? "今日のToDo"
      : "ToDo";

  const currentWsName =
    workspaces.find((w) => w.id === activeWorkspace)?.name ?? "";

  return (
    <div className="flex-1 bg-white rounded-xl shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-800 truncate">{viewTitle}</h2>
        <span className="text-sm text-gray-400 shrink-0 ml-2">
          {currentWsName}
        </span>
      </div>

      {activeView !== "done" && (
        <div className="flex gap-2 mb-4">
          <input
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="新しいタスクを追加..."
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#2d4fd4] transition-colors"
          />
          <button
            onClick={handleAdd}
            className="px-4 py-2 bg-[#2d4fd4] text-white rounded-lg text-sm font-medium hover:bg-[#2340b0] transition-colors"
          >
            追加
          </button>
        </div>
      )}

      <div className="divide-y divide-gray-100">
        {parentTasks.length === 0 && (
          <p className="text-sm text-gray-400 py-8 text-center">
            タスクがありません
          </p>
        )}
        {parentTasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            subtasks={getSubtasks(task.id)}
            onToggle={handleToggle}
            onDelete={handleDelete}
            onEdit={handleEdit}
            onEditDescription={handleEditDescription}
            onAddSubtask={handleAddSubtask}
            onToggleIsToday={onToggleIsToday}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          />
        ))}
      </div>
    </div>
  );
}
