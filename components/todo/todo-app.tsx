"use client";

import { TaskList } from "./task-list";
import { useTodo } from "./todo-context";

export function TodoApp() {
  const {
    hydrated,
    tasks,
    workspaces,
    activeWorkspace,
    activeView,
    setTasks,
    toggleIsToday,
  } = useTodo();

  if (!hydrated) {
    return (
      <div className="flex-1 bg-white rounded-xl shadow-sm p-5 text-sm text-gray-400">
        読込中...
      </div>
    );
  }

  return (
    <TaskList
      tasks={tasks}
      workspaces={workspaces}
      activeWorkspace={activeWorkspace}
      activeView={activeView}
      onTasksChange={setTasks}
      onToggleIsToday={toggleIsToday}
    />
  );
}
