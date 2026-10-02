"use client";

import { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import {
  AlertTriangle,
  Award,
  Bot,
  CheckCircle2,
  HelpCircle,
  Loader2,
  Sparkles,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import { useLanguage } from "@/utils/translations";

export interface QuestionItem {
  question: string;
  options: string[];
  correctAnswerIndex: number;
}

export interface QuizQuestion {
  skill: string;
  question?: string;
  options?: readonly string[] | string[];
  correctAnswer?: string;
  correctAnswerIndex?: number;
}

interface QuizModalProps {
  skill?: string | null;
  quiz?: QuizQuestion | null;
  onClose: () => void;
  onSuccess: (skill: string) => void;
}

export default function QuizModal({
  skill,
  quiz,
  onClose,
  onSuccess,
}: QuizModalProps) {
  const { lang, t } = useLanguage();
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingStep, setLoadingStep] = useState<number>(0);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState<boolean>(false);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  const activeSkill = skill || quiz?.skill || null;

  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    "https://skilltree-backend-swuh.onrender.com";

  // Динамическая ротация статуса загрузки для живого UX
  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setLoadingStep((prev) => (prev + 1) % 3);
    }, 1100);
    return () => clearInterval(interval);
  }, [loading]);

  // Загрузка 10 вопросов с бэкенда (Gemini 2.5 Flash)
  useEffect(() => {
    if (!activeSkill) return;

    let isMounted = true;
    setLoading(true);
    setCurrentIndex(0);
    setCorrectCount(0);
    setSelectedOption(null);
    setIsAnswerChecked(false);
    setIsFinished(false);

    const controller = new AbortController();

    async function fetchAi10Questions() {
      try {
        const response = await fetch(
          `${apiUrl}/api/questions/generate?skill=${encodeURIComponent(
            activeSkill as string
          )}&language=${encodeURIComponent(lang)}`,
          {
            signal: controller.signal,
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }

        const data = await response.json();

        if (isMounted && data && Array.isArray(data.questions) && data.questions.length > 0) {
          setQuestions(data.questions.slice(0, 10));
          setLoading(false);
          return;
        }
      } catch (err: unknown) {
        if ((err as Error)?.name === "AbortError") return;
        console.warn("⚠️ [QuizModal] Ошибка загрузки 10 вопросов от AI, подключаем резерв:", err);
      }

      // Если запрос не удался, используем локальный резервный пул
      if (isMounted) {
        const fallback10: QuestionItem[] = Array.from({ length: 10 }).map((_, i) => ({
          question:
            lang === "uz"
              ? `'${activeSkill}' bo'yicha ${i + 1}-amaliy test savoli. Quyidagilardan qaysi biri to'g'ri?`
              : `Практический вопрос ${i + 1} по технологии ${activeSkill}. Какое утверждение верно?`,
          options:
            lang === "uz"
              ? [
                  `${activeSkill} arxitekturasining ${i + 1}-standarti`,
                  "Faqat CSS uslubi",
                  "Faqat HTML kodi",
                  "Bunday tushuncha mavjud emas",
                ]
              : [
                  `Ключевой принцип архитектуры ${activeSkill} #${i + 1}`,
                  "Исключительно стили оформления",
                  "Устаревший тег разметки",
                  "Не существует в стандарте",
                ],
          correctAnswerIndex: 0,
        }));

        setQuestions(fallback10);
        setLoading(false);
      }
    }

    fetchAi10Questions();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [activeSkill, apiUrl, lang]);

  if (!activeSkill) return null;

  const currentQ = questions[currentIndex];
  const isPassed = correctCount >= 8;

  const handleOptionClick = (idx: number) => {
    if (isAnswerChecked || !currentQ) return;

    setSelectedOption(idx);
    setIsAnswerChecked(true);

    const isCorrect = idx === currentQ.correctAnswerIndex;
    const nextCorrectCount = isCorrect ? correctCount + 1 : correctCount;

    if (isCorrect) {
      setCorrectCount(nextCorrectCount);
    }

    // Автоматический плавный переход к следующему вопросу через 800мс
    setTimeout(() => {
      if (currentIndex + 1 < questions.length) {
        setCurrentIndex((prev) => prev + 1);
        setSelectedOption(null);
        setIsAnswerChecked(false);
      } else {
        setIsFinished(true);
        // Если экзамен сдан (8+ из 10), запускаем салют
        if (nextCorrectCount >= 8) {
          try {
            confetti({
              particleCount: 160,
              spread: 90,
              origin: { y: 0.55 },
              colors: ["#39ff14", "#ffe600", "#ff007f", "#00f0ff", "#ffffff"],
            });
          } catch (e) {
            console.warn("Confetti error:", e);
          }
        }
      }
    }, 800);
  };

  const handleClaimSuccess = () => {
    onSuccess(activeSkill);
    onClose();
  };

  const getDynamicLoadingText = () => {
    if (lang === "uz") {
      switch (loadingStep) {
        case 0:
          return "🤖 Gemini 2.5 Flash neyrotarmog'iga ulanmoqda...";
        case 1:
          return "🧠 10 ta qiyin imtihon savoli tuzilmoqda...";
        default:
          return "⚙️ Murakkablik darajasi va variantlar tekshirilmoqda...";
      }
    }
    switch (loadingStep) {
      case 0:
        return "🤖 Подключаемся к нейросети Gemini 2.5 Flash...";
      case 1:
        return "🧠 Генерируем 10 хардкорных практических вопросов...";
      default:
        return "⚙️ Калибруем сложность и проверяем дистракторы...";
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="quiz-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-[2px]"
    >
      <div className="w-full max-w-[440px] bg-white border-[3.5px] border-black shadow-[8px_8px_0px_#000] overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* Верхняя шапка модалки */}
        <div className="bg-manga-yellow border-b-[3.5px] border-black px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 bg-black text-manga-yellow border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_#000]">
              <HelpCircle className="w-4.5 h-4.5 stroke-[2.5]" />
            </span>
            <div>
              <span className="block text-[10px] font-black uppercase tracking-wider text-zinc-900">
                {t.quizExamBadge}
              </span>
              <h2
                id="quiz-modal-title"
                className="text-base font-black uppercase leading-none text-black"
              >
                {t.quizConfirmTitle} {activeSkill}
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

        {/* Тело модалки с прокруткой при необходимости */}
        <div className="p-4 bg-halftone space-y-4 overflow-y-auto">
          {/* 1. СОСТОЯНИЕ ДИНАМИЧЕСКОЙ ЗАГРУЗКИ */}
          {loading && (
            <div className="space-y-4 py-3">
              <div className="bg-manga-cyan border-[3px] border-black p-4 shadow-[4px_4px_0px_#000] text-center space-y-3 relative overflow-hidden">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-white border-2 border-black shadow-[3px_3px_0px_#000] animate-bounce">
                  <Bot className="w-8 h-8 text-black stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase text-black flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin shrink-0 stroke-[3]" />
                    <span>{t.quizAiGenerating}</span>
                  </h3>
                  <p className="text-xs font-bold text-zinc-800 mt-1 min-h-[32px] flex items-center justify-center transition-all">
                    {getDynamicLoadingText()}
                  </p>
                </div>
              </div>

              {/* Скелетоны нео-брутализма */}
              <div className="space-y-2.5 animate-pulse">
                <div className="h-4 bg-zinc-300 border-2 border-black w-1/3" />
                <div className="h-16 bg-zinc-200 border-[2.5px] border-black shadow-[2px_2px_0px_#000]" />
                <div className="h-11 bg-zinc-200 border-[2.5px] border-black shadow-[2px_2px_0px_#000]" />
                <div className="h-11 bg-zinc-200 border-[2.5px] border-black shadow-[2px_2px_0px_#000]" />
                <div className="h-11 bg-zinc-200 border-[2.5px] border-black shadow-[2px_2px_0px_#000]" />
              </div>
            </div>
          )}

          {/* 2. ЭКРАН ЗАВЕРШЕНИЯ: ПОБЕДА (>= 8) ИЛИ ПОРАЖЕНИЕ (<= 7) */}
          {!loading && isFinished && (
            <div className="space-y-4 py-1 animate-in zoom-in-95 duration-200">
              {isPassed ? (
                /* ПОБЕДА (8, 9 или 10 правильных) */
                <div className="bg-manga-lime border-[3.5px] border-black p-5 shadow-[6px_6px_0px_#000] text-center space-y-3.5">
                  <div className="inline-flex items-center justify-center w-14 h-14 bg-white border-2 border-black shadow-[3px_3px_0px_#000] animate-bounce">
                    <Award className="w-8 h-8 text-black stroke-[2.5]" />
                  </div>

                  <div>
                    <span className="inline-block bg-black text-manga-yellow text-[10px] font-black px-2.5 py-0.5 uppercase tracking-wider mb-1">
                      {t.quizPassingNotice}
                    </span>
                    <h3 className="text-xl font-black uppercase text-black leading-tight">
                      {t.quizPassedTitle}
                    </h3>
                    <p className="text-xs font-bold text-zinc-800 mt-1 leading-snug">
                      {t.quizPassedDesc}
                    </p>
                  </div>

                  {/* Плашка результата */}
                  <div className="bg-white border-2 border-black p-2.5 shadow-[3px_3px_0px_#000]">
                    <span className="block text-[10px] font-black uppercase text-zinc-600">
                      {t.quizCorrectScore}
                    </span>
                    <span className="text-2xl font-black text-black">
                      {correctCount} / 10
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleClaimSuccess}
                    className="w-full py-3.5 px-4 bg-black text-manga-lime border-[3px] border-black font-black text-sm uppercase tracking-wider shadow-[4px_4px_0px_#000] hover:bg-zinc-900 active:translate-x-[2px] active:translate-y-[2px] transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5 text-manga-lime stroke-[2.5]" />
                    <span>{t.quizSaveSkillBtn}</span>
                  </button>
                </div>
              ) : (
                /* ПОРАЖЕНИЕ (7 и меньше правильных ответов) */
                <div className="bg-red-500 text-white border-[3.5px] border-black p-5 shadow-[6px_6px_0px_#000] text-center space-y-3.5">
                  <div className="inline-flex items-center justify-center w-14 h-14 bg-white border-2 border-black shadow-[3px_3px_0px_#000] animate-shake">
                    <XCircle className="w-8 h-8 text-red-600 stroke-[2.5]" />
                  </div>

                  <div>
                    <h3 className="text-lg font-black uppercase leading-tight text-white drop-shadow-[2px_2px_0px_#000]">
                      {t.quizFailedTitle}
                    </h3>
                    <div className="mt-2 bg-black text-yellow-300 border-2 border-white p-2.5 shadow-[3px_3px_0px_#000]">
                      <p className="text-xs font-black uppercase tracking-wide">
                        {t.quizFailedDesc}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white text-black border-2 border-black p-2.5 shadow-[3px_3px_0px_#000]">
                    <span className="block text-[10px] font-black uppercase text-zinc-600">
                      {t.quizFailedScoreText}
                    </span>
                    <span className="text-2xl font-black text-red-600">
                      {correctCount} / 10
                    </span>
                    <span className="block text-[11px] font-bold text-zinc-700 mt-0.5">
                      {t.quizFailedRequiredText}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full py-3 px-4 bg-white text-black border-[3px] border-black font-black text-xs uppercase tracking-wider shadow-[4px_4px_0px_#000] hover:bg-zinc-100 active:translate-x-[2px] active:translate-y-[2px] transition-all cursor-pointer"
                  >
                    {t.quizFailedCloseBtn}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 3. ПРОЦЕСС ЭКЗАМЕНА (10 ВОПРОСОВ) */}
          {!loading && !isFinished && currentQ && (
            <div className="space-y-3.5">
              {/* Индикатор прогресса: от 1 / 10 до 10 / 10 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider">
                  <span className="bg-black text-manga-yellow px-2 py-0.5 border border-black text-[10px]">
                    {t.quizQuestionLabel} {currentIndex + 1} / 10
                  </span>
                  <span className="inline-flex items-center gap-1 bg-white border border-black px-2 py-0.5 shadow-[1px_1px_0px_#000] text-[10px]">
                    <Sparkles className="w-3 h-3 text-manga-pink stroke-[2.5]" />
                    {t.quizCorrectScore} {correctCount} / 10
                  </span>
                </div>

                {/* Нео-бруталистская полоса прогресса */}
                <div className="w-full h-3 bg-zinc-200 border-2 border-black shadow-[2px_2px_0px_#000] overflow-hidden">
                  <div
                    className="h-full bg-manga-lime transition-all duration-300"
                    style={{
                      width: `${((currentIndex + 1) / 10) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Вопрос в речевом пузыре */}
              <div className="bg-white border-[3px] border-black p-4 shadow-[4px_4px_0px_#000] speech-bubble-left">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="inline-flex items-center gap-1 bg-manga-cyan border border-black px-2 py-0.5 text-[9px] font-black uppercase">
                    <Zap className="w-3 h-3 stroke-[3]" />
                    {t.quizMentorQuestion}
                  </span>
                  <span className="bg-black text-manga-yellow text-[9px] font-black px-2 py-0.5 uppercase tracking-wider border border-black">
                    {t.quizAiBadge}
                  </span>
                </div>
                <p className="text-sm font-black text-black leading-snug">
                  {currentQ.question}
                </p>
              </div>

              {/* 4 Варианта ответа */}
              <div className="space-y-2 pt-1">
                {currentQ.options.map((option, idx) => {
                  let btnStyle =
                    "bg-white text-black shadow-[3px_3px_0px_#000] hover:bg-manga-lime active:translate-x-[1px] active:translate-y-[1px]";

                  if (isAnswerChecked) {
                    if (idx === currentQ.correctAnswerIndex) {
                      btnStyle =
                        "bg-manga-lime text-black border-black shadow-[3px_3px_0px_#000] -translate-y-0.5 ring-2 ring-black";
                    } else if (idx === selectedOption) {
                      btnStyle =
                        "bg-red-200 text-red-950 border-black shadow-[2px_2px_0px_#000]";
                    } else {
                      btnStyle = "bg-zinc-100 text-zinc-500 opacity-60";
                    }
                  }

                  return (
                    <button
                      key={option}
                      type="button"
                      disabled={isAnswerChecked}
                      onClick={() => handleOptionClick(idx)}
                      className={`w-full py-2.5 px-3 text-left border-[2.5px] border-black font-black text-xs flex items-center justify-between transition-all cursor-pointer ${btnStyle}`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="w-5 h-5 bg-black text-white text-[11px] font-black flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="leading-snug">{option}</span>
                      </span>
                      {isAnswerChecked && idx === currentQ.correctAnswerIndex && (
                        <CheckCircle2 className="w-4 h-4 text-black stroke-[3] shrink-0 ml-2" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Подсказка о проходном балле */}
              <div className="pt-1 text-center">
                <span className="text-[10px] font-black uppercase text-zinc-600 tracking-wider">
                  ⚡ {t.quizPassingNotice}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
