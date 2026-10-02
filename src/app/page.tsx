"use client";

import { useState, useEffect, useCallback } from "react";
import { useTelegram } from "@/hooks/useTelegram";
import { useLanguage } from "@/utils/translations";
import VacancyCard, { type VacancyItem } from "@/components/VacancyCard";
import { Filter, RefreshCw, Zap, ChevronDown } from "lucide-react";

const FILTER_KEYS = ["all", "frontend", "backend", "noExp"] as const;
type FilterKey = (typeof FILTER_KEYS)[number];

export default function VacanciesPage() {
  const { user } = useTelegram();
  const { t } = useLanguage();
  const [vacancies, setVacancies] = useState<VacancyItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [errorFlag, setErrorFlag] = useState<boolean>(false);

  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    "https://skilltree-backend-swuh.onrender.com";

  const loadVacancies = useCallback(
    async (targetPage = 1, append = false) => {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
        setErrorFlag(false);
      }

      try {
        const response = await fetch(
          `${apiUrl}/api/vacancies?page=${targetPage}&limit=15`,
          {
            cache: "no-store",
          }
        );
        if (!response.ok) {
          throw new Error(`Status: ${response.status}`);
        }

        const data = await response.json();
        let items: VacancyItem[] = Array.isArray(data)
          ? data
          : data.vacancies || [];
        let more: boolean = Array.isArray(data)
          ? false
          : Boolean(data.hasMore);
        let total: number = Array.isArray(data)
          ? items.length
          : data.total ?? items.length;

        // Если при первой загрузке база пуста, инициируем синхронизацию
        if (targetPage === 1 && items.length === 0) {
          const syncResponse = await fetch(`${apiUrl}/api/vacancies/sync`, {
            cache: "no-store",
          });
          if (syncResponse.ok) {
            const syncResult = await syncResponse.json();
            if (Array.isArray(syncResult.vacancies)) {
              items = syncResult.vacancies.slice(0, 15);
              total = syncResult.vacancies.length;
              more = total > 15;
            }
          }
        }

        setVacancies((prev) => {
          if (!append) return items;
          const existingIds = new Set(
            prev.map((v) => v._id || v.id || v.title)
          );
          const uniqueNewItems = items.filter(
            (v) => !existingIds.has(v._id || v.id || v.title)
          );
          return [...prev, ...uniqueNewItems];
        });

        setPage(targetPage);
        setHasMore(more);
        setTotalCount(total);
      } catch (error) {
        console.error("Ошибка при загрузке вакансий:", error);
        if (!append) {
          setErrorFlag(true);
        }
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [apiUrl]
  );

  useEffect(() => {
    loadVacancies(1, false);
  }, [loadVacancies]);

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      loadVacancies(page + 1, true);
    }
  };

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
            onClick={() => loadVacancies(1, false)}
            disabled={isLoading}
            className="bg-white border-2 border-black px-2.5 py-1 shadow-[2px_2px_0px_#000] text-right shrink-0 -rotate-2 active:rotate-0 transition-transform cursor-pointer"
          >
            <span className="flex items-center justify-end gap-1 text-[9px] font-black uppercase text-zinc-600">
              <RefreshCw
                className={`w-2.5 h-2.5 ${isLoading ? "animate-spin" : ""}`}
              />
              {t.inDatabase}
            </span>
            <span className="text-sm font-black text-black">
              {isLoading
                ? "..."
                : `${filteredVacancies.length}${
                    totalCount !== null ? ` / ${totalCount}` : ""
                  } ${t.itemsCountSuffix}`}
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
              className="text-[11px] font-black underline decoration-2 text-manga-pink cursor-pointer"
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
                className={`shrink-0 px-4 py-2 text-xs font-black uppercase tracking-wide border-[2.5px] border-black transition-all select-none cursor-pointer ${
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

      {/* Состояние первичной загрузки */}
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
            onClick={() => loadVacancies(1, false)}
            className="px-4 py-2 bg-manga-yellow border-2 border-black shadow-[2px_2px_0px_#000] text-xs font-black uppercase cursor-pointer"
          >
            {t.retryButton}
          </button>
        </div>
      )}

      {/* Лента карточек вакансий */}
      {!isLoading && !errorFlag && (
        <section aria-label="Список вакансий" className="space-y-4">
          {filteredVacancies.length > 0 ? (
            <>
              {filteredVacancies.map((vacancy, index) => (
                <VacancyCard
                  key={vacancy._id || vacancy.id || `${vacancy.title}-${index}`}
                  vacancy={vacancy}
                  index={index}
                />
              ))}

              {/* Кнопка пагинации "Показать еще", скрывается если hasMore: false */}
              {hasMore && (
                <div className="pt-2 pb-6">
                  <button
                    type="button"
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    className="w-full py-3.5 px-4 bg-manga-yellow hover:bg-yellow-400 border-[3px] border-black shadow-[4px_4px_0px_#000] font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#000] transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isLoadingMore ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin stroke-[2.5]" />
                        <span>{t.loadingMore}</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4 stroke-[3]" />
                        <span>{t.loadMoreVacancies}</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Индикатор конца списка */}
              {!hasMore && vacancies.length > 0 && (
                <div className="text-center py-4 text-xs font-black uppercase tracking-wider text-zinc-500">
                  • {t.noMoreVacancies} •
                </div>
              )}
            </>
          ) : (
            <div className="bg-white border-[3px] border-black shadow-[4px_4px_0px_#000] p-5 text-center space-y-2">
              <p className="text-sm font-black uppercase">
                {t.emptyCategoryPrefix} «{getFilterLabel(activeFilter)}» {t.emptyCategorySuffix}
              </p>
              <button
                type="button"
                onClick={() => setActiveFilter("all")}
                className="inline-block px-4 py-2 bg-manga-lime border-2 border-black shadow-[2px_2px_0px_#000] text-xs font-black uppercase cursor-pointer"
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
