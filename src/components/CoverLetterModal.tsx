"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import {
  AlertTriangle,
  Award,
  Bot,
  Briefcase,
  Building2,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  FileText,
  HelpCircle,
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

  // Запуск загрузки мини-собеседования
  const loadInterview = async (controller?: AbortController) => {
    setStage("loading_interview");
    setCurrentIndex(0);
    setScore(0);
    setSelectedOption(null);
    setIsAnswerChecked(false);
    setMissedSkills([]);

    // Логируем событие старта собеседования
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
        if (Array.isArray(data.questions) && data.questions.length > 0) {
          setQuestions(data.questions.slice(0, 5));
          setStage("interview");
          return;
        }
      }
    } catch (err: unknown) {
      if ((err as Error)?.name === "AbortError") return;
      console.warn("⚠️ [VacancyInterview] Ошибка загрузки собеседования, запускаем локальный пул:", err);
    }

    // Резервный пул 5 практических вопросов
    const fallbackList: InterviewQuestionItem[] = isUz
      ? [
          {
            question: `'${vacancy.title}' uchun komponent renderini optimallashtirishda qaysi usul eng to'g'ri?`,
            options: [
              "useMemo va useCallback orqali hisoblashlarni keshlashtirish",
              "Barcha o'zgaruvchilarni global window obyektiga joylash",
              "Render ichida har doim yangi funksiya yaratish",
              "State o'rniga faqat localStorage ishlatish",
            ],
            correctAnswerIndex: 0,
            skill: vacancy.tags?.[0] || "React",
          },
          {
            question: "JavaScript Event Loop-da Microtask navbatiga nima qo'shiladi?",
            options: [
              "setTimeout va setInterval",
              "Promise callbacks (.then/.catch) va queueMicrotask",
              "Faqat sichqoncha bosilish hodisalari",
              "Faqat render sikli",
            ],
            correctAnswerIndex: 1,
            skill: "JavaScript",
          },
          {
            question: "CSS-da zamonaviy Flexbox konteynerida elementlarni markazlashtirish qoidasi:",
            options: [
              "float: center",
              "display: flex; justify-content: center; align-items: center;",
              "margin: auto 0; position: fixed;",
              "vertical-align: middle;",
            ],
            correctAnswerIndex: 1,
            skill: "CSS",
          },
          {
            question: "Next.js App Router standartida komponentlar qanday ishlaydi?",
            options: [
              "Faqat mijoz (browser) brauzerida ishlaydi",
              "Server Components sifatida serverda render qilinadi",
              "Node.js talab qilmaydi",
              "Barcha kod HTML faylga statik saqlanadi",
            ],
            correctAnswerIndex: 1,
            skill: "Next.js",
          },
          {
            question: "Git-da joriy o'zgarishlarni vaqtincha xavfsiz saqlab turish buyrug'i:",
            options: ["git reset --hard", "git stash", "git checkout -b", "git revert"],
            correctAnswerIndex: 1,
            skill: "Git",
          },
        ]
      : [
          {
            question: `Как эффективнее всего оптимизировать лишние рендеры в позиции '${vacancy.title}'?`,
            options: [
              "Использовать useMemo и useCallback для тяжелых операций и коллбэков",
              "Хранить все состояние в глобальном объекте window",
              "Всегда создавать анонимные стрелочные функции в JSX",
              "Заменить весь React на чистые DOM-мутации",
            ],
            correctAnswerIndex: 0,
            skill: vacancy.tags?.[0] || "React",
          },
          {
            question: "Что из перечисленного обрабатывается в очереди Microtask Queue в Event Loop?",
            options: [
              "Таймеры setTimeout и setInterval",
              "Коллбэки Promise (.then / .catch) и queueMicrotask",
              "События пользовательского клика мыши",
              "Анимации requestAnimationFrame",
            ],
            correctAnswerIndex: 1,
            skill: "JavaScript",
          },
          {
            question: "Какое сочетание свойств CSS идеально центрирует контент внутри flex-контейнера?",
            options: [
              "float: center; text-align: center;",
              "display: flex; justify-content: center; align-items: center;",
              "position: absolute; margin: auto;",
              "vertical-align: middle; display: inline;",
            ],
            correctAnswerIndex: 1,
            skill: "CSS",
          },
          {
            question: "Какими по умолчанию являются компоненты внутри папки app в Next.js (App Router)?",
            options: [
              "Client Components ('use client')",
              "React Server Components (RSC)",
              "Устаревшими страницами Pages Router",
              "Чистыми статическими HTML-шаблонами",
            ],
            correctAnswerIndex: 1,
            skill: "Next.js",
          },
          {
            question: "Какая команда Git временно убирает незакоммиченные изменения в специальное хранилище?",
            options: ["git reset --hard", "git stash", "git revert HEAD", "git checkout main"],
            correctAnswerIndex: 1,
            skill: "Git",
          },
        ];

    setQuestions(fallbackList);
    setStage("interview");
  };

  useEffect(() => {
    const controller = new AbortController();
    loadInterview(controller);
    return () => controller.abort();
  }, [apiUrl, initData, lang, vacancy.title, vacancy.company, vacancy.tags, vacancyId, isUz]);

  // Генерация сопроводительного письма после успешного прохождения интервью
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
          testTotal: 5,
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

    // Резервный шаблон письма с подтверждением сданного интервью
    const fallbackLetter = isUz
      ? `Assalomu alaykum!

Meni ${vacancy.company} kompaniyasidagi «${vacancy.title}» vakansiyasi juda qiziqtirdi. Men ushbu vakansiya bo'yicha kirish ekspress-intervyusidan muvaffaqiyatli o'tib, ${finalScore}/5 ball to'pladim va amaliy bilimlarimni tasdiqladim.

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

Меня искренне заинтересовала вакансия «${vacancy.title}» в компании ${vacancy.company}. Я только что успешно прошел входное экспресс-собеседование под эту позицию с результатом ${finalScore} из 5 баллов, подтвердив готовность к задачам вашего стека.

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
      const failedSkill = currentQ.skill || vacancy.tags?.[0] || "JavaScript";
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
        // Завершение тестирования: проверяем порог (минимум 3 из 5)
        if (nextScore >= 3) {
          // УСПЕХ: Пройдено!
          trackEvent("vacancy_interview_passed", {
            vacancy: vacancy.title,
            company: vacancy.company,
            score: nextScore,
            total: 5,
            vacancy_id: vacancyId,
          });

          try {
            confetti({
              particleCount: 140,
              spread: 80,
              origin: { y: 0.55 },
              colors: ["#39ff14", "#ffe600", "#ff007f", "#00f0ff", "#ffffff"],
            });
          } catch {}

          generateCoverLetter(nextScore);
        } else {
          // ПРОВАЛ: Меньше 3 правильных ответов
          trackEvent("vacancy_interview_failed", {
            vacancy: vacancy.title,
            company: vacancy.company,
            score: nextScore,
            total: 5,
            vacancy_id: vacancyId,
          });
          setStage("interview_failed");
        }
      }
    }, 750);
  };

  // Копирование письма и переход на hh.uz (доступно ТОЛЬКО после успешного теста)
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

    // Событие отклика в аналитику
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
          return "🤖 Senior dasturchi vakansiya talablarini o'rganmoqda...";
        case 1:
          return "🧠 Ushbu ish beruvchi talab qilgan ko'nikmalar bo'yicha 5 ta test tuzilmoqda...";
        default:
          return "⚡ Amaliy savollar va qiyinlik darajasi tekshirilmoqda...";
      }
    }
    switch (loadingStep) {
      case 0:
        return "🤖 Senior-разработчик изучает требования вакансии...";
      case 1:
        return "🧠 Формируем 5 практических вопросов по стеку этого работодателя...";
      default:
        return "⚡ Калибруем сложность и подготавливаем экспресс-тест...";
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="interview-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-[2px]"
    >
      <div className="w-full max-w-[460px] bg-white border-[3.5px] border-black shadow-[8px_8px_0px_#000] overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
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
                  ? "TOP-INTERVYU • 5 TA SAVOL"
                  : "ЭКСПРЕСС-ИНТЕРВЬЮ • 5 ВОПРОСОВ"}
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
                  ? "Vakansiya bo'yicha intervyu"
                  : "Собеседование по вакансии"}
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
                {isUz ? "Ish beruvchi va lavozim" : "Целевая вакансия"}
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

          {/* 1. ЭКРАН ЗАГРУЗКИ ВОПРОСОВ ОТ ИИ */}
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
                        ? "🤖 AI mini-intervyu tayyorlamoqda..."
                        : "🤖 ИИ генерирует мини-собеседование..."}
                    </span>
                  </h3>
                  <p className="text-xs font-bold text-zinc-800 mt-1.5 min-h-[32px] flex items-center justify-center transition-all">
                    {getDynamicLoadingInterviewText()}
                  </p>
                </div>
              </div>

              {/* Нео-бруталистские скелетоны */}
              <div className="space-y-2 animate-pulse">
                <div className="h-4 bg-zinc-300 border-2 border-black w-2/5" />
                <div className="h-20 bg-zinc-200 border-2 border-black shadow-[2px_2px_0px_#000]" />
                <div className="h-10 bg-zinc-300 border-2 border-black shadow-[2px_2px_0px_#000]" />
                <div className="h-10 bg-zinc-300 border-2 border-black shadow-[2px_2px_0px_#000]" />
              </div>
            </div>
          )}

          {/* 2. ЭКРАН ПРОХОЖДЕНИЯ ТЕСТА (5 ВОПРОСОВ) */}
          {stage === "interview" && currentQ && (
            <div className="space-y-3.5 animate-in zoom-in-95 duration-150">
              {/* Прогресс */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider">
                  <span className="bg-black text-manga-yellow px-2 py-0.5 border border-black text-[10px]">
                    {isUz ? "Savol" : "Вопрос"} {currentIndex + 1} / 5
                  </span>
                  <span className="inline-flex items-center gap-1 bg-white border border-black px-2 py-0.5 shadow-[1px_1px_0px_#000] text-[10px]">
                    <Sparkles className="w-3 h-3 text-manga-pink stroke-[2.5]" />
                    {isUz ? "To'g'ri:" : "Баллы:"} {score} / 5
                  </span>
                </div>

                <div className="w-full h-3 bg-zinc-200 border-2 border-black shadow-[2px_2px_0px_#000] overflow-hidden">
                  <div
                    className="h-full bg-manga-lime transition-all duration-300"
                    style={{ width: `${((currentIndex + 1) / 5) * 100}%` }}
                  />
                </div>
              </div>

              {/* Карточка вопроса */}
              <div className="bg-white border-[3px] border-black p-4 shadow-[4px_4px_0px_#000] speech-bubble-left space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 bg-manga-cyan border border-black px-2 py-0.5 text-[9px] font-black uppercase">
                    <Zap className="w-3 h-3 stroke-[3]" />
                    {isUz ? "SENIOR MENTOR" : "SENIOR ИНТЕРВЬЮЕР"}
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
                      className={`w-full text-left p-3 text-xs font-bold transition-all flex items-start gap-2.5 active:translate-x-[1px] active:translate-y-[1px] cursor-pointer ${buttonStyle}`}
                    >
                      <span className="w-5 h-5 bg-black text-white text-[10px] font-black flex items-center justify-center shrink-0 border border-black">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="flex-1 leading-snug">{option}</span>
                      {isAnswerChecked && idx === currentQ.correctAnswerIndex && (
                        <CheckCircle2 className="w-4 h-4 text-black shrink-0 stroke-[2.5]" />
                      )}
                      {isAnswerChecked &&
                        idx === selectedOption &&
                        idx !== currentQ.correctAnswerIndex && (
                          <XCircle className="w-4 h-4 text-white shrink-0 stroke-[2.5]" />
                        )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. ЭКРАН ПРОВАЛА: МЕНЬШЕ 3 ИЗ 5 (ПЕРЕХОД НА HH.UZ ЗАБЛОКИРОВАН) */}
          {stage === "interview_failed" && (
            <div className="space-y-4 py-2 animate-in zoom-in-95 duration-200">
              <div className="bg-red-500 text-white border-[3.5px] border-black p-5 shadow-[6px_6px_0px_#000] text-center space-y-3.5 relative overflow-hidden bg-halftone-dense">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-white border-2 border-black shadow-[3px_3px_0px_#000] animate-shake">
                  <XCircle className="w-8 h-8 text-red-600 stroke-[2.5]" />
                </div>

                <div>
                  <span className="inline-block bg-black text-manga-yellow text-[10px] font-black px-2.5 py-0.5 uppercase tracking-wider mb-1.5 border border-black">
                    {isUz ? "TALAB DARAJASIDA EMAS" : "ТЕСТ НЕ ПРОЙДЕН"}
                  </span>
                  <h3 className="text-xl font-black uppercase text-white leading-tight">
                    {isUz
                      ? "Siz hozircha ushbu vakansiyaga tayyor emassiz"
                      : "Вы пока не готовы к этой вакансии"}
                  </h3>
                  <div className="mt-2.5 bg-white border-2 border-black p-3 shadow-[2px_2px_0px_#000] text-black">
                    <p className="text-xs font-black leading-snug">
                      {isUz
                        ? `Siz hozircha ushbu vakansiyaga tayyor emassiz. ${primaryFailedSkill} texnologiyasini qayta takrorlang.`
                        : `Вы пока не готовы к этой вакансии. Повторите технологию ${primaryFailedSkill}.`}
                    </p>
                  </div>
                </div>

                {/* Плашка результата */}
                <div className="bg-white text-black border-2 border-black p-2 shadow-[2px_2px_0px_#000]">
                  <span className="block text-[9px] font-black uppercase text-zinc-600">
                    {isUz ? "Natija (kamida 3 ta kerak)" : "Результат (нужно минимум 3)"}
                  </span>
                  <span className="text-xl font-black text-red-600">
                    {score} / 5
                  </span>
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

          {/* 4. ЭКРАН ГЕНЕРАЦИИ СОПРОВОДИТЕЛЬНОГО ПИСЬМА (ПОСЛЕ УСПЕШНОГО ТЕСТА) */}
          {stage === "generating_letter" && (
            <div className="space-y-4 py-4 animate-in zoom-in-95 duration-200">
              <div className="bg-manga-lime border-[3.5px] border-black p-5 shadow-[6px_6px_0px_#000] text-center space-y-3 relative overflow-hidden bg-halftone-dense">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-white border-2 border-black shadow-[3px_3px_0px_#000] animate-bounce">
                  <Award className="w-8 h-8 text-black stroke-[2.5]" />
                </div>
                <div>
                  <span className="inline-block bg-black text-manga-yellow text-[10px] font-black px-2.5 py-0.5 uppercase tracking-wider mb-1">
                    {isUz ? "INTERVYU TOPSHIRILDI!" : "ИНТЕРВЬЮ СДАНО!"}
                  </span>
                  <h3 className="text-lg font-black uppercase text-black leading-tight">
                    {isUz
                      ? `Ajoyib natija: ${score} / 5!`
                      : `Отличный результат: ${score} / 5!`}
                  </h3>
                  <p className="text-xs font-bold text-zinc-900 mt-2 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin stroke-[3]" />
                    <span>
                      {isUz
                        ? "AI ushbu natijangizni kiritgan holda rezyume xati yozmoqda..."
                        : "ИИ пишет сопроводительное письмо с подтверждением ваших баллов..."}
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
              {/* Бейдж успешного подтверждения квалификации */}
              <div className="bg-manga-lime border-2 border-black p-2.5 shadow-[2px_2px_0px_#000] flex items-center justify-between">
                <span className="text-[11px] font-black uppercase flex items-center gap-1 text-black">
                  <CheckCircle2 className="w-4 h-4 stroke-[3]" />
                  {isUz
                    ? `Ekspress-test topshirildi: ${score}/5`
                    : `Входное интервью сдано: ${score}/5`}
                </span>
                <span className="bg-black text-white text-[9px] font-black px-2 py-0.5 uppercase">
                  VERIFIED
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

              {/* Главная кнопка перехода на hh.uz */}
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
