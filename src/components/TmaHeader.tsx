"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Zap, ShieldCheck, Globe } from "lucide-react";
import { USER_PROFILE } from "@/data/mockData";
import { useTelegram } from "@/hooks/useTelegram";
import { useLanguage } from "@/utils/translations";

export default function TmaHeader() {
  const pathname = usePathname();
  const { user } = useTelegram();
  const { lang, toggleLanguage, setLanguage, t } = useLanguage();
  const [level, setLevel] = useState<number>(1);

  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    "https://skilltree-backend-swuh.onrender.com";

  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedLvl = localStorage.getItem("skilltree_level");
    if (savedLvl && !Number.isNaN(Number(savedLvl))) {
      setLevel(Number(savedLvl));
    }

    const telegramId = user?.id ? String(user.id) : "guest_dev";
    fetch(`${apiUrl}/api/users?telegramId=${encodeURIComponent(telegramId)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const found = Array.isArray(data) ? data[0] : data;
        if (found) {
          const srvLevel =
            typeof found.level === "number"
              ? found.level
              : 1 + (Array.isArray(found.skills) ? found.skills.length : 0);
          setLevel(srvLevel);
          localStorage.setItem("skilltree_level", String(srvLevel));

          // Если в localStorage еще не сохранен ручной выбор, берем язык из БД
          if (
            !localStorage.getItem("skilltree_lang") &&
            (found.language === "ru" || found.language === "uz")
          ) {
            setLanguage(found.language);
          }
        }
      })
      .catch(() => {});

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
  }, [apiUrl, user?.id, setLanguage]);

  const getChapterLabel = () => {
    switch (pathname) {
      case "/tree":
      case "/skill-tree":
        return t.chapterTree;
      case "/resume":
        return t.chapterResume;
      case "/trainer":
        return t.chapterTrainer;
      default:
        return t.chapterVacancies;
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-manga-paper border-b-[3px] border-black">
      {/* Top Telegram Mini App System Strip */}
      <div className="bg-black text-white px-3 py-1 flex items-center justify-between text-[11px] font-mono tracking-wider uppercase">
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-manga-lime animate-pulse" />
          <span className="font-bold text-manga-yellow">SKILLTREE TMA</span>
          <span className="text-zinc-400">
            • {user ? `@${user.username || user.first_name}` : "v1.0"}
          </span>
        </div>
        <span className="text-[10px] bg-zinc-800 px-1.5 py-0.5 border border-zinc-600 text-manga-cyan font-bold">
          {getChapterLabel()}
        </span>
      </div>

      {/* Main Brutalist Manga Header */}
      <div className="px-3.5 py-2.5 flex items-center justify-between bg-speedlines gap-2">
        <Link href="/" className="flex items-center gap-2 group min-w-0">
          <div className="w-9 h-9 shrink-0 bg-manga-yellow border-2 border-black shadow-[2px_2px_0px_#000] flex items-center justify-center font-black text-lg -rotate-3 group-active:rotate-0 transition-transform">
            ST
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-black text-base tracking-tight uppercase leading-none truncate">
                {user ? `${t.greeting}, ${user.first_name}!` : "SkillTree"}
              </span>
            </div>
            <p className="text-[11px] font-bold text-zinc-700 flex items-center gap-1 mt-0.5 truncate">
              <ShieldCheck className="w-3 h-3 text-black shrink-0" />
              {USER_PROFILE.rank}
            </p>
          </div>
        </Link>

        {/* Right Controls: Language Switcher (RU / UZ) + Level Badge */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={toggleLanguage}
            aria-label="Переключить язык / Tilni o'zgartirish"
            className="flex items-center gap-1 bg-manga-cyan border-2 border-black px-2 py-1 shadow-[2px_2px_0px_#000] text-xs font-black uppercase active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{lang === "ru" ? "RU" : "UZ"}</span>
          </button>

          <Link
            href="/tree"
            className="flex items-center gap-1 bg-manga-lime border-2 border-black px-2.5 py-1 shadow-[2px_2px_0px_#000] text-xs font-black active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
          >
            <Zap className="w-3.5 h-3.5 fill-black" />
            <span>LVL {level}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
