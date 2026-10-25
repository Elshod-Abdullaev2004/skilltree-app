"use client";

import { useState, useEffect, useCallback } from "react";
import { useTelegram } from "@/hooks/useTelegram";
import { useLanguage } from "@/utils/translations";
import VacancyCard, { type VacancyItem } from "@/components/VacancyCard";
import { Terminal, RefreshCw, ChevronDown, Filter, Zap } from "lucide-react";

const FILTER_KEYS = ["all", "match", "frontend", "backend", "noExp"] as const;
type FilterKey = (typeof FILTER_KEYS)[number];

export default function VacanciesPage() {
  const { user, dbUser } = useTelegram();
  const { t, lang } = useLanguage();
  const isUz = lang === "uz";

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
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("filter") === "match") {
        setActiveFilter("match");
      }
    }
  }, [loadVacancies]);

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      loadVacancies(page + 1, true);
    }
  };

  const getFilterLabel = (key: FilterKey) => {
    switch (key) {
      case "match":
        return isUz ? "MOS KELUVCHI" : "ПОД МОИ НАВЫКИ";
      case "frontend":
        return "FRONTEND";
      case "backend":
        return "BACKEND";
      case "noExp":
        return isUz ? "TAJRIBASIZ" : "БЕЗ ОПЫТА";
      default:
        return isUz ? "BARCHA" : "ВСЕ ВАКАНСИИ";
    }
  };

  // Мгновенная фильтрация карточек
  const filteredVacancies = vacancies.filter((vacancy) => {
    if (activeFilter === "all") return true;

    const haystack = `${vacancy.title} ${(vacancy.tags || []).join(" ")}`.toLowerCase();

    if (activeFilter === "match") {
      const userSkills = (dbUser?.skills || []).map((s) => s.toLowerCase());
      if (userSkills.length === 0) return true;
      return userSkills.some(
        (skill) => haystack.includes(skill) || (vacancy.tags || []).some((t) => t.toLowerCase().includes(skill))
      );
    }

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
    <div className="space-y-3.5 font-mono">
      {/* Верхний кибер-терминальный блок */}
      <section className="cyber-panel p-3.5 space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5 text-[9px] text-zinc-500 uppercase tracking-widest">
              <span className="w-1.5 h-1.5 bg-cyber-green inline-block animate-pulse" />
              <span>[LIVE_FEED // IT_JOBS_UZ]</span>
            </div>
            <h1 className="text-lg font-bold uppercase tracking-tight text-white mt-1">
              {user
                ? `&gt; HELLO, ${user.first_name.toUpperCase()}!`
                : "> VACANCIES // STREAM"}
            </h1>
          </div>

          <button
            type="button"
            onClick={() => loadVacancies(1, false)}
            disabled={isLoading}
            className="bg-cyber-black border border-cyber-green/50 text-cyber-green px-2.5 py-1 text-right shrink-0 hover:bg-cyber-green hover:text-cyber-black transition-all cursor-pointer rounded-none"
          >
            <span className="flex items-center justify-end gap-1 text-[8px] uppercase text-zinc-400">
              <RefreshCw
                className={`w-2.5 h-2.5 ${isLoading ? "animate-spin" : ""}`}
              />
              <span>SYNC</span>
            </span>
            <span className="text-xs font-bold font-mono">
              {isLoading
                ? "..."
                : `[${filteredVacancies.length}${
                    totalCount !== null ? `/${totalCount}` : ""
                  }]`}
            </span>
          </button>
        </div>

        {/* Подсказка в стиле консоли */}
        <div className="bg-cyber-black border border-cyber-green/30 p-2 text-[10px] text-zinc-300 leading-snug flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-cyber-green shrink-0" />
          <p>
            <span className="text-cyber-green font-bold mr-1">&gt; PROTOCOL:</span>
            {isUz
              ? "Vakansiyaga topshirishdan oldin 15 ta texnik savoldan iborat jangovar filtrni topshirish talab etiladi."
              : "Для отклика на вакансию требуется пройти технический фильтр из 15 вопросов (порог 80%)."}
          </p>
        </div>
      </section>

      {/* Горизонтальная строка с фильтрами */}
      <section aria-label="Фильтры категорий">
        <div className="flex items-center justify-between mb-1.5 text-[10px]">
          <span className="text-zinc-500 uppercase tracking-wider flex items-center gap-1">
            <Filter className="w-3 h-3 text-cyber-green" />
            <span>FILTER_CATEGORIES</span>
          </span>
          {activeFilter !== "all" && (
            <button
              type="button"
              onClick={() => setActiveFilter("all")}
              className="text-cyber-red font-bold uppercase hover:underline cursor-pointer text-[9px]"
            >
              [RESET_FILTER]
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {FILTER_KEYS.map((key) => {
            const isActive = activeFilter === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveFilter(key)}
                className={`shrink-0 px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider border transition-all rounded-none cursor-pointer ${
                  isActive
                    ? "bg-cyber-green text-cyber-black border-cyber-green font-bold shadow-cyber-glow"
                    : "bg-cyber-dark text-zinc-400 border-zinc-800 hover:border-cyber-green/60 hover:text-cyber-green"
                }`}
              >
                [{getFilterLabel(key)}]
              </button>
            );
          })}
        </div>
      </section>

      {/* Состояние загрузки */}
      {isLoading && (
        <section aria-label="Загрузка" className="space-y-3">
          <div className="bg-cyber-dark border border-cyber-green/40 p-3 flex items-center gap-2 text-xs text-cyber-green">
            <RefreshCw className="w-4 h-4 animate-spin stroke-[2.5]" />
            <span className="tracking-widest uppercase">&gt; FETCHING VACANCY STREAM...</span>
          </div>

          {[1, 2].map((n) => (
            <div
              key={n}
              className="cyber-panel p-3.5 space-y-3 animate-pulse opacity-60"
            >
              <div className="h-4 bg-zinc-800 w-3/4" />
              <div className="h-3 bg-zinc-800 w-1/2" />
              <div className="h-8 bg-zinc-800 w-32 border border-zinc-700" />
              <div className="h-9 bg-zinc-800 w-full" />
            </div>
          ))}
        </section>
      )}

      {/* Ошибка загрузки */}
      {!isLoading && errorFlag && (
        <div className="cyber-panel-red p-4 space-y-2 text-center">
          <p className="text-xs font-bold text-cyber-red uppercase">
            &gt; ERROR_FETCHING_DATA // CONNECTION TIMEOUT
          </p>
          <button
            type="button"
            onClick={() => loadVacancies(1, false)}
            className="px-4 py-2 bg-cyber-black text-cyber-green border border-cyber-green hover:bg-cyber-green hover:text-cyber-black text-xs font-bold uppercase cursor-pointer rounded-none"
          >
            &gt; RETRY_CONNECTION
          </button>
        </div>
      )}

      {/* Лента карточек вакансий */}
      {!isLoading && !errorFlag && (
        <section aria-label="Список вакансий" className="space-y-3.5">
          {filteredVacancies.length > 0 ? (
            <>
              {filteredVacancies.map((vacancy, index) => (
                <VacancyCard
                  key={vacancy._id || vacancy.id || `${vacancy.title}-${index}`}
                  vacancy={vacancy}
                  index={index}
                />
              ))}

              {/* Кнопка пагинации */}
              {hasMore && (
                <div className="pt-2 pb-6">
                  <button
                    type="button"
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    className="w-full py-3 px-4 bg-cyber-black text-cyber-green border border-cyber-green hover:bg-cyber-green hover:text-cyber-black font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer rounded-none cyber-glow disabled:opacity-50"
                  >
                    {isLoadingMore ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin stroke-[2.5]" />
                        <span>&gt; LOADING_MORE_DATA...</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4 stroke-[3]" />
                        <span>
                          {isUz
                            ? "> KO'PROQ YUKLASH [PAGINATION]"
                            : "> ПОКАЗАТЬ ЕЩЕ [ЗАГРУЗИТЬ 15]"}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {!hasMore && vacancies.length > 0 && (
                <div className="text-center py-4 text-[10px] uppercase tracking-widest text-zinc-600 font-mono">
                  [END_OF_TRANSMISSION // ALL VACANCIES LOADED]
                </div>
              )}
            </>
          ) : (
            <div className="cyber-panel p-5 text-center space-y-2">
              <p className="text-xs font-bold text-zinc-400 uppercase">
                &gt; NO_DATA_FOR_FILTER: [{getFilterLabel(activeFilter)}]
              </p>
              <button
                type="button"
                onClick={() => setActiveFilter("all")}
                className="px-3 py-1.5 bg-cyber-black text-cyber-green border border-cyber-green hover:bg-cyber-green hover:text-cyber-black text-xs font-bold uppercase cursor-pointer rounded-none"
              >
                &gt; RESET_TO_ALL
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
