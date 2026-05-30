"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTodo } from "@/components/todo/todo-context";

type Section = {
  id: "todo" | "news" | "accounting" | "training";
  label: string;
  href: string;
  isActive: (pathname: string) => boolean;
};

const SECTIONS: Section[] = [
  {
    id: "todo",
    label: "ToDo",
    href: "/",
    isActive: (p) => p === "/",
  },
  {
    id: "news",
    label: "SEO News",
    href: "/news",
    isActive: (p) =>
      p.startsWith("/news") ||
      p.startsWith("/scheduled") ||
      p.startsWith("/articles") ||
      p.startsWith("/settings"),
  },
  {
    id: "accounting",
    label: "会計",
    href: "/accounting",
    isActive: (p) => p.startsWith("/accounting"),
  },
  {
    id: "training",
    label: "筋トレ",
    href: "/training",
    isActive: (p) => p.startsWith("/training"),
  },
];

export function Header() {
  const pathname = usePathname();
  const { activeView, setActiveView } = useTodo();
  const isTodoRoute = pathname === "/";

  return (
    <header className="bg-[#1e2a4a] text-white px-6 py-4">
      <div className="flex items-center justify-between gap-4">
        <nav className="flex items-center gap-1">
          {SECTIONS.map((s) => {
            const active = s.isActive(pathname);
            return (
              <Link
                key={s.id}
                href={s.href}
                className={`px-4 py-1.5 rounded-md text-base md:text-lg font-bold tracking-wide transition-colors ${
                  active
                    ? "bg-white text-[#1e2a4a]"
                    : "text-white/80 hover:bg-white/10"
                }`}
              >
                {s.label}
              </Link>
            );
          })}
        </nav>
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
