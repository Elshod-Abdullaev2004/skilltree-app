"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import {
  Award,
  Bot,
  Building2,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  FileText,
  Loader2,
  RotateCcw,
  Sparkles,
  TreePine,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import { useLanguage } from "@/utils/translations";
import { useTelegram } from "@/context/TelegramProvider";
import { trackEvent } from "@/utils/analytics";
import { showToast } from "@/utils/toast";
import type { VacancyItem } from "@/components/VacancyCard";

export interface InterviewQuestionItem {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  skill?: string;
}

type ModalStage =
  | "loading_interview"
  | "interview"
  | "interview_failed"
  | "generating_letter"
  | "letter_ready";

interface CoverLetterModalProps {
  vacancy: VacancyItem;
  directUrl: string;
  onClose: () => void;
}

const TOTAL_QUESTIONS = 15;
const PASSING_SCORE = 12; // 80% порог прохождения

export default function CoverLetterModal({
  vacancy,
  directUrl,
  onClose,
}: CoverLetterModalProps) {
  const router = useRouter();
  const { lang } = useLanguage();
  const { initData, dbUser } = useTelegram();

  const [stage, setStage] = useState<ModalStage>("loading_interview");
  const [loadingStep, setLoadingStep] = useState(0);

  // Состояние собеседования
  const [questions, setQuestions] = useState<InterviewQuestionItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [missedSkills, setMissedSkills] = useState<string[]>([]);

  // Состояние сопроводительного письма
  const [coverLetter, setCoverLetter] = useState("");
  const [copied, setCopied] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  const transitionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isUz = lang === "uz";
  const vacancyId = vacancy._id || vacancy.id || vacancy.title;

  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    "https://skilltree-backend-swuh.onrender.com";

  // Очистка таймеров
  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
      }
    };
  }, []);

  // Динамическая ротация статуса генерации ИИ
  useEffect(() => {
    if (stage !== "loading_interview" && stage !== "generating_letter") return;
    const interval = setInterval(() => {
      setLoadingStep((prev) => (prev + 1) % 3);
    }, 1100);
    return () => clearInterval(interval);
  }, [stage]);

  // Запуск загрузки 15 вопросов боевого собеседования
  const loadInterview = async (controller?: AbortController) => {
    setStage("loading_interview");
    setCurrentIndex(0);
    setScore(0);
    setSelectedOption(null);
    setIsAnswerChecked(false);
    setMissedSkills([]);

    // Логируем старт боевого собеседования
    trackEvent("vacancy_interview_started", {
      vacancy: vacancy.title,
      company: vacancy.company,
      vacancy_id: vacancyId,
    });

    try {
      const response = await fetch(`${apiUrl}/api/ai/vacancy-interview`, {
        method: "POST",
        signal: controller?.signal,
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
          vacancyTitle: vacancy.title,
          vacancyDescription: Array.isArray(vacancy.tags)
            ? `${vacancy.title}, технологии: ${vacancy.tags.join(", ")}`
            : vacancy.title,
          company: vacancy.company,
          language: lang,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.questions) && data.questions.length >= 15) {
          setQuestions(data.questions.slice(0, TOTAL_QUESTIONS));
          setStage("interview");
          return;
        } else if (Array.isArray(data.questions) && data.questions.length > 0) {
          // Если пришло меньше 15, дополняем резервным пулом до 15
          const combined = [
            ...data.questions,
            ...getFallbackQuestions(isUz, vacancy.tags?.[0]).slice(
              0,
              TOTAL_QUESTIONS - data.questions.length
            ),
          ];
          setQuestions(combined.slice(0, TOTAL_QUESTIONS));
          setStage("interview");
          return;
        }
      }
    } catch (err: unknown) {
      if ((err as Error)?.name === "AbortError") return;
      console.warn(
        "⚠️ [VacancyInterview] Ошибка загрузки собеседования, запускаем локальный пул 15 вопросов:",
        err
      );
    }

    // Резервный пул 15 практических и сложных вопросов
    setQuestions(getFallbackQuestions(isUz, vacancy.tags?.[0]));
    setStage("interview");
  };

  useEffect(() => {
    const controller = new AbortController();
    loadInterview(controller);
    return () => controller.abort();
  }, [apiUrl, initData, lang, vacancy.title, vacancy.company, vacancy.tags, vacancyId, isUz]);

  // Генерация сопроводительного письма после успешной сдачи теста (>= 12 из 15)
  const generateCoverLetter = async (finalScore: number) => {
    setStage("generating_letter");
    trackEvent("cover_letter_requested", {
      vacancy: vacancy.title,
      company: vacancy.company,
      vacancy_id: vacancyId,
      score: finalScore,
    });

    try {
      const response = await fetch(`${apiUrl}/api/ai/cover-letter`, {
        method: "POST",
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
          testScore: finalScore,
          testTotal: TOTAL_QUESTIONS,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.coverLetter) {
          setCoverLetter(data.coverLetter);
          setStage("letter_ready");
          return;
        }
      }
    } catch (err) {
      console.warn("⚠️ [CoverLetter] Ошибка при генерации письма:", err);
    }

    // Резервный шаблон письма с подтверждением боевого собеседования
    const fallbackLetter = isUz
      ? `Assalomu alaykum!

Meni ${vacancy.company} kompaniyasidagi «${vacancy.title}» vakansiyasi juda qiziqtirdi. Men ushbu vakansiya bo'yicha chuqur texnik jangovar intervyudan muvaffaqiyatli o'tib, ${finalScore}/${TOTAL_QUESTIONS} ball (80%+ dan yuqori) to'pladim va amaliy bilimlarim hamda arxitekturani tushunishimni tasdiqladim.

${dbUser?.about_me ? `${dbUser.about_me}\n\n` : ""}Mening stekingizga mos ko'nikmalarim: ${
          dbUser?.skills?.length
            ? dbUser.skills.join(", ")
            : "HTML5, CSS3, JavaScript, React, Next.js"
        }. O'z loyihalarimda toza kod yozish, komponentli arxitektura va qulay interfeysga alohida e'tibor qarataman.

${dbUser?.github_url ? `💻 GitHub: ${dbUser.github_url}\n` : ""}${
          dbUser?.portfolio_url ? `🌐 Portfolio: ${dbUser.portfolio_url}\n` : ""
        }
${vacancy.company} jamoasiga tezda kirishishga va loyihaga real foyda keltirishga tayyorman.

Texnik suhbatda ko'nikmalarimni batafsil muhokama qilishdan mamnun bo'lardim!`
      : `Здравствуйте!

Меня искренне заинтересовала вакансия «${vacancy.title}» в компании ${vacancy.company}. Я только что успешно прошел углубленное техническое собеседование под требования этой позиции с результатом ${finalScore} из ${TOTAL_QUESTIONS} баллов (более 80%), подтвердив фундаментальную базу и готовность к сложным задачам вашего стека.

${dbUser?.about_me ? `${dbUser.about_me}\n\n` : ""}Мой стек технологий: ${
          dbUser?.skills?.length
            ? dbUser.skills.join(", ")
            : "HTML5, CSS3/Tailwind, JavaScript, React, Next.js"
        }. В проектах я уделяю особое внимание чистоте кода, компонентному подходу и надежной верстке.

${dbUser?.github_url ? `💻 GitHub с примерами: ${dbUser.github_url}\n` : ""}${
          dbUser?.portfolio_url ? `🌐 Портфолио: ${dbUser.portfolio_url}\n` : ""
        }
Готов быстро включиться в процессы ${vacancy.company}, расти под руководством сильных коллег и приносить реальную пользу продукту.

Буду рад обсудить подробности на техническом интервью!`;

    setCoverLetter(fallbackLetter);
    setStage("letter_ready");
  };

  // Обработка выбора ответа на вопрос
  const handleOptionClick = (idx: number) => {
    if (isAnswerChecked || !currentQ) return;

    setSelectedOption(idx);
    setIsAnswerChecked(true);

    const isCorrect = idx === currentQ.correctAnswerIndex;
    const nextScore = isCorrect ? score + 1 : score;

    if (isCorrect) {
      setScore(nextScore);
    } else {
      const failedSkill = currentQ.skill || vacancy.tags?.[0] || "Frontend";
      setMissedSkills((prev) =>
        prev.includes(failedSkill) ? prev : [...prev, failedSkill]
      );
    }

    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
    }

    transitionTimerRef.current = setTimeout(() => {
      if (currentIndex + 1 < questions.length) {
        setCurrentIndex((prev) => prev + 1);
        setSelectedOption(null);
        setIsAnswerChecked(false);
      } else {
        // Завершение 15 вопросов: проверка строгого порога 12 из 15 (80%)
        if (nextScore >= PASSING_SCORE) {
          // УСПЕХ: 12+ баллов
          trackEvent("vacancy_interview_passed", {
            vacancy: vacancy.title,
            company: vacancy.company,
            score: nextScore,
            total: TOTAL_QUESTIONS,
            vacancy_id: vacancyId,
          });

          try {
            confetti({
              particleCount: 160,
              spread: 85,
              origin: { y: 0.55 },
              colors: ["#39ff14", "#ffe600", "#ff007f", "#00f0ff", "#ffffff"],
            });
          } catch {}

          generateCoverLetter(nextScore);
        } else {
          // ПРОВАЛ: меньше 12 баллов (< 80%)
          trackEvent("vacancy_interview_failed", {
            vacancy: vacancy.title,
            company: vacancy.company,
            score: nextScore,
            total: TOTAL_QUESTIONS,
            vacancy_id: vacancyId,
          });
          setStage("interview_failed");
        }
      }
    }, 650);
  };

  // Копирование письма и переход на hh.uz (доступно ТОЛЬКО после сдачи собеседования)
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

    trackEvent("vacancy_apply_clicked", {
      vacancy_id: vacancyId,
      title: vacancy.title,
      company: vacancy.company,
      url: directUrl,
      score,
    });

    showToast(
      isUz
        ? "✅ Xat nusxalandi! hh.uz sahifasi ochilmoqda..."
        : "✅ Письмо скопировано! Открываем вакансию на hh.uz..."
    );

    setTimeout(() => {
      if (typeof window !== "undefined") {
        window.open(directUrl, "_blank");
      }
      onClose();
    }, 400);
  };

  const handleJustCopy = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(coverLetter);
      }
      setCopied(true);
      showToast(isUz ? "Nusxa olindi!" : "Письмо скопировано в буфер!");
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const currentQ = questions[currentIndex];
  const primaryFailedSkill =
    missedSkills[0] || vacancy.tags?.[0] || "Frontend";

  const getDynamicLoadingInterviewText = () => {
    if (isUz) {
      switch (loadingStep) {
        case 0:
          return "🤖 Texlid vakansiya talablari va arxitekturasini o'rganmoqda...";
        case 1:
          return "🧠 Fundamental baza, xatolarni topish va 15 ta chuqur savol shakllantirilmoqda...";
        default:
          return "⚡ Qattiqqo'l texnik filtr va savollar kuchi tekshirilmoqda...";
      }
    }
    switch (loadingStep) {
      case 0:
        return "🤖 Техлид анализирует требования и стек работодателя...";
      case 1:
        return "🧠 Формируем 15 глубоких вопросов: база, архитектура, поиск багов...";
      default:
        return "⚡ Калибруем сложность и настраиваем жесткий фильтр отбора...";
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="interview-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-[2px]"
    >
      <div className="w-full max-w-[480px] bg-white border-[3.5px] border-black shadow-[8px_8px_0px_#000] overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* Шапка модального окна */}
        <div className="bg-manga-yellow border-b-[3.5px] border-black px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 bg-black text-manga-yellow border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_#000]">
              <Zap className="w-4.5 h-4.5 stroke-[2.5]" />
            </span>
            <div>
              <span className="block text-[10px] font-black uppercase tracking-wider text-zinc-900">
                {stage === "letter_ready" || stage === "generating_letter"
                  ? "AI COVER LETTER GENERATOR"
                  : isUz
                  ? "BOYEVOY INTERVYU • 15 TA SAVOL"
                  : "БОЕВОЕ СОБЕСЕДОВАНИЕ • 15 ВОПРОСОВ"}
              </span>
              <h2
                id="interview-modal-title"
                className="text-base font-black uppercase leading-none text-black"
              >
                {stage === "letter_ready"
                  ? isUz
                    ? "Kuzatuv xati"
                    : "Сопроводительное письмо"
                  : isUz
                  ? "Texnik suhbat"
                  : "Техническое собеседование"}
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
        <div className="p-4 bg-halftone space-y-3.5 overflow-y-auto">
          {/* Информационная плашка вакансии */}
          <div className="bg-white border-2 border-black p-2.5 shadow-[3px_3px_0px_#000] flex items-center justify-between gap-2">
            <div className="min-w-0">
              <span className="block text-[9px] font-black uppercase text-zinc-600">
                {isUz ? "Ish beruvchi va lavozim" : "Целевая вакансия"}
              </span>
              <h3 className="text-xs font-black text-black leading-tight truncate">
                {vacancy.title}
              </h3>
              <p className="text-[11px] font-bold text-zinc-700 flex items-center gap-1 mt-0.5 truncate">
                <Building2 className="w-3 h-3 stroke-[2.5] shrink-0" />
                <span className="truncate">{vacancy.company}</span>
              </p>
            </div>
            <span className="bg-manga-lime text-black border border-black px-2 py-0.5 text-[9px] font-black uppercase shrink-0">
              HH.UZ
            </span>
          </div>

          {/* 1. ЭКРАН ЗАГРУЗКИ 15 ВОПРОСОВ ОТ ИИ */}
          {stage === "loading_interview" && (
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
                        ? "🤖 AI texnik intervyu tayyorlamoqda..."
                        : "🤖 Техлид готовит технический тест..."}
                    </span>
                  </h3>
                  <p className="text-xs font-bold text-zinc-800 mt-1.5 min-h-[34px] flex items-center justify-center transition-all">
                    {getDynamicLoadingInterviewText()}
                  </p>
                </div>
              </div>

              {/* Скелетоны */}
              <div className="space-y-2 animate-pulse">
                <div className="h-4 bg-zinc-300 border-2 border-black w-2/5" />
                <div className="h-20 bg-zinc-200 border-2 border-black shadow-[2px_2px_0px_#000]" />
                <div className="h-10 bg-zinc-300 border-2 border-black shadow-[2px_2px_0px_#000]" />
                <div className="h-10 bg-zinc-300 border-2 border-black shadow-[2px_2px_0px_#000]" />
              </div>
            </div>
          )}

          {/* 2. ЭКРАН ПРОХОЖДЕНИЯ ТЕСТА (СТРОГО 1 ВОПРОС НА ЭКРАНЕ С ПРОГРЕСС-БАРОМ) */}
          {stage === "interview" && currentQ && (
            <div className="space-y-3 animate-in zoom-in-95 duration-150">
              {/* Прогресс-бар: Вопрос 1 из 15 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider">
                  <span className="bg-black text-manga-yellow px-2 py-0.5 border border-black text-[10px]">
                    {isUz ? "Savol" : "Вопрос"} {currentIndex + 1} {isUz ? "/" : "из"} {TOTAL_QUESTIONS}
                  </span>
                  <span className="inline-flex items-center gap-1 bg-white border border-black px-2 py-0.5 shadow-[1px_1px_0px_#000] text-[10px]">
                    <Sparkles className="w-3 h-3 text-manga-pink stroke-[2.5]" />
                    {isUz ? "To'g'ri:" : "Баллы:"} {score} / {TOTAL_QUESTIONS}
                  </span>
                </div>

                {/* Линия прогресса */}
                <div className="w-full h-3 bg-zinc-200 border-2 border-black shadow-[2px_2px_0px_#000] overflow-hidden">
                  <div
                    className="h-full bg-manga-lime transition-all duration-300"
                    style={{
                      width: `${((currentIndex + 1) / TOTAL_QUESTIONS) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Карточка одного текущего вопроса */}
              <div className="bg-white border-[3px] border-black p-3.5 shadow-[4px_4px_0px_#000] speech-bubble-left space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 bg-manga-cyan border border-black px-2 py-0.5 text-[9px] font-black uppercase">
                    <Zap className="w-3 h-3 stroke-[3]" />
                    {isUz ? "SENIOR INTERVIEWER" : "ТЕХЛИД / SENIOR"}
                  </span>
                  {currentQ.skill && (
                    <span className="bg-manga-yellow text-black text-[9px] font-black px-2 py-0.5 uppercase border border-black">
                      #{currentQ.skill}
                    </span>
                  )}
                </div>

                <p className="text-xs font-black text-black leading-snug">
                  {currentQ.question}
                </p>
              </div>

              {/* 4 Варианта ответа */}
              <div className="space-y-2">
                {currentQ.options.map((option, idx) => {
                  let buttonStyle =
                    "bg-white hover:bg-manga-yellow/30 text-black border-[2.5px] border-black shadow-[3px_3px_0px_#000]";

                  if (isAnswerChecked) {
                    if (idx === currentQ.correctAnswerIndex) {
                      buttonStyle =
                        "bg-manga-lime text-black border-[2.5px] border-black shadow-[3px_3px_0px_#000] font-black scale-[1.01]";
                    } else if (idx === selectedOption) {
                      buttonStyle =
                        "bg-red-500 text-white border-[2.5px] border-black shadow-[3px_3px_0px_#000] font-black";
                    } else {
                      buttonStyle =
                        "bg-zinc-100 text-zinc-400 border-2 border-zinc-300 opacity-60";
                    }
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleOptionClick(idx)}
                      disabled={isAnswerChecked}
                      className={`w-full text-left p-2.5 sm:p-3 text-xs font-bold transition-all flex items-start gap-2.5 active:translate-x-[1px] active:translate-y-[1px] cursor-pointer ${buttonStyle}`}
                    >
                      <span className="w-5 h-5 bg-black text-white text-[10px] font-black flex items-center justify-center shrink-0 border border-black mt-0.5">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="flex-1 leading-snug">{option}</span>
                      {isAnswerChecked && idx === currentQ.correctAnswerIndex && (
                        <CheckCircle2 className="w-4 h-4 text-black shrink-0 stroke-[2.5] mt-0.5" />
                      )}
                      {isAnswerChecked &&
                        idx === selectedOption &&
                        idx !== currentQ.correctAnswerIndex && (
                          <XCircle className="w-4 h-4 text-white shrink-0 stroke-[2.5] mt-0.5" />
                        )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. ЭКРАН ПРОВАЛА: МЕНЬШЕ 12 ИЗ 15 (ПЕРЕХОД К COVER LETTER И HH.UZ СТРОГО ЗАБЛОКИРОВАН) */}
          {stage === "interview_failed" && (
            <div className="space-y-4 py-2 animate-in zoom-in-95 duration-200">
              <div className="bg-red-500 text-white border-[3.5px] border-black p-5 shadow-[6px_6px_0px_#000] text-center space-y-3.5 relative overflow-hidden bg-halftone-dense">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-white border-2 border-black shadow-[3px_3px_0px_#000] animate-shake">
                  <XCircle className="w-8 h-8 text-red-600 stroke-[2.5]" />
                </div>

                <div>
                  <span className="inline-block bg-black text-manga-yellow text-[10px] font-black px-2.5 py-0.5 uppercase tracking-wider mb-1.5 border border-black">
                    {isUz ? "QATTIQQO'L FILTRDAN O'TOLMADINGIZ" : "ЖЕСТКИЙ ФИЛЬТР НЕ ПРОЙДЕН"}
                  </span>
                  <h3 className="text-lg font-black uppercase text-white leading-tight">
                    {isUz
                      ? `Suhbatdan o'ta olmadingiz (${score}/${TOTAL_QUESTIONS})`
                      : `Собеседование провалено (${score}/${TOTAL_QUESTIONS})`}
                  </h3>
                  <div className="mt-2.5 bg-white border-2 border-black p-3 shadow-[2px_2px_0px_#000] text-black">
                    <p className="text-xs font-black leading-snug">
                      {isUz
                        ? `Suhbatdan o'ta olmadingiz (${score}/${TOTAL_QUESTIONS}). Vakansiyadagi talab qilingan texnologiyalarni (${primaryFailedSkill}) yaxshilab o'rganishingiz kerak.`
                        : `Собеседование провалено (${score}/${TOTAL_QUESTIONS}). Вам нужно подтянуть технологии из этой вакансии перед откликом.`}
                    </p>
                  </div>
                </div>

                {/* Плашка результата с порогом 12 из 15 */}
                <div className="bg-white text-black border-2 border-black p-2.5 shadow-[2px_2px_0px_#000] flex items-center justify-between">
                  <div className="text-left">
                    <span className="block text-[9px] font-black uppercase text-zinc-600">
                      {isUz ? "Sizning natijangiz" : "Ваш результат"}
                    </span>
                    <span className="text-xl font-black text-red-600">
                      {score} / {TOTAL_QUESTIONS}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[9px] font-black uppercase text-zinc-600">
                      {isUz ? "Kerakli minimum (80%)" : "Минимум для сдачи (80%)"}
                    </span>
                    <span className="text-sm font-black text-black">
                      {PASSING_SCORE} / {TOTAL_QUESTIONS}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 pt-1 text-black">
                  {/* Кнопка в Дерево навыков */}
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      router.push("/tree");
                    }}
                    className="w-full py-3.5 px-4 bg-manga-lime hover:bg-[#34d399] text-black border-[3px] border-black font-black text-xs uppercase tracking-wider shadow-[4px_4px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <TreePine className="w-4 h-4 stroke-[2.5]" />
                    <span>
                      {isUz
                        ? "Ko'nikmalar daraxtiga o'tish"
                        : "Подтянуть в Дереве Навыков 🌳"}
                    </span>
                  </button>

                  {/* Кнопка повторить тест */}
                  <button
                    type="button"
                    onClick={() => loadInterview()}
                    className="w-full py-2.5 px-3 bg-manga-yellow hover:bg-yellow-400 text-black border-2 border-black font-black text-xs uppercase tracking-wider shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>
                      {isUz ? "Qayta urinib ko'rish" : "Попробовать снова 🔄"}
                    </span>
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
            </div>
          )}

          {/* 4. ЭКРАН ГЕНЕРАЦИИ СОПРОВОДИТЕЛЬНОГО ПИСЬМА (ПОСЛЕ 12+ ИЗ 15) */}
          {stage === "generating_letter" && (
            <div className="space-y-4 py-4 animate-in zoom-in-95 duration-200">
              <div className="bg-manga-lime border-[3.5px] border-black p-5 shadow-[6px_6px_0px_#000] text-center space-y-3 relative overflow-hidden bg-halftone-dense">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-white border-2 border-black shadow-[3px_3px_0px_#000] animate-bounce">
                  <Award className="w-8 h-8 text-black stroke-[2.5]" />
                </div>
                <div>
                  <span className="inline-block bg-black text-manga-yellow text-[10px] font-black px-2.5 py-0.5 uppercase tracking-wider mb-1">
                    {isUz ? "INTERVYU MUVAFFAQIYATLI TOPSHIRILDI!" : "СОБЕСЕДОВАНИЕ УСПЕШНО ПРОЙДЕНО!"}
                  </span>
                  <h3 className="text-lg font-black uppercase text-black leading-tight">
                    {isUz
                      ? `Ajoyib natija: ${score} / ${TOTAL_QUESTIONS} (80%+)`
                      : `Отличный результат: ${score} / ${TOTAL_QUESTIONS} (80%+)`}
                  </h3>
                  <p className="text-xs font-bold text-zinc-900 mt-2 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin stroke-[3]" />
                    <span>
                      {isUz
                        ? "AI ushbu natijangizni kiritgan holda kuchli rezyume xati yozmoqda..."
                        : "ИИ формирует сильное сопроводительное письмо с подтверждением баллов..."}
                    </span>
                  </p>
                </div>
              </div>

              <div className="space-y-2 animate-pulse">
                <div className="h-4 bg-zinc-300 border-2 border-black w-2/5" />
                <div className="h-24 bg-zinc-200 border-2 border-black shadow-[2px_2px_0px_#000]" />
              </div>
            </div>
          )}

          {/* 5. ЭКРАН ГОТОВОГО ПИСЬМА: ДОСТУПЕН ПЕРЕХОД НА HH.UZ */}
          {stage === "letter_ready" && (
            <div className="space-y-3.5 animate-in zoom-in-95 duration-150">
              {/* Бейдж подтверждения квалификации */}
              <div className="bg-manga-lime border-2 border-black p-2.5 shadow-[2px_2px_0px_#000] flex items-center justify-between">
                <span className="text-[11px] font-black uppercase flex items-center gap-1 text-black">
                  <CheckCircle2 className="w-4 h-4 stroke-[3]" />
                  {isUz
                    ? `Texnik suhbat topshirildi: ${score}/${TOTAL_QUESTIONS}`
                    : `Техническое собеседование: ${score}/${TOTAL_QUESTIONS}`}
                </span>
                <span className="bg-black text-white text-[9px] font-black px-2 py-0.5 uppercase">
                  VERIFIED 80%+
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 text-zinc-900">
                  <FileText className="w-3.5 h-3.5 stroke-[2.5]" />
                  {isUz
                    ? "Tayyor kuzatuv xati:"
                    : "Готовое сопроводительное письмо:"}
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

              {/* Текст письма */}
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
                    ? "Tugmani bosganingizda xat nusxalanadi va vakansiya sahifasi ochiladi."
                    : "При нажатии на кнопку письмо скопируется, и откроется страница вакансии на hh.uz."}
                </p>
              </div>

              {/* Кнопка перехода на hh.uz */}
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

/**
 * Локальный резервный пул из 15 глубоких и сложных вопросов технического собеседования
 */
function getFallbackQuestions(isUz: boolean, fallbackSkill?: string): InterviewQuestionItem[] {
  if (isUz) {
    return [
      {
        question: "JavaScript Event Loop-da Microtask (Promise, queueMicrotask) va Macrotask (setTimeout) qanday tartibda bajariladi?",
        options: [
          "Barcha macrotasklar bajarilgandan keyin microtasklar ishga tushadi",
          "Har bir macrotask tugagach, microtask navbatidagi barcha vazifalar to'liq bo'shatiladi",
          "Ular parallel ravishda turli oqimlarda (threads) bir vaqtda ishlaydi",
          "Faqat bitta microtask bajariladi, qolgani keyingi renderga qoldiriladi",
        ],
        correctAnswerIndex: 1,
        skill: "JavaScript Fundamentals",
      },
      {
        question: "Quyidagi kod natijasi nima bo'ladi: console.log(typeof null, null instanceof Object, NaN === NaN)?",
        options: [
          "'object', false, false",
          "'null', false, true",
          "'object', true, false",
          "'undefined', false, false",
        ],
        correctAnswerIndex: 0,
        skill: "JavaScript Core",
      },
      {
        question: "React-da to'g'ridan-to'g'ri state-ni o'zgartirish (masalan: state.items.push(newItem)) nima sababdan jiddiy xato hisoblanadi?",
        options: [
          "JavaScript xatolik chiqarib dasturni to'xtatadi",
          "Obyekt havolasi (reference) o'zgarmagani uchun React qayta render qilmaydi va PureComponent/memo buziladi",
          "Barcha boshqa komponentlarning ma'lumotlari o'chib ketadi",
          "Faqat TypeScript-da xato beradi, JavaScript-da to'g'ri ishlaydi",
        ],
        correctAnswerIndex: 1,
        skill: "React Architecture",
      },
      {
        question: "React-da ro'yxatlarni chizishda 'key' sifatida massiv indeksini (index) ishlatish qachon jiddiy muammoga olib keladi?",
        options: [
          "Faqat ro'yxat 100 tadan ortiq bo'lsa",
          "Elementlar filtrlangan, o'chirilgan yoki ularning tartibi o'zgarganda ichki state noto'g'ri elementlarga bog'lanib qoladi",
          "Brauzerda xotira to'lib ketishiga (memory leak) olib keladi",
          "Indeks ishlatish har doim tavsiya etiladi, hech qanday muammo yo'q",
        ],
        correctAnswerIndex: 1,
        skill: "React Reconciliation",
      },
      {
        question: "Quyidagi kodda xatolik nimada: for (var i = 0; i < 3; i++) { setTimeout(() => console.log(i), 100); }?",
        options: [
          "Sintaksis xatosi bor, kod ishlamaydi",
          "var funksiya ko'lamiga (function scope) ega bo'lgani uchun barcha taymerlar 3 chiqarguncha bir xil qiymatni oladi (let ishlatish kerak)",
          "setTimeout ichida console.log chaqirib bo'lmaydi",
          "Kod 0, 1, 2 ni to'g'ri chiqaradi",
        ],
        correctAnswerIndex: 1,
        skill: "Code Debugging",
      },
      {
        question: "React komponentida quyidagi holatda nima sodir bo'ladi: setCount(count + 1); setCount(count + 1);?",
        options: [
          "count qiymati 2 ga oshadi",
          "Ikkala chaqiruv ham joriy renderdagi bir xil count qiymatidan foydalangani uchun count faqat 1 ga oshadi (batching)",
          "Cheksiz render sikli (infinite loop) yuzaga keladi",
          "React xatolik tashlaydi",
        ],
        correctAnswerIndex: 1,
        skill: "State Management",
      },
      {
        question: "useEffect ichida tarmoq so'rovi (fetch) yuborilganda xotira sizib chiqishi (memory leak) va race condition oldini olish uchun nima qilish kerak?",
        options: [
          "useEffect-dan butunlay voz kechish",
          "Cleanup funksiyasida AbortController.abort() orqali so'rovni bekor qilish",
          "Har doim async/await-ni to'g'ridan-to'g'ri useEffect argumentida chaqirish",
          "Brauzer keshini tozalash",
        ],
        correctAnswerIndex: 1,
        skill: "React Lifecycle",
      },
      {
        question: "Next.js App Router-da Server Component-dan Client Component-ga props uzatishda qanday cheklov mavjud?",
        options: [
          "Faqat raqamlarni uzatish mumkin",
          "Props seriyalashtiriladigan (serializable, masalan JSON) bo'lishi kerak, funksiyalar va class nusxalarini to'g'ridan-to'g'ri uzatib bo'lmaydi",
          "Props uzatish umuman mumkin emas",
          "Faqat Redux orqali uzatish kerak",
        ],
        correctAnswerIndex: 1,
        skill: "Next.js Architecture",
      },
      {
        question: "Next.js-da 'Hydration Mismatch' xatosi nima sababdan yuzaga keladi?",
        options: [
          "Faqat CSS fayli yuklanmaganda",
          "Serverda yaratilgan boshlang'ich HTML va mijoz brauzerida dastlabki render qilingan DOM o'rtasida farq bo'lsa (masalan, typeof window)",
          "Faqat ma'lumotlar bazasi o'chib qolganda",
          "Brauzer eskirgan bo'lsa",
        ],
        correctAnswerIndex: 1,
        skill: "SSR & Hydration",
      },
      {
        question: "Sahifada 10 000 ta murakkab elementdan iborat ro'yxatni brauzer qotib qolmasdan (laglarsiz) ko'rsatish uchun qaysi texnika zarur?",
        options: [
          "Barcha elementlarni darhol DOM-ga joylash va display: none qilish",
          "Virtualizatsiya (Virtualization / Windowing): faqat ekranda ko'rinib turgan elementlarni render qilish",
          "Elementlarni base64 formatiga o'tkazish",
          "setInterval orqali sekundiga 1 tadan render qilish",
        ],
        correctAnswerIndex: 1,
        skill: "Performance Optimization",
      },
      {
        question: "CSS-da z-index: 99999 berilgan element nima sababdan z-index: 1 bo'lgan element ostida qolib ketishi mumkin?",
        options: [
          "z-index faqat 100 gacha sonlarni qo'llab-quvvatlaydi",
          "Element opacity < 1, transform yoki filter sababli yangi Stacking Context (qatlamlar konteksti) ichida qolgan",
          "CSS keshlanib qolgan",
          "Faqat display: flex ishlatilganda z-index ishlamaydi",
        ],
        correctAnswerIndex: 1,
        skill: "CSS Stacking Context",
      },
      {
        question: "CORS xatoligida brauzer yuboradigan 'Preflight request' qaysi HTTP metodidan foydalanadi va nima maqsadda yuboriladi?",
        options: [
          "HEAD metodi, fayl hajmini bilish uchun",
          "OPTIONS metodi, server ruxsat bergan metodlar va sarlavhalarni (headers) tekshirish uchun",
          "GET metodi, token olish uchun",
          "POST metodi, ma'lumotlarni tekshirish uchun",
        ],
        correctAnswerIndex: 1,
        skill: "Network & Security",
      },
      {
        question: "XSS (Cross-Site Scripting) hujumlaridan himoyalanish uchun React qanday standart mexanizmdan foydalanadi?",
        options: [
          "Barcha ma'lumotlarni shifrlaydi",
          "JSX ichidagi qiymatlarni avtomatik stringga aylantirib ekranlashtiradi (escaping) va dangerouslySetInnerHTML-siz xavfli scriptlarni bajarmaydi",
          "Tarmoqni uzib qo'yadi",
          "Faqat HTTPS orqali so'rov yuborishga ruxsat beradi",
        ],
        correctAnswerIndex: 1,
        skill: "Web Security",
      },
      {
        question: "Git-da 'git merge' va 'git rebase' o'rtasidagi asosiy farq nima?",
        options: [
          "Farqi yo'q, ikkalasi ham bir xil ishlaydi",
          "Merge alohida merge-commit yaratib tarixni saqlaydi, rebase esa joriy commitlarni maqsadli tarmoq ustiga qayta yozib to'g'ri chiziqli tarix hosil qiladi",
          "Rebase barcha fayllarni o'chirib tashlaydi",
          "Merge faqat lokal ishlaydi, rebase esa faqat serverda",
        ],
        correctAnswerIndex: 1,
        skill: "Git & Collaboration",
      },
      {
        question: "SPA (Single Page Application) da xotira sizib chiqishining (Memory Leak) eng keng tarqalgan sababi nima?",
        options: [
          "CSS fayllarining kattaligi",
          "Komponent unmount bo'lganda window/document-ga qo'shilgan event listenerlar, interval yoki websocketlarni tozalamaslik",
          "O'zgaruvchilarga const ishlatish",
          "JSON.stringify dan ko'p foydalanish",
        ],
        correctAnswerIndex: 1,
        skill: fallbackSkill || "Architecture & Memory",
      },
    ];
  }

  // Russian fallback: 15 глубоких и сложных вопросов
  return [
    {
      question: "В каком порядке Event Loop в браузере выполняет Microtasks (Promise, queueMicrotask) и Macrotasks (setTimeout, setInterval)?",
      options: [
        "Сначала выполняются все макрозадачи, а микрозадачи — только перед закрытием страницы",
        "После выполнения текущей макрозадачи очередь микрозадач вычищается полностью до перехода к следующей макрозадаче или рендеру",
        "Микрозадачи и макрозадачи выполняются параллельно в разных потоках CPU",
        "Выполняется строго по одной микрозадаче на каждые пять макрозадач",
      ],
      correctAnswerIndex: 1,
      skill: "JavaScript Fundamentals",
    },
    {
      question: "Что выведет код: console.log(typeof null, null instanceof Object, NaN === NaN)?",
      options: [
        "'object', false, false",
        "'null', false, true",
        "'object', true, false",
        "'undefined', false, false",
      ],
      correctAnswerIndex: 0,
      skill: "JavaScript Core",
    },
    {
      question: "Почему прямая мутация состояния в React (например, state.list.push(item)) считается критической ошибкой?",
      options: [
        "JavaScript аварийно завершит выполнение скрипта",
        "Ссылка на объект не изменяется, поэтому поверхностное сравнение (shallow compare) в React и memo не зафиксирует изменений и пропустит рендер",
        "Это приведет к удалению всех соседних компонентов",
        "Это ошибка только в TypeScript, в чистом JavaScript это рекомендуемый паттерн",
      ],
      correctAnswerIndex: 1,
      skill: "React Architecture",
    },
    {
      question: "К какому багу приводит использование индекса массива (index) в качестве свойства key при рендере динамического списка?",
      options: [
        "Падению браузера из-за переполнения стека",
        "При удалении, фильтрации или сортировке элементов внутреннее состояние (uncontrolled inputs, state) будет привязано к неверным DOM-узлам",
        "Ошибке валидации HTML5 в браузере",
        "К замедлению компиляции Next.js",
      ],
      correctAnswerIndex: 1,
      skill: "React Reconciliation",
    },
    {
      question: "Найдите ошибку в коде: for (var i = 0; i < 3; i++) { setTimeout(() => console.log(i), 50); }. Что выведется и почему?",
      options: [
        "Выведется 0, 1, 2, так как setTimeout всегда сохраняет замыкание переменной",
        "Выведется 3, 3, 3, так как var имеет функциональную область видимости, и все коллбэки захватывают одну и ту же мутированную переменную (нужен let)",
        "Код выбросит ReferenceError",
        "Таймеры не сработают без указания третьего аргумента",
      ],
      correctAnswerIndex: 1,
      skill: "Code Debugging",
    },
    {
      question: "В функциональном компоненте React вызвано: setCount(count + 1); setCount(count + 1);. На сколько увеличится count в следующем рендере?",
      options: [
        "На 2, так как функция вызвана дважды",
        "На 1, так как оба вызова используют одно и то же значение count из текущего замыкания рендера (для аккумуляции нужен functional update: prev => prev + 1)",
        "Произойдет бесконечный цикл рендеров",
        "React выбросит исключение в Strict Mode",
      ],
      correctAnswerIndex: 1,
      skill: "State Management",
    },
    {
      question: "Как в хуке useEffect корректно предотвратить race condition и утечку памяти при выполнении асинхронного fetch-запроса?",
      options: [
        "Использовать синхронный XMLHttpRequest",
        "В cleanup-функции хука вызвать abort() у экземпляра AbortController (или использовать флаг отмены)",
        "Сделать сам коллбэк useEffect асинхронной функцией async () => {}",
        "Удалить зависимости из массива dependencies",
      ],
      correctAnswerIndex: 1,
      skill: "React Lifecycle",
    },
    {
      question: "Какое строгое ограничение накладывает передача props от Server Component к Client Component в Next.js (App Router)?",
      options: [
        "Можно передавать только примитивы типа number и boolean",
        "Props должны быть сериализуемыми (например, JSON-совместимыми); нельзя передавать функции, классы и несериализуемые дескрипторы",
        "Передавать props между серверными и клиентскими компонентами запрещено",
        "Передача возможна только через глобальный store Redux",
      ],
      correctAnswerIndex: 1,
      skill: "Next.js Architecture",
    },
    {
      question: "Из-за чего в приложениях на Next.js / SSR возникает ошибка 'Hydration Mismatch' (Text content did not match)?",
      options: [
        "Из-за отсутствия favicon на сервере",
        "Начальный HTML, сгенерированный сервером, не совпадает с первым деревом рендера на клиенте (например, использование window, Date.now() или Math.random() до монтирования)",
        "Из-за сбоя в базе данных PostgreSQL",
        "Из-за отключенного JavaScript в браузере",
      ],
      correctAnswerIndex: 1,
      skill: "SSR & Hydration",
    },
    {
      question: "Какая архитектурная техника позволяет плавно отображать список из 20 000 сложных карточек товаров без зависания DOM?",
      options: [
        "Отрендерить все 20 000 элементов и скрыть их через display: none",
        "Виртуализация списков (Windowing / Virtual List), когда в реальном DOM отрисовываются только элементы, видимые в текущем viewport",
        "Перевод всех карточек в формат SVG",
        "Рендер элементов через setTimeout с задержкой 1 мс",
      ],
      correctAnswerIndex: 1,
      skill: "Performance Optimization",
    },
    {
      question: "Почему элемент с CSS-свойством z-index: 99999 может отображаться ПОД элементом с z-index: 1?",
      options: [
        "z-index ограничен максимальным значением 10 000",
        "Элемент находится внутри родителя, создавшего изолированный Stacking Context (например, через opacity < 1, transform, filter или contain)",
        "В браузере включен темный режим",
        "Свойство z-index работает только в сочетании с display: table",
      ],
      correctAnswerIndex: 1,
      skill: "CSS Stacking Context",
    },
    {
      question: "Какой HTTP-метод браузер отправляет в качестве Preflight-запроса при сложном кросс-доменном CORS-запросе и зачем?",
      options: [
        "HEAD для проверки времени ответа сервера",
        "OPTIONS для проверки разрешенных методов, заголовков и источника (Origin) на стороне сервера перед отправкой основного запроса",
        "GET для предварительного прогрева DNS",
        "POST с пустым телом для авторизации",
      ],
      correctAnswerIndex: 1,
      skill: "Network & Security",
    },
    {
      question: "Как React по умолчанию защищает приложения от классических атак Cross-Site Scripting (XSS)?",
      options: [
        "Автоматически шифрует трафик с помощью RSA-2048",
        "Автоматически экранирует (escapes) любые строки, вставляемые в JSX-выражения, предотвращая инъекцию исполняемых скриптов (если не используется dangerouslySetInnerHTML)",
        "Блокирует доступ ко всем внешним API",
        "Запрещает использовать форму <input>",
      ],
      correctAnswerIndex: 1,
      skill: "Web Security",
    },
    {
      question: "В чем ключевое практическое отличие между git merge и git rebase при интеграции изменений из ветки feature в main?",
      options: [
        "Разницы нет, git rebase — устаревший алиас для merge",
        "Merge создает отдельный коммит слияния и сохраняет точную хронологию веток; rebase переносит коммиты на верхушку целевой ветки, создавая плоскую линейную историю",
        "Rebase навсегда стирает изменения авторов",
        "Merge работает только локально, а rebase только на GitHub",
      ],
      correctAnswerIndex: 1,
      skill: "Git & Collaboration",
    },
    {
      question: "Что является наиболее распространенной причиной утечек памяти (Memory Leaks) в Single Page Applications (React/Next.js)?",
      options: [
        "Большой объем CSS-стилей в проекте",
        "Неудаленные обработчики событий (window.addEventListener), активные setInterval или незакрытые WebSocket-соединения после размонтирования компонента",
        "Использование ключевого слова const вместо let",
        "Применение console.log на этапе сборки",
      ],
      correctAnswerIndex: 1,
      skill: fallbackSkill || "Architecture & Memory",
    },
  ];
}
