"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Terminal, Shield, Globe, Cpu } from "lucide-react";
import { USER_PROFILE } from "@/data/mockData";
import { useTelegram } from "@/context/TelegramProvider";
import { useLanguage } from "@/utils/translations";

export default function TmaHeader() {
  const pathname = usePathname();
  const { user, dbUser } = useTelegram();
  const { lang, toggleLanguage, setLanguage, t } = useLanguage();
  const [level, setLevel] = useState<number>(1);

  // Синхронизация уровня и языка из глобального контекста без лишних сетевых запросов
  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedLvl = localStorage.getItem("skilltree_level");
    if (savedLvl && !Number.isNaN(Number(savedLvl))) {
      setLevel(Number(savedLvl));
    }

    if (dbUser) {
      if (typeof dbUser.level === "number") {
        setLevel(dbUser.level);
        try {
          localStorage.setItem("skilltree_level", String(dbUser.level));
        } catch {}
      }

      if (dbUser.language === "ru" || dbUser.language === "uz") {
        setLanguage(dbUser.language);
      }
    }

    const handleLevelUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<{ level: number }>;
      if (typeof customEvent.detail?.level === "number") {
        setLevel(customEvent.detail.level);
      }
    };

    window.addEventListener("skilltree:level-updated", handleLevelUpdated);
    return () => {
      window.removeEventListener("skilltree:level-updated", handleLevelUpdated);
    };
  }, [dbUser, setLanguage]);

  const getChapterLabel = () => {
    switch (pathname) {
      case "/tree":
      case "/skill-tree":
        return "MATRIX // SKILLS";
      case "/resume":
        return "CLEARANCE // AI_ID";
      case "/trainer":
        return "SIMULATOR // CODE";
      default:
        return "NET // VACANCIES";
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-cyber-black border-b border-cyber-green/40 backdrop-blur-md">
      {/* Top Cyber System Strip */}
      <div className="bg-cyber-dark/90 text-cyber-green px-3 py-1 flex items-center justify-between text-[10px] font-mono tracking-wider uppercase border-b border-cyber-green/20">
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 bg-cyber-green animate-pulse shadow-[0_0_8px_#00ff41]" />
          <span className="font-bold tracking-widest text-cyber-green">
            TERMINAL_V2.5
          </span>
          <span className="text-zinc-500">
            • {user ? `root@${user.username || user.first_name}` : "node_0x1"}
          </span>
        </div>
        <span className="text-[9px] bg-cyber-black px-1.5 py-0.5 border border-cyber-green/40 text-cyber-blue font-bold tracking-widest">
          {getChapterLabel()}
        </span>
      </div>

      {/* Main Cyber Terminal Header */}
      <div className="px-3.5 py-2.5 flex items-center justify-between gap-2 bg-cyber-black">
        <Link href="/" className="flex items-center gap-2 group min-w-0">
          <div className="w-8 h-8 shrink-0 bg-cyber-dark border border-cyber-green text-cyber-green flex items-center justify-center font-black text-sm group-hover:bg-cyber-green group-hover:text-cyber-black transition-all cyber-glow">
            <Terminal className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-black text-sm tracking-widest uppercase leading-none truncate text-white cyber-glitch">
                {user ? user.first_name.toUpperCase() : "SKILLTREE"}
              </span>
              <span className="text-[10px] text-cyber-green font-bold">::SEC</span>
            </div>
            <p className="text-[10px] font-mono text-zinc-400 flex items-center gap-1 mt-0.5 truncate">
              <Shield className="w-3 h-3 text-cyber-blue shrink-0" />
              <span>{dbUser?.rank || USER_PROFILE.rank}</span>
            </p>
          </div>
        </Link>

        {/* Right Controls: Language Switcher (RU / UZ) + Level Badge */}
        <div className="flex items-center gap-1.5 shrink-0 font-mono">
          <button
            type="button"
            onClick={toggleLanguage}
            aria-label="Переключить язык"
            className="flex items-center gap-1 bg-cyber-dark text-cyber-green border border-cyber-green/50 hover:bg-cyber-green hover:text-cyber-black px-2 py-1 text-[11px] font-bold uppercase transition-all cursor-pointer cyber-glitch"
          >
            <Globe className="w-3 h-3 stroke-[2.5]" />
            <span>[{lang === "ru" ? "RU" : "UZ"}]</span>
          </button>

          <Link
            href="/tree"
            className="flex items-center gap-1 bg-cyber-dark text-cyber-blue border border-cyber-blue/50 hover:bg-cyber-blue hover:text-cyber-black px-2 py-1 text-[11px] font-bold transition-all cyber-glow-blue"
          >
            <Cpu className="w-3 h-3 stroke-[2.5]" />
            <span>LVL_{level.toString().padStart(2, "0")}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
