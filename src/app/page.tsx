"use client";

import { useState, useEffect, useCallback } from "react";
import { useTelegram } from "@/hooks/useTelegram";
import { useLanguage } from "@/utils/translations";
import VacancyCard, { type VacancyItem } from "@/components/VacancyCard";
import { Filter, RefreshCw, Zap } from "lucide-react";

const FILTER_KEYS = ["all", "frontend", "backend", "noExp"] as const;
type FilterKey = (typeof FILTER_KEYS)[number];

export default function VacanciesPage() {
  const { user } = useTelegram();
  const { t } = useLanguage();
  const [vacancies, setVacancies] = useState<VacancyItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorFlag, setErrorFlag] = useState<boolean>(false);

  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    "https://skilltree-backend-swuh.onrender.com";

  const loadVacancies = useCallback(async () => {
    setIsLoading(true);
    setErrorFlag(false);

    try {
      const response = await fetch(`${apiUrl}/api/vacancies`);
      if (!response.ok) {
        throw new Error(`Status: ${response.status}`);
      }

      let data: VacancyItem[] = await response.json();

      if (Array.isArray(data) && data.length === 0) {
        const syncResponse = await fetch(`${apiUrl}/api/vacancies/sync`);
        if (syncResponse.ok) {
          const syncResult = await syncResponse.json();
          if (Array.isArray(syncResult.vacancies)) {
            data = syncResult.vacancies;
          }
        }
      }

      setVacancies(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Ошибка при загрузке вакансий:", error);
      setErrorFlag(true);
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    loadVacancies();
  }, [loadVacancies]);

  const getFilterLabel = (key: FilterKey) => {
    switch (key) {
      case "frontend":
        return t.filterFrontend;
      case "backend":
        return t.filterBackend;
      case "noExp":
        return `⚡ ${t.filterNoExp}`;
      default:
        return t.filterAll;
    }
  };

  // Мгновенная фильтрация карточек по ключевым словам в названии или тегах
  const filteredVacancies = vacancies.filter((vacancy) => {
    if (activeFilter === "all") return true;

    const haystack = `${vacancy.title} ${(vacancy.tags || []).join(" ")}`.toLowerCase();

    if (activeFilter === "frontend") {
      return /frontend|фронтенд|react|next\.?js|vue|angular|typescript|javascript|верст|ui/i.test(
        haystack
      );
    }

    if (activeFilter === "backend") {
      return /backend|бэкенд|node\.?js|python|java\b|golang|php|c#|\.net|sql|fullstack|фулстек/i.test(
        haystack
      );
    }

    if (activeFilter === "noExp") {
      return /без опыта|стажировка|стажер|intern|trainee/i.test(haystack);
    }

    return true;
  });

  return (
    <div className="space-y-4">
      {/* Верхний приветственный блок в манга-стиле */}
      <section className="relative bg-manga-yellow border-[3px] border-black shadow-[4px_4px_0px_#000] p-3.5 bg-halftone-yellow overflow-hidden">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="inline-block bg-black text-manga-yellow text-[10px] font-black uppercase px-2 py-0.5 tracking-wider">
              {user
                ? `${t.greeting.toUpperCase()}, ${user.first_name}! 👋`
                : t.heroBadgeLive}
            </span>
            <h1 className="text-2xl font-black uppercase tracking-tight leading-none mt-1.5">
              {user ? `${t.greeting}, ${user.first_name}!` : t.vacanciesTitle}
            </h1>
          </div>

          <button
            type="button"
            onClick={loadVacancies}
            disabled={isLoading}
            className="bg-white border-2 border-black px-2.5 py-1 shadow-[2px_2px_0px_#000] text-right shrink-0 -rotate-2 active:rotate-0 transition-transform"
          >
            <span className="flex items-center justify-end gap-1 text-[9px] font-black uppercase text-zinc-600">
              <RefreshCw
                className={`w-2.5 h-2.5 ${isLoading ? "animate-spin" : ""}`}
              />
              {t.inDatabase}
            </span>
            <span className="text-sm font-black text-black">
              {isLoading ? "..." : `${filteredVacancies.length} ${t.itemsCountSuffix}`}
            </span>
          </button>
        </div>

        <div className="mt-3 mb-2 bg-white border-[2.5px] border-black p-2.5 shadow-[2px_2px_0px_#000] speech-bubble-left">
          <p className="text-xs font-bold leading-snug text-black">
            <span className="bg-manga-lime px-1 py-0.5 border border-black font-black mr-1">
              {t.botTipLabel}
            </span>
            {t.botTipText}
          </p>
        </div>
      </section>

      {/* Горизонтальная прокрутка с кнопками-фильтрами */}
      <section aria-label="Фильтры по категориям">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 stroke-[2.5]" />
            {t.filterTitle}
          </span>
          {activeFilter !== "all" && (
            <button
              type="button"
              onClick={() => setActiveFilter("all")}
              className="text-[11px] font-black underline decoration-2 text-manga-pink"
            >
              {t.resetFilter}
            </button>
          )}
        </div>

        <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar pb-2 pt-0.5 -mx-3.5 px-3.5">
          {FILTER_KEYS.map((key) => {
            const isActive = activeFilter === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveFilter(key)}
                className={`shrink-0 px-4 py-2 text-xs font-black uppercase tracking-wide border-[2.5px] border-black transition-all select-none ${
                  isActive
                    ? "bg-manga-lime text-black shadow-[4px_4px_0px_#000] -translate-y-0.5"
                    : "bg-white text-black shadow-[2px_2px_0px_#000] hover:bg-manga-yellow/40 active:translate-x-[1px] active:translate-y-[1px]"
                }`}
              >
                {getFilterLabel(key)}
              </button>
            );
          })}
        </div>
      </section>

      {/* Состояние загрузки */}
      {isLoading && (
        <section aria-label="Загрузка вакансий" className="space-y-4">
          <div className="bg-manga-cyan border-[3px] border-black shadow-[4px_4px_0px_#000] p-3 flex items-center gap-2.5">
            <Zap className="w-5 h-5 stroke-[2.5] animate-bounce shrink-0" />
            <span className="text-xs font-black uppercase tracking-wide">
              {t.loadingVacancies}
            </span>
          </div>

          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="bg-white border-[3px] border-black shadow-[4px_4px_0px_#000] overflow-hidden animate-pulse"
            >
              <div className="h-9 bg-zinc-200 border-b-[3px] border-black" />
              <div className="p-3.5 space-y-3">
                <div className="h-5 w-3/4 bg-zinc-200 border border-black" />
                <div className="h-4 w-1/2 bg-zinc-200 border border-black" />
                <div className="h-10 w-40 bg-zinc-200 border-2 border-black" />
                <div className="flex gap-2">
                  <div className="h-5 w-16 bg-zinc-200 border border-black" />
                  <div className="h-5 w-20 bg-zinc-200 border border-black" />
                </div>
                <div className="h-11 w-full bg-zinc-300 border-2 border-black" />
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Ошибка загрузки */}
      {!isLoading && errorFlag && (
        <div className="bg-red-100 border-[3px] border-black shadow-[4px_4px_0px_#000] p-4 space-y-2.5">
          <p className="text-xs font-black uppercase text-red-900">
            {t.errorLoadingVacancies}
          </p>
          <button
            type="button"
            onClick={loadVacancies}
            className="px-4 py-2 bg-manga-yellow border-2 border-black shadow-[2px_2px_0px_#000] text-xs font-black uppercase"
          >
            {t.retryButton}
          </button>
        </div>
      )}

      {/* Лента карточек вакансий */}
      {!isLoading && !errorFlag && (
        <section aria-label="Список вакансий" className="space-y-4">
          {filteredVacancies.length > 0 ? (
            filteredVacancies.map((vacancy, index) => (
              <VacancyCard
                key={vacancy._id || vacancy.id || `${vacancy.title}-${index}`}
                vacancy={vacancy}
                index={index}
              />
            ))
          ) : (
            <div className="bg-white border-[3px] border-black shadow-[4px_4px_0px_#000] p-5 text-center space-y-2">
              <p className="text-sm font-black uppercase">
                {t.emptyCategoryPrefix} «{getFilterLabel(activeFilter)}» {t.emptyCategorySuffix}
              </p>
              <button
                type="button"
                onClick={() => setActiveFilter("all")}
                className="inline-block px-4 py-2 bg-manga-lime border-2 border-black shadow-[2px_2px_0px_#000] text-xs font-black uppercase"
              >
                {t.showAllVacancies}
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
