"use client";

import { Building2, ExternalLink, Flame, MapPin, Sparkles } from "lucide-react";
import { useLanguage } from "@/utils/translations";

export interface VacancyItem {
  _id?: string;
  id?: string;
  title: string;
  company: string;
  salary: string;
  sourceUrl: string;
  tags: string[];
  createdAt?: string;
}

interface VacancyCardProps {
  vacancy: VacancyItem;
  index?: number;
}

const HEADER_COLORS = [
  "bg-manga-lime",
  "bg-manga-yellow",
  "bg-manga-cyan",
];

export default function VacancyCard({ vacancy, index = 0 }: VacancyCardProps) {
  const { t } = useLanguage();

  const isNoExperience =
    vacancy.tags?.some((tag) =>
      /без опыта|стажировка|intern|trainee|стажер/i.test(tag)
    ) || /стажер|intern|trainee|без опыта/i.test(vacancy.title);

  const levelBadge = isNoExperience ? t.badgeNoExp : t.badgeJunior;
  const headerBg = HEADER_COLORS[index % HEADER_COLORS.length];

  return (
    <article className="bg-white border-[3px] border-black shadow-[4px_4px_0px_#000] overflow-hidden transition-transform">
      {/* Верхняя нео-бруталистская плашка карточки */}
      <div
        className={`${headerBg} bg-halftone-dense border-b-[3px] border-black px-3.5 py-2 flex items-center justify-between gap-2`}
      >
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-black uppercase border-2 border-black shadow-[2px_2px_0px_#000] ${
            isNoExperience
              ? "bg-manga-pink text-white"
              : "bg-white text-black"
          }`}
        >
          <Flame className="w-3.5 h-3.5 stroke-[2.5]" />
          {levelBadge}
        </span>

        <span className="bg-black text-manga-yellow text-[10px] font-black px-2 py-0.5 uppercase tracking-wider border border-black">
          HH.UZ • VERIFIED
        </span>
      </div>

      {/* Основной контент карточки */}
      <div className="p-3.5 space-y-3">
        {/* Название вакансии и Компания */}
        <div>
          <h2 className="text-lg font-black leading-tight text-black">
            {vacancy.title}
          </h2>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-bold text-zinc-700">
            <span className="inline-flex items-center gap-1 text-black font-black">
              <Building2 className="w-3.5 h-3.5 stroke-[2.5]" />
              {vacancy.company}
            </span>
            <span className="inline-flex items-center gap-1 text-zinc-600">
              <MapPin className="w-3.5 h-3.5" />
              {t.cityTashkent}
            </span>
          </div>
        </div>

        {/* Блок зарплаты */}
        <div className="inline-block bg-manga-yellow/40 border-2 border-black px-3 py-1.5 shadow-[2px_2px_0px_#000]">
          <span className="block text-[9px] font-black uppercase text-zinc-700 tracking-wider">
            {t.salaryLabel}
          </span>
          <span className="text-base font-black text-black">
            {vacancy.salary || t.salaryNegotiable}
          </span>
        </div>

        {/* Теги технологий */}
        {Array.isArray(vacancy.tags) && vacancy.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {vacancy.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 text-[11px] font-black bg-manga-bg border-2 border-black uppercase shadow-[2px_2px_0px_#000]"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Акцентная кнопка "Откликнуться" / "Topshirish" */}
        <div className="pt-1">
          <a
            href={vacancy.sourceUrl || "https://tashkent.hh.uz"}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-4 bg-manga-orange text-white border-[3px] border-black shadow-[4px_4px_0px_#000] font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-manga-pink active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#000] transition-all"
          >
            <ExternalLink className="w-4 h-4 stroke-[2.5]" />
            <span>{t.applyButton}</span>
            <Sparkles className="w-4 h-4 stroke-[2.5] ml-auto" />
          </a>
        </div>
      </div>
    </article>
  );
}
