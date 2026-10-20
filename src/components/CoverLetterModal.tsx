"use client";

import { useState, useEffect, useRef } from "react";
import {
  Bot,
  Briefcase,
  Building2,
  Check,
  Copy,
  ExternalLink,
  FileText,
  Loader2,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import { useLanguage } from "@/utils/translations";
import { useTelegram } from "@/context/TelegramProvider";
import { trackEvent } from "@/utils/analytics";
import { showToast } from "@/utils/toast";
import type { VacancyItem } from "@/components/VacancyCard";

interface CoverLetterModalProps {
  vacancy: VacancyItem;
  directUrl: string;
  onClose: () => void;
}

export default function CoverLetterModal({
  vacancy,
  directUrl,
  onClose,
}: CoverLetterModalProps) {
  const { lang } = useLanguage();
  const { initData, dbUser } = useTelegram();
  const [loading, setLoading] = useState(true);
  const [loadingStep, setLoadingStep] = useState(0);
  const [coverLetter, setCoverLetter] = useState("");
  const [copied, setCopied] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  const isUz = lang === "uz";
  const vacancyId = vacancy._id || vacancy.id || vacancy.title;

  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    "https://skilltree-backend-swuh.onrender.com";

  // Динамическая ротация статуса генерации ИИ
  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setLoadingStep((prev) => (prev + 1) % 3);
    }, 1200);
    return () => clearInterval(interval);
  }, [loading]);

  // Генерация письма через POST /api/ai/cover-letter
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    async function generateLetter() {
      // Логгер события запроса сопроводительного письма
      trackEvent("cover_letter_requested", {
        vacancy: vacancy.title,
        company: vacancy.company,
        vacancy_id: vacancyId,
      });

      try {
        const response = await fetch(`${apiUrl}/api/ai/cover-letter`, {
          method: "POST",
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
            ...(initData
              ? {
                  Authorization: `Bearer ${initData}`,
                  "x-telegram-init-data": initData,
                }
              : { "x-guest-mode": "true" }),
          },
          body: JSON.stringify({
            title: vacancy.title,
            company: vacancy.company,
            description: Array.isArray(vacancy.tags)
              ? vacancy.tags.join(", ")
              : vacancy.title,
            language: lang,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (isMounted && data.coverLetter) {
            setCoverLetter(data.coverLetter);
            setLoading(false);
            return;
          }
        }
      } catch (err: unknown) {
        if ((err as Error)?.name === "AbortError") return;
        console.warn("⚠️ [CoverLetter] Ошибка запроса к API, используем локальный шаблон:", err);
      }

      // Резервный качественный текст, если API недоступен
      if (isMounted) {
        const fallbackText = isUz
          ? `Assalomu alaykum!

Meni ${vacancy.company} kompaniyasidagi «${vacancy.title}» vakansiyasi juda qiziqtirdi. Men IT sohasida faol rivojlanayotgan va jamoaga real foyda keltirishga tayyor bo'lgan Junior dasturchiman.

${dbUser?.about_me ? `${dbUser.about_me}\n\n` : ""}Mening stekingizga mos ko'nikmalarim: ${
              dbUser?.skills?.length
                ? dbUser.skills.join(", ")
                : "HTML5, CSS3, JavaScript, React, Tailwind CSS"
            }. Loyihalarimda toza kod yozish, komponentli arxitektura va qulay foydalanuvchi interfeysiga alohida e'tibor beraman.

${dbUser?.github_url ? `💻 GitHub: ${dbUser.github_url}\n` : ""}${
              dbUser?.portfolio_url ? `🌐 Portfolio: ${dbUser.portfolio_url}\n` : ""
            }
${vacancy.company} vazifalariga tezda kirishib, amaliy topshiriqlarni mas'uliyat bilan bajarishga tayyorman.

Texnik suhbatda ko'nikmalarimni batafsil muhokama qilishdan mamnun bo'lardim!`
          : `Здравствуйте!

Меня искренне заинтересовала вакансия «${vacancy.title}» в компании ${vacancy.company}. Я начинающий разработчик с уверенной практической базой и желанием решать реальные продуктовые задачи.

${dbUser?.about_me ? `${dbUser.about_me}\n\n` : ""}Мой технологический стек: ${
              dbUser?.skills?.length
                ? dbUser.skills.join(", ")
                : "HTML5, CSS3/Tailwind, JavaScript, React, Next.js"
            }. В пет-проектах я уделяю особое внимание чистоте кода, компонентному подходу и адаптивности.

${dbUser?.github_url ? `💻 GitHub с кодом: ${dbUser.github_url}\n` : ""}${
              dbUser?.portfolio_url ? `🌐 Портфолио: ${dbUser.portfolio_url}\n` : ""
            }
Готов быстро включиться в процессы команды ${vacancy.company}, расти под руководством сильных коллег и приносить измеримую пользу компании.

Буду рад обсудить детали на интервью!`;

        setCoverLetter(fallbackText);
        setLoading(false);
      }
    }

    generateLetter();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [apiUrl, initData, lang, vacancy.title, vacancy.company, vacancy.tags, vacancyId, dbUser, isUz]);

  const getDynamicLoadingText = () => {
    if (isUz) {
      switch (loadingStep) {
        case 0:
          return "🔍 Vakansiya talablari va kompaniya tahlil qilinmoqda...";
        case 1:
          return "🧠 Sizning GitHub va profilingiz moslashtirilmoqda...";
        default:
          return "✍️ Ortiqcha suvsiz mukammal xat tuzilmoqda...";
      }
    }
    switch (loadingStep) {
      case 0:
        return "🔍 Анализируем требования вакансии и профиль компании...";
      case 1:
        return "🧠 Сопоставляем ваш стек, GitHub и достижения...";
      default:
        return "✍️ Составляем убедительное письмо без шаблонов и воды...";
    }
  };

  // Клик на главную кнопку "Скопировать и перейти на hh.uz"
  const handleCopyAndApply = async () => {
    if (isApplying) return;
    setIsApplying(true);

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(coverLetter);
      }
    } catch (e) {
      console.warn("Clipboard write failed:", e);
    }

    // Фиксация события отклика в воронке аналитики
    trackEvent("vacancy_apply_clicked", {
      vacancy_id: vacancyId,
      title: vacancy.title,
      company: vacancy.company,
      url: directUrl,
    });

    // Красивое Toast-уведомление
    showToast(
      isUz
        ? "✅ Xat nusxalandi! hh.uz sahifasi ochilmoqda..."
        : "✅ Письмо скопировано! Переходим на hh.uz..."
    );

    // Открытие прямой ссылки на вакансию
    setTimeout(() => {
      if (typeof window !== "undefined") {
        window.open(directUrl, "_blank");
      }
      onClose();
    }, 450);
  };

  const handleJustCopy = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(coverLetter);
      }
      setCopied(true);
      showToast(
        isUz ? "Nusxa olindi!" : "Сопроводительное письмо скопировано!"
      );
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.warn("Clipboard copy failed:", e);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cover-letter-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-[2px]"
    >
      <div className="w-full max-w-[460px] bg-white border-[3.5px] border-black shadow-[8px_8px_0px_#000] overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* Шапка модального окна */}
        <div className="bg-manga-yellow border-b-[3.5px] border-black px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 bg-black text-manga-yellow border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_#000]">
              <Sparkles className="w-4.5 h-4.5 stroke-[2.5]" />
            </span>
            <div>
              <span className="block text-[10px] font-black uppercase tracking-wider text-zinc-900">
                GEMINI 2.5 FLASH • AI ASSISTANT
              </span>
              <h2
                id="cover-letter-title"
                className="text-base font-black uppercase leading-none text-black"
              >
                {isUz ? "Kuzatuv xati" : "Сопроводительное письмо"}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 bg-white border-2 border-black shadow-[2px_2px_0px_#000] flex items-center justify-center hover:bg-manga-pink hover:text-white active:translate-x-[1px] active:translate-y-[1px] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 stroke-[3]" />
          </button>
        </div>

        {/* Тело модалки */}
        <div className="p-4 bg-halftone space-y-4 overflow-y-auto">
          {/* Информационная плашка вакансии */}
          <div className="bg-white border-2 border-black p-2.5 shadow-[3px_3px_0px_#000] flex items-center justify-between gap-2">
            <div>
              <span className="block text-[9px] font-black uppercase text-zinc-600">
                {isUz ? "Vakansiya va kompaniya" : "Отклик на вакансию"}
              </span>
              <h3 className="text-xs font-black text-black leading-tight">
                {vacancy.title}
              </h3>
              <p className="text-[11px] font-bold text-zinc-700 flex items-center gap-1 mt-0.5">
                <Building2 className="w-3 h-3 stroke-[2.5]" />
                {vacancy.company}
              </p>
            </div>
            <span className="bg-manga-lime text-black border border-black px-2 py-0.5 text-[9px] font-black uppercase shrink-0">
              HH.UZ
            </span>
          </div>

          {/* 1. СОСТОЯНИЕ ЗАГРУЗКИ */}
          {loading && (
            <div className="space-y-4 py-4">
              <div className="bg-manga-cyan border-[3px] border-black p-5 shadow-[4px_4px_0px_#000] text-center space-y-3 relative overflow-hidden bg-halftone-dense">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-white border-2 border-black shadow-[3px_3px_0px_#000] animate-bounce">
                  <Bot className="w-8 h-8 text-black stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase text-black flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin shrink-0 stroke-[3]" />
                    <span>
                      {isUz
                        ? "🤖 AI kuzatuv xatini yozmoqda..."
                        : "🤖 ИИ пишет сопроводительное письмо..."}
                    </span>
                  </h3>
                  <p className="text-xs font-bold text-zinc-800 mt-1.5 min-h-[32px] flex items-center justify-center transition-all">
                    {getDynamicLoadingText()}
                  </p>
                </div>
              </div>

              {/* Нео-бруталистские скелетоны */}
              <div className="space-y-2 animate-pulse">
                <div className="h-4 bg-zinc-300 border-2 border-black w-2/5" />
                <div className="h-24 bg-zinc-200 border-2 border-black shadow-[2px_2px_0px_#000]" />
                <div className="h-12 bg-zinc-300 border-2 border-black shadow-[2px_2px_0px_#000]" />
              </div>
            </div>
          )}

          {/* 2. РЕЗУЛЬТАТ: ГОТОВЫЙ ТЕКСТ ПИСЬМА */}
          {!loading && (
            <div className="space-y-3.5 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 text-zinc-900">
                  <FileText className="w-3.5 h-3.5 stroke-[2.5]" />
                  {isUz
                    ? "Matnni tahrirlashingiz mumkin:"
                    : "Готовый текст (можно отредактировать):"}
                </span>

                <button
                  type="button"
                  onClick={handleJustCopy}
                  className="inline-flex items-center gap-1 text-[10px] font-black uppercase bg-white border border-black px-2 py-0.5 shadow-[1px_1px_0px_#000] hover:bg-manga-yellow transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-green-700 stroke-[3]" />
                      <span>{isUz ? "Nusxalandi" : "Скопировано"}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 stroke-[2.5]" />
                      <span>{isUz ? "Nusxa olish" : "Копировать"}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Редактируемый блок текста письма */}
              <div className="relative">
                <textarea
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  rows={9}
                  className="w-full bg-white border-[2.5px] border-black p-3 text-xs font-bold leading-relaxed text-black shadow-[3px_3px_0px_#000] focus:outline-none focus:bg-manga-yellow/10 resize-none font-sans"
                />
              </div>

              {/* Подсказка */}
              <div className="bg-manga-yellow/40 border-2 border-black p-2 shadow-[2px_2px_0px_#000] flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-black shrink-0 stroke-[2.5]" />
                <p className="text-[10px] font-bold text-zinc-800 leading-tight">
                  {isUz
                    ? "Tugmani bosganingizda matn avtomatik nusxalanadi va vakansiya sahifasi ochiladi."
                    : "При нажатии на кнопку текст скопируется, и откроется страница вакансии на hh.uz."}
                </p>
              </div>

              {/* Главная кнопка действия: Скопировать и перейти на hh.uz */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleCopyAndApply}
                  disabled={isApplying}
                  className="w-full py-3.5 px-4 bg-manga-lime hover:bg-[#34d399] text-black border-[3px] border-black font-black text-sm uppercase tracking-wider shadow-[4px_4px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#000] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  {isApplying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin stroke-[3]" />
                      <span>{isUz ? "Ochilmoqda..." : "Переходим..."}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 stroke-[2.5]" />
                      <span>
                        {isUz
                          ? "Nusxa olish va hh.uz ga o'tish"
                          : "Скопировать и перейти на hh.uz"}
                      </span>
                      <ExternalLink className="w-4 h-4 stroke-[2.5]" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2 px-3 bg-white hover:bg-zinc-100 text-black border-2 border-black font-black text-xs uppercase tracking-wider shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
                >
                  {isUz ? "Yopish" : "Закрыть"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
