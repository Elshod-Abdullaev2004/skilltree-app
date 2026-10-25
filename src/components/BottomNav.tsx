"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Terminal, Cpu, FileCode2, Binary } from "lucide-react";
import { useLanguage } from "@/utils/translations";

export default function BottomNav() {
  const pathname = usePathname();
  const { lang } = useLanguage();
  const isUz = lang === "uz";

  const navItems = [
    {
      href: "/",
      label: isUz ? "Vakansiyalar" : "Вакансии",
      cmd: "FEED",
      icon: Terminal,
      badge: "LIVE",
    },
    {
      href: "/tree",
      label: isUz ? "Daraxt" : "Дерево",
      cmd: "TREE",
      icon: Cpu,
      badge: "MAP",
    },
    {
      href: "/resume",
      label: isUz ? "AI Xat" : "AI Резюме",
      cmd: "CLEAR",
      icon: FileCode2,
      badge: "AI",
    },
    {
      href: "/trainer",
      label: isUz ? "Trener" : "Тренажер",
      cmd: "BATTLE",
      icon: Binary,
      badge: null,
    },
  ];

  return (
    <nav
      aria-label="Терминальная навигация"
      className="fixed bottom-0 left-0 right-0 z-40 mx-auto max-w-[440px] bg-cyber-black/95 backdrop-blur-md border-t border-cyber-green/40 px-2 pt-2 pb-3.5"
    >
      <ul className="grid grid-cols-4 gap-1.5 font-mono">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/"
              ? pathname === "/" || pathname === "/vacancies"
              : item.href === "/tree"
              ? pathname.startsWith("/tree") || pathname.startsWith("/skill-tree")
              : pathname.startsWith(item.href);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`relative flex flex-col items-center justify-center py-2 px-1 border transition-all select-none rounded-none cursor-pointer ${
                  isActive
                    ? "bg-cyber-green text-cyber-black border-cyber-green font-black shadow-cyber-glow"
                    : "bg-cyber-dark text-zinc-400 border-zinc-800 hover:border-cyber-green/60 hover:text-cyber-green font-bold active:translate-y-0.5"
                }`}
              >
                {item.badge && (
                  <span
                    className={`absolute -top-1.5 right-1 px-1 py-0 text-[8px] font-black uppercase tracking-wider ${
                      isActive
                        ? "bg-cyber-black text-cyber-green border border-cyber-black"
                        : "bg-cyber-black text-cyber-green border border-cyber-green/40"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                <Icon className="w-4 h-4 stroke-[2.5]" />
                <span className="text-[10px] leading-tight mt-1 text-center tracking-tight truncate w-full uppercase">
                  {item.label}
                </span>
                <span
                  className={`text-[8px] opacity-75 font-mono ${
                    isActive ? "text-cyber-black font-black" : "text-zinc-600"
                  }`}
                >
                  [{item.cmd}]
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
