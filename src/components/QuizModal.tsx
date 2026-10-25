"use client";

import { useState, useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import {
  Award,
  Cpu,
  CheckCircle2,
  Terminal,
  Crown,
  HelpCircle,
  Loader2,
  Sparkles,
  Star,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import { useLanguage } from "@/utils/translations";
import { useTelegram } from "@/context/TelegramProvider";
import { trackEvent } from "@/utils/analytics";
import { showToast } from "@/utils/toast";

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
  const { initData } = useTelegram();
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingStep, setLoadingStep] = useState<number>(0);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState<boolean>(false);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [isLimitReached, setIsLimitReached] = useState<boolean>(false);

  const transitionTimerRef = useRef<NodeJS.Timeout | null>(null);

  const activeSkill = skill || quiz?.skill || null;

  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    "https://skilltree-backend-swuh.onrender.com";

  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setLoadingStep((prev) => (prev + 1) % 3);
    }, 900);
    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    if (!activeSkill) return;

    let isMounted = true;
    setLoading(true);
    setCurrentIndex(0);
    setCorrectCount(0);
    setSelectedOption(null);
    setIsAnswerChecked(false);
    setIsFinished(false);
    setIsLimitReached(false);

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
            headers: {
              ...(initData
                ? {
                    Authorization: `Bearer ${initData}`,
                    "x-telegram-init-data": initData,
                  }
                : { "x-guest-mode": "true" }),
            },
          }
        );

        if (!response.ok) {
          if (response.status === 403) {
            try {
              const errData = await response.json();
              if (errData?.error === "limit_reached") {
                if (isMounted) {
                  setIsLimitReached(true);
                  setLoading(false);
                }
                return;
              }
            } catch {}
          }
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

    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
    }

    transitionTimerRef.current = setTimeout(() => {
      if (currentIndex + 1 < questions.length) {
        setCurrentIndex((prev) => prev + 1);
        setSelectedOption(null);
        setIsAnswerChecked(false);
      } else {
        setIsFinished(true);

        trackEvent("quiz_completed", {
          skill: activeSkill,
          score: nextCorrectCount,
          totalQuestions: questions.length,
          passed: nextCorrectCount >= 8,
        });

        if (nextCorrectCount >= 8) {
          try {
            confetti({
              particleCount: 160,
              spread: 90,
              origin: { y: 0.55 },
              colors: ["#00ff41", "#03a9f4", "#ffffff"],
            });
          } catch (e) {
            console.warn("Confetti error:", e);
          }
        }
      }
    }, 700);
  };

  const handleClaimSuccess = () => {
    onSuccess(activeSkill);
    onClose();
  };

  const handleBuyPro = () => {
    trackEvent("pro_clicked", { skill: activeSkill });
    showToast(
      lang === "uz"
        ? "To'lov tizimi tez kunda qo'shiladi! Siz kutish ro'yxatidasiz."
        : "Оплата скоро появится! Вы в листе ожидания."
    );
    onClose();
  };

  const getDynamicLoadingText = () => {
    if (lang === "uz") {
      switch (loadingStep) {
        case 0:
          return "> CONNECTING TO GEMINI 2.5 KERNEL...";
        case 1:
          return "> COMPILING 10 TEST PROCEDURES...";
        default:
          return "> CALIBRATING DIFFICULTY MATRIX...";
      }
    }
    switch (loadingStep) {
      case 0:
        return "> ПОДКЛЮЧЕНИЕ К ЯДРУ GEMINI 2.5 FLASH...";
      case 1:
        return "> ГЕНЕРАЦИЯ 10 ПРАКТИЧЕСКИХ ТЕСТОВ...";
      default:
        return "> КАЛИБРОВКА СЛОЖНОСТИ И ПРОВЕРКА ДИСТРАКТОРОВ...";
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="quiz-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-2 sm:p-4 backdrop-blur-sm font-mono"
    >
      <div className="w-full max-w-[460px] bg-cyber-black border border-cyber-green shadow-[0_0_30px_rgba(0,255,65,0.15)] rounded-none overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh] cyber-scanlines">
        {/* Верхняя шапка модалки */}
        <div className="bg-cyber-dark border-b border-cyber-green/50 px-3.5 py-2.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-cyber-black border border-cyber-green text-cyber-green flex items-center justify-center shadow-cyber-glow">
              <Terminal className="w-3.5 h-3.5 stroke-[2.5]" />
            </span>
            <div>
              <span className="block text-[8px] font-bold uppercase tracking-widest text-zinc-500">
                MATRIX // SKILL_EXAMINATION
              </span>
              <h2
                id="quiz-modal-title"
                className="text-xs font-bold uppercase tracking-wider text-white"
              >
                &gt; TEST: {activeSkill}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-7 h-7 bg-cyber-black border border-zinc-700 text-zinc-400 hover:border-cyber-red hover:text-cyber-red flex items-center justify-center transition-colors cursor-pointer rounded-none"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Тело модалки */}
        <div className="p-3.5 space-y-3.5 overflow-y-auto">
          {/* 1. СОСТОЯНИЕ ЗАГРУЗКИ */}
          {loading && (
            <div className="space-y-3 py-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-cyber-dark border border-cyber-green text-cyber-green shadow-cyber-glow">
                <Cpu className="w-6 h-6 stroke-[2] animate-pulse" />
              </div>
              <div>
                <p className="text-xs font-bold text-cyber-green tracking-widest uppercase">
                  {getDynamicLoadingText()}
                </p>
                <p className="text-[10px] text-zinc-500 mt-1.5 font-mono">
                  [GENERATING REAL-TIME KNOWLEDGE VERIFICATION PROTOCOL]
                </p>
              </div>

              <div className="w-full bg-cyber-dark border border-cyber-green/40 p-1 mt-4">
                <div className="h-2 bg-cyber-green animate-pulse shadow-cyber-glow" style={{ width: "70%" }} />
              </div>
            </div>
          )}

          {/* 2. FAKE DOOR: ЛИМИТ ИСЧЕРПАН */}
          {!loading && isLimitReached && (
            <div className="space-y-3.5 py-1 animate-in zoom-in-95 duration-200">
              <div className="bg-cyber-dark border border-cyber-yellow p-4 text-center space-y-3 shadow-[0_0_20px_rgba(255,214,0,0.2)]">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-cyber-black border border-cyber-yellow text-cyber-yellow">
                  <Crown className="w-6 h-6 stroke-[2.5]" />
                </div>

                <div>
                  <span className="text-[8px] font-bold text-cyber-yellow uppercase tracking-widest block mb-1">
                    PERMISSION_DENIED // DAILY_LIMIT_EXCEEDED
                  </span>
                  <h3 className="text-sm font-bold uppercase text-white">
                    {lang === "uz" ? "Kunlik limit tugadi" : "Дневной лимит исчерпан"}
                  </h3>
                  <div className="mt-2.5 bg-cyber-black border border-cyber-yellow/40 p-2.5 text-left text-zinc-300">
                    <p className="text-xs leading-relaxed">
                      {lang === "uz"
                        ? "Siz bugungi 3 ta bepul urinishingizdan foydalandingiz. Pro ruxsatnomasi bilan cheksiz testlar va AI tahlilini faollashtiring."
                        : "Вы потратили 3 бесплатные попытки на сегодня. Получите безлимит и персональный ИИ-разбор ошибок со статусом Pro."}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={handleBuyPro}
                    className="w-full py-2.5 px-3 bg-cyber-yellow text-cyber-black border border-cyber-yellow hover:bg-cyber-black hover:text-cyber-yellow font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer rounded-none"
                  >
                    <Star className="w-4 h-4 fill-black stroke-[1.5]" />
                    <span>&gt; UPGRADE TO ROOT PRO ⭐️</span>
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full py-1.5 px-3 bg-cyber-black text-zinc-500 border border-zinc-800 hover:text-white font-bold text-xs uppercase tracking-widest transition-all cursor-pointer rounded-none"
                  >
                    [CLOSE_TERMINAL]
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 3. ЭКРАН ЗАВЕРШЕНИЯ: ПОБЕДА (>= 8) ИЛИ ПОРАЖЕНИЕ (<= 7) */}
          {!loading && !isLimitReached && isFinished && (
            <div className="space-y-3.5 py-1 animate-in zoom-in-95 duration-200">
              {isPassed ? (
                <div className="bg-cyber-dark border border-cyber-green p-4 text-center space-y-3 shadow-cyber-glow">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-cyber-black border border-cyber-green text-cyber-green">
                    <Award className="w-6 h-6 stroke-[2.5]" />
                  </div>

                  <div>
                    <span className="text-[8px] font-bold text-cyber-green uppercase tracking-widest block mb-1">
                      TEST_PASSED // SKILL_UNLOCKED
                    </span>
                    <h3 className="text-sm font-bold uppercase text-white">
                      {t.quizPassedTitle}
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1 leading-snug">
                      {t.quizPassedDesc}
                    </p>
                  </div>

                  <div className="bg-cyber-black border border-zinc-800 p-2 text-center">
                    <span className="text-[9px] text-zinc-500 block uppercase">
                      {t.quizCorrectScore}
                    </span>
                    <span className="text-xl font-bold text-cyber-green">
                      {correctCount} / 10
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleClaimSuccess}
                    className="w-full py-2.5 px-3 bg-cyber-green text-cyber-black border border-cyber-green hover:bg-cyber-black hover:text-cyber-green font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer rounded-none cyber-glow"
                  >
                    <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                    <span>&gt; {t.quizSaveSkillBtn.toUpperCase()}</span>
                  </button>
                </div>
              ) : (
                <div className="bg-cyber-dark border border-cyber-red p-4 text-center space-y-3 shadow-cyber-glow-red">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-cyber-black border border-cyber-red text-cyber-red">
                    <XCircle className="w-6 h-6 stroke-[2.5]" />
                  </div>

                  <div>
                    <span className="text-[8px] font-bold text-cyber-red uppercase tracking-widest block mb-1">
                      TEST_FAILED // SCORE_INSUFFICIENT
                    </span>
                    <h3 className="text-sm font-bold uppercase text-white">
                      {t.quizFailedTitle}
                    </h3>
                    <div className="mt-2 bg-cyber-black border border-cyber-red/50 p-2 text-cyber-red text-xs font-bold leading-relaxed">
                      {t.quizFailedDesc}
                    </div>
                  </div>

                  <div className="bg-cyber-black border border-zinc-800 p-2 text-center">
                    <span className="text-[9px] text-zinc-500 block uppercase">
                      {t.quizFailedScoreText}
                    </span>
                    <span className="text-xl font-bold text-cyber-red">
                      {correctCount} / 10
                    </span>
                    <span className="block text-[9px] text-zinc-500 mt-0.5">
                      {t.quizFailedRequiredText}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full py-2 px-3 bg-cyber-black text-zinc-400 border border-zinc-800 hover:border-white hover:text-white font-bold text-xs uppercase tracking-widest transition-all cursor-pointer rounded-none"
                  >
                    [ABORT / ВЫХОД]
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 4. ПРОЦЕСС ЭКЗАМЕНА (10 ВОПРОСОВ) */}
          {!loading && !isLimitReached && !isFinished && currentQ && (
            <div className="space-y-3">
              {/* Прогресс */}
              <div className="bg-cyber-dark/60 border border-cyber-green/30 p-2 text-[10px] space-y-1">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="text-cyber-green font-bold">
                    &gt; QUESTION {currentIndex + 1} / 10
                  </span>
                  <span className="text-cyber-cyan font-bold">
                    SCORE: {correctCount}/10 (MIN 8)
                  </span>
                </div>
                <div className="w-full h-1.5 bg-cyber-black border border-zinc-800">
                  <div
                    className="h-full bg-cyber-green shadow-cyber-glow transition-all"
                    style={{ width: `${((currentIndex + 1) / 10) * 100}%` }}
                  />
                </div>
              </div>

              {/* Карточка вопроса */}
              <div className="bg-cyber-dark border border-cyber-green/50 p-3 space-y-2">
                <div className="flex items-center justify-between text-[9px]">
                  <span className="text-cyber-blue uppercase font-bold">&gt; root@skilltree:~$ eval</span>
                  <span className="bg-cyber-black text-cyber-green border border-cyber-green/40 px-1.5 py-0.5 text-[8px] uppercase">
                    #{activeSkill}
                  </span>
                </div>
                <p className="text-xs font-bold text-white leading-relaxed">
                  {currentQ.question}
                </p>
              </div>

              {/* 4 Варианта ответа */}
              <div className="space-y-2 pt-1">
                {currentQ.options.map((option, idx) => {
                  let btnStyle =
                    "bg-cyber-black text-zinc-300 border border-cyber-green/40 hover:border-cyber-green hover:text-cyber-green";

                  if (isAnswerChecked) {
                    if (idx === currentQ.correctAnswerIndex) {
                      btnStyle =
                        "bg-cyber-blue text-cyber-black border-cyber-blue font-bold shadow-cyber-glow-blue animate-pulse";
                    } else if (idx === selectedOption) {
                      btnStyle =
                        "bg-cyber-red text-white border-cyber-red font-bold shadow-cyber-glow-red animate-pulse cyber-glitch";
                    } else {
                      btnStyle = "bg-cyber-black text-zinc-600 border-zinc-800 opacity-40";
                    }
                  }

                  return (
                    <button
                      key={option}
                      type="button"
                      disabled={isAnswerChecked}
                      onClick={() => handleOptionClick(idx)}
                      className={`w-full py-2.5 px-3 text-left border text-xs font-mono flex items-center justify-between transition-all cursor-pointer rounded-none ${btnStyle}`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-[10px] font-bold opacity-75">
                          [{idx + 1}] &gt;
                        </span>
                        <span className="leading-snug">{option}</span>
                      </span>
                      {isAnswerChecked && idx === currentQ.correctAnswerIndex && (
                        <CheckCircle2 className="w-4 h-4 text-cyber-black stroke-[2.5] ml-2 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="pt-1 text-center">
                <span className="text-[9px] uppercase text-zinc-500 tracking-wider font-mono">
                  [MINIMUM CLEARANCE REQUIREMENT: 8 / 10]
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
