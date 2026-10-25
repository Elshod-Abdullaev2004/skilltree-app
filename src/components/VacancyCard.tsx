"use client";

import { useState, useEffect, useRef } from "react";
import { Building2, Terminal, Flame, MapPin, ChevronRight } from "lucide-react";
import { useLanguage } from "@/utils/translations";
import { trackEvent } from "@/utils/analytics";
import CoverLetterModal from "@/components/CoverLetterModal";

export interface VacancyItem {
  _id?: string;
  id?: string;
  title: string;
  company: string;
  salary: string;
  sourceUrl?: string;
  url?: string;
  alternate_url?: string;
  tags: string[];
  createdAt?: string;
}

interface VacancyCardProps {
  vacancy: VacancyItem;
  index?: number;
}

export default function VacancyCard({ vacancy, index = 0 }: VacancyCardProps) {
  const { t, lang } = useLanguage();
  const isUz = lang === "uz";

  const isNoExperience =
    vacancy.tags?.some((tag) =>
      /без опыта|стажировка|intern|trainee|стажер/i.test(tag)
    ) || /стажер|intern|trainee|без опыта/i.test(vacancy.title);

  const levelBadge = isNoExperience
    ? isUz
      ? "TAJRIBASIZ"
      : "БЕЗ ОПЫТА"
    : isUz
    ? "JUNIOR POS"
    : "JUNIOR";

  // Прямая веб-ссылка на саму вакансию
  const directUrl =
    vacancy.url ||
    vacancy.alternate_url ||
    vacancy.sourceUrl ||
    (vacancy.id && !isNaN(Number(vacancy.id))
      ? `https://tashkent.hh.uz/vacancy/${vacancy.id}`
      : "#");

  const vacancyId = vacancy._id || vacancy.id || vacancy.title;
  const hasTrackedViewRef = useRef(false);
  const [isCoverLetterOpen, setIsCoverLetterOpen] = useState(false);

  // Шаг воронки: vacancy_viewed
  useEffect(() => {
    if (!hasTrackedViewRef.current) {
      hasTrackedViewRef.current = true;
      trackEvent("vacancy_viewed", {
        vacancy_id: vacancyId,
        title: vacancy.title,
        company: vacancy.company,
      });
    }
  }, [vacancyId, vacancy.title, vacancy.company]);

  const handleApplyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsCoverLetterOpen(true);
  };

  return (
    <article
      onClick={() => {
        trackEvent("vacancy_viewed", {
          vacancy_id: vacancyId,
          title: vacancy.title,
          company: vacancy.company,
        });
      }}
      className="cyber-panel hover:border-cyber-green transition-all rounded-none overflow-hidden cursor-pointer font-mono group"
    >
      {/* Верхняя кибер-плашка карточки */}
      <div className="bg-cyber-black border-b border-cyber-green/30 px-3.5 py-2 flex items-center justify-between gap-2 text-[10px]">
        <div className="flex items-center gap-2">
          <span className="text-zinc-600 font-bold">
            0x{(index + 1).toString(16).padStart(2, "0").toUpperCase()}
          </span>
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold uppercase border ${
              isNoExperience
                ? "bg-cyber-red/20 text-cyber-red border-cyber-red/60"
                : "bg-cyber-blue/20 text-cyber-blue border-cyber-blue/60"
            }`}
          >
            <Flame className="w-3 h-3 stroke-[2.5]" />
            {levelBadge}
          </span>
        </div>

        <span className="bg-cyber-dark text-cyber-green border border-cyber-green/40 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">
          HH.UZ // VERIFIED
        </span>
      </div>

      {/* Основной контент карточки */}
      <div className="p-3.5 space-y-3">
        {/* Название вакансии и Компания */}
        <div>
          <h2 className="text-base font-bold leading-snug text-white group-hover:text-cyber-green transition-colors uppercase tracking-tight">
            {vacancy.title}
          </h2>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-mono text-zinc-400">
            <span className="inline-flex items-center gap-1 text-cyber-cyan">
              <Building2 className="w-3.5 h-3.5 stroke-[2]" />
              {vacancy.company}
            </span>
            <span className="inline-flex items-center gap-1 text-zinc-500">
              <MapPin className="w-3 h-3" />
              {t.cityTashkent}
            </span>
          </div>
        </div>

        {/* Блок зарплаты */}
        <div className="inline-block bg-cyber-black border border-cyber-green/50 px-3 py-1">
          <span className="block text-[8px] font-bold uppercase text-zinc-500 tracking-wider">
            {isUz ? "MAOSH / COMP" : "ОКЛАД / SALARY"}
          </span>
          <span className="text-sm font-bold text-cyber-green">
            {vacancy.salary || (isUz ? "Kelishuv asosida" : "По договоренности")}
          </span>
        </div>

        {/* Теги технологий */}
        {Array.isArray(vacancy.tags) && vacancy.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {vacancy.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 text-[10px] font-mono bg-cyber-black text-zinc-300 border border-zinc-800 uppercase"
              >
                [{tag}]
              </span>
            ))}
          </div>
        )}

        {/* Терминальная кнопка отклика с запуском боевого ИИ-собеседования */}
        <div className="pt-1">
          <button
            type="button"
            onClick={handleApplyClick}
            className="w-full py-2.5 px-3 bg-cyber-black text-cyber-green border border-cyber-green hover:bg-cyber-green hover:text-cyber-black font-mono font-bold text-xs uppercase tracking-widest flex items-center justify-between transition-all cyber-glitch cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Terminal className="w-4 h-4 stroke-[2.5]" />
              <span>
                {isUz
                  ? "> TOPSHIRISH [JANGovar TEST]"
                  : "> ОТКЛИКНУТЬСЯ [БОЕВОЙ ТЕСТ]"}
              </span>
            </span>
            <ChevronRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* Модальное окно боевого собеседования */}
      {isCoverLetterOpen && (
        <CoverLetterModal
          vacancy={vacancy}
          directUrl={directUrl}
          onClose={() => setIsCoverLetterOpen(false)}
        />
      )}
    </article>
  );
}
