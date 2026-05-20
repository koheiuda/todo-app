"use client";

import { useState } from "react";
import type { Task } from "@/lib/todo/types";

interface TaskItemProps {
  task: Task;
  subtasks: Task[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, title: string) => void;
  onEditDescription: (id: string, description: string) => void;
  onAddSubtask: (parentId: string) => void;
  onToggleIsToday: (id: string) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragOver: (e: React.DragEvent, id: string) => void;
  onDrop: (e: React.DragEvent, id: string) => void;
  isSubtask?: boolean;
}

export function TaskItem({
  task,
  subtasks,
  onToggle,
  onDelete,
  onEdit,
  onEditDescription,
  onAddSubtask,
  onToggleIsToday,
  onDragStart,
  onDragOver,
  onDrop,
  isSubtask = false,
}: TaskItemProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(task.title);
  const [dragOver, setDragOver] = useState(false);
  const [expanded, setExpanded] = useState(() => task.description.length > 0);
  const [editingDesc, setEditingDesc] = useState(false);
  const [descValue, setDescValue] = useState(task.description);

  const handleSubmit = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== task.title) {
      onEdit(task.id, trimmed);
    } else {
      setEditValue(task.title);
    }
    setEditing(false);
  };

  const handleDescSubmit = () => {
    if (descValue !== task.description) {
      onEditDescription(task.id, descValue);
    }
    setEditingDesc(false);
  };

  const hasDescription = task.description.length > 0;

  return (
    <div>
      <div
        draggable={!isSubtask}
        onDragStart={(e) => onDragStart(e, task.id)}
        onDragOver={(e) => {
          e.preventDefault();
          onDragOver(e, task.id);
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          setDragOver(false);
          onDrop(e, task.id);
        }}
        className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
          dragOver
            ? "bg-[#2d4fd4]/5 border-t-2 border-[#2d4fd4]"
            : task.isToday && !task.completed
            ? "bg-yellow-50 hover:bg-yellow-100"
            : "hover:bg-gray-50"
        } ${isSubtask ? "ml-10" : ""}`}
      >
        <button
          onClick={() => onToggle(task.id)}
          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${
            task.completed
              ? "bg-[#22c55e] text-white"
              : "bg-[#1e2a4a] text-white hover:bg-[#2d4fd4]"
          }`}
        >
          {task.completed ? (
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              autoFocus
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSubmit}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
                if (e.key === "Escape") {
                  setEditValue(task.title);
                  setEditing(false);
                }
              }}
              placeholder="タスク名"
              className="w-full px-2 py-1 border border-[#2d4fd4] rounded text-sm outline-none"
            />
          ) : (
            <div className="flex items-center gap-1.5">
              <span
                onDoubleClick={() => {
                  setEditing(true);
                  setEditValue(task.title);
                }}
                className={`text-sm cursor-pointer select-none truncate ${
                  task.completed ? "line-through text-gray-400" : "text-gray-800"
                }`}
              >
                {task.title}
              </span>
              {hasDescription && !expanded && (
                <button
                  onClick={() => setExpanded(true)}
                  className="shrink-0 text-gray-300 hover:text-[#2d4fd4] transition-colors"
                  title="詳細を表示"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 6h16M4 12h10M4 18h14"
                    />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>

        <button
          onClick={() => onToggleIsToday(task.id)}
          title={task.isToday ? "今日のToDoから外す" : "今日のToDoに追加"}
          aria-label="今日のToDoマーク"
          aria-pressed={task.isToday ? "true" : "false"}
          className={`shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
            task.isToday
              ? "bg-[#22c55e] border-[#22c55e] text-white hover:bg-[#16a34a] hover:border-[#16a34a]"
              : "bg-white border-gray-300 text-transparent hover:border-[#22c55e]"
          }`}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </button>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => {
              if (!expanded) {
                setExpanded(true);
                if (!hasDescription) {
                  setEditingDesc(true);
                  setDescValue("");
                }
              } else {
                setExpanded(false);
                setEditingDesc(false);
              }
            }}
            className={`p-1 text-xs transition-colors ${
              expanded ? "text-[#2d4fd4]" : "text-gray-400 hover:text-[#2d4fd4]"
            }`}
            title="詳細"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h10M4 18h14"
              />
            </svg>
          </button>
          {!isSubtask && (
            <button
              onClick={() => onAddSubtask(task.id)}
              className="p-1 text-gray-400 hover:text-[#2d4fd4] text-xs"
              title="サブタスク追加"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>
          )}
          <button
            onClick={() => {
              setEditing(true);
              setEditValue(task.title);
            }}
            className="p-1 text-gray-400 hover:text-[#2d4fd4] text-xs"
            title="編集"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="p-1 text-gray-400 hover:text-red-500 text-xs"
            title="削除"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>

      {expanded && (
        <div className={`px-3 pb-2 ${isSubtask ? "ml-10" : ""}`}>
          <div className="ml-11 bg-gray-50 rounded-lg p-3">
            {editingDesc ? (
              <div>
                <textarea
                  autoFocus
                  value={descValue}
                  onChange={(e) => setDescValue(e.target.value)}
                  onBlur={handleDescSubmit}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setDescValue(task.description);
                      setEditingDesc(false);
                    }
                  }}
                  placeholder="詳細を入力..."
                  rows={3}
                  className="w-full px-2 py-1.5 border border-[#2d4fd4] rounded text-sm outline-none resize-y min-h-[60px]"
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={handleDescSubmit}
                    className="px-3 py-1 bg-[#2d4fd4] text-white rounded text-xs font-medium hover:bg-[#2340b0] transition-colors"
                  >
                    保存
                  </button>
                  <button
                    onClick={() => {
                      setDescValue(task.description);
                      setEditingDesc(false);
                    }}
                    className="px-3 py-1 bg-gray-200 text-gray-600 rounded text-xs font-medium hover:bg-gray-300 transition-colors"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => {
                  setEditingDesc(true);
                  setDescValue(task.description);
                }}
                className="cursor-pointer"
              >
                {hasDescription ? (
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">
                    {task.description}
                  </p>
                ) : (
                  <p className="text-sm text-gray-400 italic">詳細を追加...</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {subtasks.map((sub) => (
        <TaskItem
          key={sub.id}
          task={sub}
          subtasks={[]}
          onToggle={onToggle}
          onDelete={onDelete}
          onEdit={onEdit}
          onEditDescription={onEditDescription}
          onAddSubtask={onAddSubtask}
          onToggleIsToday={onToggleIsToday}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDrop={onDrop}
          isSubtask
        />
      ))}
    </div>
  );
}
