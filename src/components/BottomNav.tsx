"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, FileText, Swords, GitBranch } from "lucide-react";

const NAV_ITEMS = [
  {
    href: "/",
    label: "Вакансии",
    icon: Briefcase,
    activeBg: "bg-manga-yellow",
    badge: "5",
  },
  {
    href: "/resume",
    label: "Резюме",
    icon: FileText,
    activeBg: "bg-manga-cyan",
    badge: "AI",
  },
  {
    href: "/trainer",
    label: "Тренажер",
    icon: Swords,
    activeBg: "bg-manga-pink text-white",
    badge: null,
  },
  {
    href: "/skill-tree",
    label: "Дерево навыков",
    icon: GitBranch,
    activeBg: "bg-manga-lime",
    badge: "LVL 4",
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Основная навигация"
      className="fixed bottom-0 left-0 right-0 z-40 mx-auto max-w-[430px] bg-manga-paper border-t-[3px] border-x-[3px] border-manga-ink px-2 pt-2 pb-3 shadow-[0_-4px_0_0_#111111]"
    >
      <ul className="grid grid-cols-4 gap-1.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/"
              ? pathname === "/" || pathname === "/vacancies"
              : pathname.startsWith(item.href);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`relative flex flex-col items-center justify-center py-2 px-1 border-2 border-manga-ink transition-all select-none ${
                  isActive
                    ? `${item.activeBg} -translate-y-1 shadow-brutal-sm font-black`
                    : "bg-white text-zinc-700 hover:bg-zinc-100 font-bold active:translate-y-0.5"
                }`}
              >
                {item.badge && (
                  <span
                    className={`absolute -top-2 right-1 px-1 py-0 text-[9px] font-black border border-manga-ink uppercase leading-tight ${
                      isActive
                        ? "bg-manga-ink text-manga-yellow"
                        : "bg-manga-yellow text-manga-ink"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                <Icon className="w-5 h-5 stroke-[2.5]" />
                <span className="text-[10px] leading-tight mt-1 text-center tracking-tight line-clamp-1">
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
