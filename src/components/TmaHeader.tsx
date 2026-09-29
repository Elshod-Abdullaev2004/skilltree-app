"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Zap, ShieldCheck, Flame } from "lucide-react";
import { USER_PROFILE } from "@/data/mockData";
import { useTelegram } from "@/hooks/useTelegram";

export default function TmaHeader() {
  const pathname = usePathname();
  const { user } = useTelegram();

  const getChapterLabel = () => {
    switch (pathname) {
      case "/tree":
      case "/skill-tree":
        return "GLAVA 04 // ДЕРЕВО НАВЫКОВ";
      case "/resume":
        return "GLAVA 02 // ИИ-ГЕНЕРАТОР";
      case "/trainer":
        return "GLAVA 03 // ДОДЗЁ МЕНТОРА";
      default:
        return "GLAVA 01 // ДОСКА КВЕСТОВ";
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-manga-paper border-b-[3px] border-manga-ink">
      {/* Top Telegram Mini App System Strip */}
      <div className="bg-manga-ink text-white px-3 py-1 flex items-center justify-between text-[11px] font-mono tracking-wider uppercase">
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-manga-lime animate-pulse" />
          <span className="font-bold text-manga-yellow">SKILLTREE TMA</span>
          <span className="text-zinc-400">
            • {user ? `@${user.username || user.first_name}` : "미니앱 v1.0"}
          </span>
        </div>
        <span className="text-[10px] bg-zinc-800 px-1.5 py-0.5 border border-zinc-600 text-manga-cyan font-bold">
          {getChapterLabel()}
        </span>
      </div>

      {/* Main Brutalist Manga Header */}
      <div className="px-3.5 py-2.5 flex items-center justify-between bg-speedlines">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 bg-manga-yellow border-2 border-manga-ink shadow-brutal-sm flex items-center justify-center font-black text-lg -rotate-3 group-active:rotate-0 transition-transform">
            ST
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-base tracking-tight uppercase leading-none">
                {user ? `Привет, ${user.first_name}!` : "SkillTree"}
              </span>
              <span className="bg-manga-pink text-white text-[10px] font-black px-1.5 py-0.5 border border-manga-ink -skew-x-6">
                MVP
              </span>
            </div>
            <p className="text-[11px] font-bold text-zinc-700 flex items-center gap-1 mt-0.5">
              <ShieldCheck className="w-3 h-3 text-manga-ink" />
              {USER_PROFILE.rank}
            </p>
          </div>
        </Link>

        {/* Right XP & Streak Pills */}
        <div className="flex items-center gap-1.5">
          <div
            className="flex items-center gap-1 bg-white border-2 border-manga-ink px-2 py-1 shadow-brutal-sm text-xs font-black"
            title="Ударная серия дней"
          >
            <Flame className="w-3.5 h-3.5 text-manga-orange fill-manga-orange" />
            <span>{USER_PROFILE.streakDays}д</span>
          </div>
          <Link
            href="/tree"
            className="flex items-center gap-1 bg-manga-lime border-2 border-manga-ink px-2.5 py-1 shadow-brutal-sm text-xs font-black active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
          >
            <Zap className="w-3.5 h-3.5 fill-manga-ink" />
            <span>ДЕРЕВО</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
