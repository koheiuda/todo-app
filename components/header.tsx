"use client";

import { usePathname } from "next/navigation";
import { useTodo } from "@/components/todo/todo-context";

const routeTitles: Record<string, string> = {
  "/": "ToDoリスト",
  "/news": "SEO News",
  "/scheduled": "予約投稿",
  "/settings": "設定",
};

export function Header() {
  const pathname = usePathname();
  const { activeView, setActiveView } = useTodo();
  const isTodoRoute = pathname === "/";

  const title =
    Object.entries(routeTitles).find(([k]) =>
      k === "/" ? pathname === "/" : pathname.startsWith(k)
    )?.[1] ?? "SEO News X";

  return (
    <header className="bg-[#1e2a4a] text-white px-6 py-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-2xl md:text-3xl font-bold tracking-wide">{title}</p>
        {isTodoRoute && (
          <button
            onClick={() =>
              setActiveView(activeView === "today" ? "list" : "today")
            }
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors shrink-0 ${
              activeView === "today"
                ? "bg-[#22c55e] text-white"
                : "bg-white/15 text-white hover:bg-white/25"
            }`}
          >
            今日のToDo
          </button>
        )}
      </div>
    </header>
  );
}
