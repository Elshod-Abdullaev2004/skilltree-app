"use client";

import { useState } from "react";
import {
  MOCK_VACANCIES,
  VACANCY_FILTER_TAGS,
  type Vacancy,
} from "@/data/mockData";
import { useTelegram } from "@/hooks/useTelegram";
import {
  Building2,
  MapPin,
  Sparkles,
  CheckCircle2,
  Send,
  Filter,
  Flame,
  Clock,
} from "lucide-react";

export default function VacanciesPage() {
  const { user } = useTelegram();
  const [selectedTag, setSelectedTag] = useState<string>("Все");
  const [appliedIds, setAppliedIds] = useState<Record<string, boolean>>({});

  const filteredVacancies =
    selectedTag === "Все"
      ? MOCK_VACANCIES
      : MOCK_VACANCIES.filter(
          (vacancy) =>
            vacancy.tags.includes(selectedTag) ||
            vacancy.levelTag === selectedTag
        );

  const handleApply = (vacancy: Vacancy) => {
    setAppliedIds((prev) => ({
      ...prev,
      [vacancy.id]: true,
    }));
  };

  return (
    <div className="space-y-4">
      {/* Manga Chapter Hero & Speech Bubble */}
      <section className="relative bg-manga-yellow border-[3px] border-manga-ink shadow-brutal p-3.5 bg-halftone-yellow overflow-hidden">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="inline-block bg-manga-ink text-manga-yellow text-[10px] font-black uppercase px-2 py-0.5 tracking-wider">
              {user ? `ПРИВЕТ, ${user.first_name}! 👋` : "ДОСКА ОФФЕРОВ • LIVE"}
            </span>
            <h1 className="text-2xl font-black uppercase tracking-tight leading-none mt-1.5">
              {user ? `Привет, ${user.first_name}!` : "Вакансии для старта"}
            </h1>
          </div>
          <div className="bg-white border-2 border-manga-ink px-2 py-1 shadow-brutal-sm text-right shrink-0 -rotate-2">
            <span className="block text-[9px] font-black uppercase text-zinc-500">
              Доступно
            </span>
            <span className="text-sm font-black text-manga-ink">
              {filteredVacancies.length} квестов
            </span>
          </div>
        </div>

        {/* Manga Speech Bubble */}
        <div className="mt-3 mb-2 bg-white border-[2.5px] border-manga-ink p-2.5 shadow-brutal-sm speech-bubble-left">
          <p className="text-xs font-bold leading-snug text-manga-ink">
            <span className="bg-manga-lime px-1 py-0.5 border border-manga-ink font-black mr-1">
              СОВЕТ БОТА:
            </span>
            Твой профиль совпадает на{" "}
            <span className="underline decoration-2 decoration-manga-pink font-black">
              94%
            </span>{" "}
            с позициями Junior React. Откликайся в 1 тап через Telegram!
          </p>
        </div>
      </section>

      {/* Horizontal Scroll Filter Tags */}
      <section aria-label="Фильтры по технологиям">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 stroke-[2.5]" />
            Фильтр по стеку:
          </span>
          {selectedTag !== "Все" && (
            <button
              type="button"
              onClick={() => setSelectedTag("Все")}
              className="text-[11px] font-black underline decoration-2 text-manga-pink"
            >
              Сбросить ({selectedTag})
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 pt-0.5 -mx-3.5 px-3.5">
          {VACANCY_FILTER_TAGS.map((tag) => {
            const isSelected = selectedTag === tag;
            return (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedTag(tag)}
                className={`shrink-0 px-3.5 py-1.5 text-xs font-black uppercase tracking-wide border-2 border-manga-ink transition-all select-none ${
                  isSelected
                    ? "bg-manga-ink text-manga-yellow shadow-brutal-sm -translate-y-0.5"
                    : "bg-white text-manga-ink shadow-brutal-sm hover:bg-manga-yellow/40 active:translate-x-[1px] active:translate-y-[1px]"
                }`}
              >
                {tag === "Стажировка" ? "⚡ Стажировка" : tag}
              </button>
            );
          })}
        </div>
      </section>

      {/* Vacancy Cards Feed */}
      <section aria-label="Список вакансий" className="space-y-4">
        {filteredVacancies.map((vacancy) => {
          const isApplied = Boolean(appliedIds[vacancy.id]);
          const isInternship = vacancy.levelTag === "Стажировка";

          return (
            <article
              key={vacancy.id}
              className="bg-white border-[3px] border-manga-ink shadow-brutal overflow-hidden transition-transform"
            >
              {/* Top Manga Panel Strip */}
              <div
                className={`${vacancy.accentBg} bg-halftone-dense border-b-[3px] border-manga-ink px-3.5 py-2 flex items-center justify-between gap-2`}
              >
                {/* Level Badge: "Стажировка" / "Junior" */}
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-black uppercase border-2 border-manga-ink shadow-brutal-active ${
                    isInternship
                      ? "bg-manga-pink text-white"
                      : "bg-white text-manga-ink"
                  }`}
                >
                  <Flame className="w-3.5 h-3.5 stroke-[2.5]" />
                  {vacancy.levelTag}
                </span>

                <div className="flex items-center gap-1.5">
                  <span className="bg-manga-ink text-white text-[10px] font-black px-2 py-0.5 uppercase tracking-wide">
                    MATCH {vacancy.matchScore}%
                  </span>
                  <span className="bg-white/90 border border-manga-ink text-[10px] font-bold px-1.5 py-0.5 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {vacancy.postedAt}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-3.5 space-y-3">
                {/* Position & Company */}
                <div>
                  <h2 className="text-lg font-black leading-tight text-manga-ink">
                    {vacancy.title}
                  </h2>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-bold text-zinc-700">
                    <span className="inline-flex items-center gap-1 text-manga-ink font-black">
                      <Building2 className="w-3.5 h-3.5 stroke-[2.5]" />
                      {vacancy.company}
                    </span>
                    <span className="inline-flex items-center gap-1 text-zinc-600">
                      <MapPin className="w-3.5 h-3.5" />
                      {vacancy.format}
                    </span>
                  </div>
                </div>

                {/* Salary Box */}
                <div className="inline-block bg-manga-bg border-2 border-manga-ink px-3 py-1.5 shadow-brutal-sm">
                  <span className="block text-[9px] font-black uppercase text-zinc-500 tracking-wider">
                    Вознаграждение (на руки)
                  </span>
                  <span className="text-base font-black text-manga-ink">
                    {vacancy.salary}
                  </span>
                </div>

                {/* Manga Speech Bubble Insight */}
                <div className="bg-manga-bg border-2 border-manga-ink p-2.5 text-xs font-bold text-zinc-800 relative">
                  <span className="font-black uppercase text-[10px] bg-manga-yellow px-1.5 py-0.5 border border-manga-ink mr-1.5">
                    ИНСАЙД:
                  </span>
                  «{vacancy.questNote}»
                </div>

                {/* Tech Stack Chips */}
                <div className="flex flex-wrap gap-1.5">
                  {vacancy.tags
                    .filter((t) => t !== "Junior" && t !== "Стажировка")
                    .map((tech) => (
                      <span
                        key={tech}
                        className="px-2 py-0.5 text-[11px] font-black bg-white border-2 border-manga-ink uppercase"
                      >
                        #{tech}
                      </span>
                    ))}
                </div>

                {/* Accent Action Button: "Откликнуться" */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => handleApply(vacancy)}
                    disabled={isApplied}
                    className={`w-full py-3 px-4 border-[3px] border-manga-ink font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                      isApplied
                        ? "bg-manga-lime text-manga-ink shadow-brutal-active translate-x-[2px] translate-y-[2px] cursor-default"
                        : "bg-manga-orange text-white shadow-brutal hover:bg-manga-pink active:translate-x-[2px] active:translate-y-[2px] active:shadow-brutal-active"
                    }`}
                  >
                    {isApplied ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 stroke-[3]" />
                        <span>Отклик отправлен в TG (+50 XP)</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 stroke-[2.5]" />
                        <span>Откликнуться</span>
                        <Sparkles className="w-4 h-4 stroke-[2.5] ml-auto" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
