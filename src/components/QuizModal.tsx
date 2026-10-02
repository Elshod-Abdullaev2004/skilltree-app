"use client";

import { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import { AlertTriangle, Bot, HelpCircle, Loader2, Sparkles, X, Zap } from "lucide-react";
import { useLanguage } from "@/utils/translations";

export interface QuizQuestion {
  skill: string;
  question: string;
  options: readonly string[] | string[];
  correctAnswer?: string;
  correctAnswerIndex?: number;
}

interface GeneratedQuestionState {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  model?: string;
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
  const [currentQuestion, setCurrentQuestion] = useState<GeneratedQuestionState | null>(null);
  const [errorAlert, setErrorAlert] = useState<boolean>(false);
  const [wrongOptionIndex, setWrongOptionIndex] = useState<number | null>(null);

  const activeSkill = skill || quiz?.skill || null;

  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    "https://skilltree-backend-swuh.onrender.com";

  useEffect(() => {
    if (!activeSkill) return;

    let isMounted = true;
    setLoading(true);
    setErrorAlert(false);
    setWrongOptionIndex(null);

    const controller = new AbortController();

    async function fetchAiQuestion() {
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

        if (isMounted && data && Array.isArray(data.options)) {
          setCurrentQuestion({
            question: data.question,
            options: data.options,
            correctAnswerIndex:
              typeof data.correctAnswerIndex === "number"
                ? data.correctAnswerIndex
                : 0,
            model: data.model || "gemini-2.5-flash",
          });
          setLoading(false);
          return;
        }
      } catch (err: unknown) {
        if ((err as Error)?.name === "AbortError") return;
        console.warn("⚠️ [QuizModal] Не удалось получить вопрос от AI, используем резерв:", err);
      }

      // Резервный вопрос из локального словаря или props
      if (isMounted) {
        if (quiz) {
          const fallbackIdx = Math.max(0, quiz.options.indexOf(quiz.correctAnswer || ""));
          setCurrentQuestion({
            question: quiz.question,
            options: Array.from(quiz.options),
            correctAnswerIndex: fallbackIdx,
            model: "fallback",
          });
        } else {
          setCurrentQuestion({
            question:
              lang === "uz"
                ? `'${activeSkill}' bo'yicha asosiy tushunchalarni bilasizmi?`
                : `Что из перечисленного является ключевой концепцией в ${activeSkill}?`,
            options:
              lang === "uz"
                ? [
                    `${activeSkill} asosiy arxitekturasi va standartlari`,
                    "Faqat CSS uslublari",
                    "Faqat HTML belgilash",
                    "Bunday texnologiya mavjud emas",
                  ]
                : [
                    `Базовая архитектура и принципы работы ${activeSkill}`,
                    "Исключительно стили оформления",
                    "Такой технологии не существует",
                    "Используется только для печати",
                  ],
            correctAnswerIndex: 0,
            model: "fallback",
          });
        }
        setLoading(false);
      }
    }

    fetchAiQuestion();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [activeSkill, apiUrl, lang, quiz]);

  if (!activeSkill) return null;

  const handleOptionClick = (idx: number) => {
    if (!currentQuestion) return;

    if (idx === currentQuestion.correctAnswerIndex) {
      setErrorAlert(false);
      try {
        confetti({
          particleCount: 130,
          spread: 85,
          origin: { y: 0.6 },
          colors: ["#39ff14", "#ffe600", "#ff007f", "#00f0ff", "#000000"],
        });
      } catch (e) {
        console.warn("Confetti error:", e);
      }

      onSuccess(activeSkill);
      onClose();
    } else {
      setWrongOptionIndex(idx);
      setErrorAlert(true);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="quiz-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-[2px]"
    >
      <div className="w-full max-w-[420px] bg-white border-[3.5px] border-black shadow-[8px_8px_0px_#000] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Верхняя шапка модалки */}
        <div className="bg-manga-yellow border-b-[3.5px] border-black px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 bg-black text-manga-yellow border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_#000]">
              <HelpCircle className="w-4.5 h-4.5 stroke-[2.5]" />
            </span>
            <div>
              <span className="block text-[10px] font-black uppercase tracking-wider text-zinc-800">
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

        {/* Тело модалки */}
        <div className="p-4 bg-halftone space-y-4">
          {/* Состояние загрузки от ИИ (Gemini 2.5 Flash) */}
          {loading ? (
            <div className="space-y-4 py-4">
              <div className="bg-manga-cyan border-[3px] border-black p-4 shadow-[4px_4px_0px_#000] text-center space-y-2.5 relative overflow-hidden">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-white border-2 border-black shadow-[3px_3px_0px_#000] animate-bounce">
                  <Bot className="w-6 h-6 text-black stroke-[2.5]" />
                </div>
                <div>
                  <p className="text-sm font-black uppercase text-black flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin shrink-0 stroke-[3]" />
                    <span>{t.quizAiGenerating}</span>
                  </p>
                  <p className="text-[11px] font-bold text-zinc-700 mt-1">
                    {t.quizAiGeneratingSub}
                  </p>
                </div>
              </div>

              {/* Скелетон вопросов в манга-стиле */}
              <div className="space-y-2.5 animate-pulse">
                <div className="h-14 bg-zinc-200 border-[2.5px] border-black shadow-[2px_2px_0px_#000]" />
                <div className="h-11 bg-zinc-200 border-[2.5px] border-black shadow-[2px_2px_0px_#000]" />
                <div className="h-11 bg-zinc-200 border-[2.5px] border-black shadow-[2px_2px_0px_#000]" />
                <div className="h-11 bg-zinc-200 border-[2.5px] border-black shadow-[2px_2px_0px_#000]" />
              </div>
            </div>
          ) : currentQuestion ? (
            <>
              {/* Речевой пузырь с вопросом от ИИ */}
              <div className="bg-white border-[3px] border-black p-4 shadow-[4px_4px_0px_#000] speech-bubble-left">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="inline-flex items-center gap-1 bg-manga-cyan border border-black px-2 py-0.5 text-[10px] font-black uppercase">
                    <Zap className="w-3 h-3 stroke-[3]" />
                    {t.quizMentorQuestion}
                  </span>
                  <span className="bg-black text-manga-yellow text-[9px] font-black px-2 py-0.5 uppercase tracking-wider border border-black">
                    {t.quizAiBadge}
                  </span>
                </div>
                <p className="text-sm font-black text-black leading-snug">
                  {currentQuestion.question}
                </p>
              </div>

              {/* 4 Варианта ответа */}
              <div className="space-y-2.5 pt-1">
                {currentQuestion.options.map((option, idx) => {
                  const isWrongClicked = wrongOptionIndex === idx;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handleOptionClick(idx)}
                      className={`w-full py-3 px-3.5 text-left border-[3px] border-black font-black text-xs sm:text-sm flex items-center justify-between transition-all cursor-pointer ${
                        isWrongClicked
                          ? "bg-red-200 text-red-950 shadow-[2px_2px_0px_#000] translate-x-[1px] translate-y-[1px]"
                          : "bg-white text-black shadow-[4px_4px_0px_#000] hover:bg-manga-lime active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#000]"
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <span className="w-6 h-6 bg-black text-white text-xs font-black flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="leading-snug">{option}</span>
                      </span>
                      <Sparkles className="w-4 h-4 stroke-[2.5] shrink-0 opacity-60 ml-2" />
                    </button>
                  );
                })}
              </div>

              {/* Красное уведомление при неверном ответе */}
              {errorAlert && (
                <div
                  role="alert"
                  className="bg-red-500 text-white border-[3px] border-black p-3 shadow-[4px_4px_0px_#000] flex items-center gap-2.5 animate-bounce"
                >
                  <AlertTriangle className="w-5 h-5 stroke-[2.5] shrink-0" />
                  <span className="text-xs font-black uppercase tracking-wide">
                    {t.quizTryAgain}
                  </span>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
