"use client";

import { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import { AlertTriangle, HelpCircle, Sparkles, X } from "lucide-react";
import { useLanguage } from "@/utils/translations";

export interface QuizQuestion {
  skill: string;
  question: string;
  options: readonly string[];
  correctAnswer: string;
}

interface QuizModalProps {
  quiz: QuizQuestion | null;
  onClose: () => void;
  onSuccess: (skill: string) => void;
}

export default function QuizModal({
  quiz,
  onClose,
  onSuccess,
}: QuizModalProps) {
  const { t } = useLanguage();
  const [errorAlert, setErrorAlert] = useState<boolean>(false);
  const [wrongOption, setWrongOption] = useState<string | null>(null);

  useEffect(() => {
    setErrorAlert(false);
    setWrongOption(null);
  }, [quiz]);

  if (!quiz) return null;

  const handleOptionClick = (option: string) => {
    if (option === quiz.correctAnswer) {
      setErrorAlert(false);
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
        });
      } catch (e) {
        console.warn("Confetti error:", e);
      }

      onSuccess(quiz.skill);
      onClose();
    } else {
      setWrongOption(option);
      setErrorAlert(true);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="quiz-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-[1px]"
    >
      <div className="w-full max-w-[390px] bg-white border-[3px] border-black shadow-[6px_6px_0px_#000] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Верхняя шапка модалки */}
        <div className="bg-manga-yellow border-b-[3px] border-black px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 bg-black text-manga-yellow border-2 border-black flex items-center justify-center">
              <HelpCircle className="w-4 h-4 stroke-[2.5]" />
            </span>
            <div>
              <span className="block text-[10px] font-black uppercase tracking-wider text-zinc-800">
                {t.quizExamBadge}
              </span>
              <h2
                id="quiz-modal-title"
                className="text-base font-black uppercase leading-none text-black"
              >
                {t.quizConfirmTitle} {quiz.skill}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 bg-white border-2 border-black shadow-[2px_2px_0px_#000] flex items-center justify-center hover:bg-manga-pink hover:text-white active:translate-x-[1px] active:translate-y-[1px] transition-colors"
          >
            <X className="w-4 h-4 stroke-[3]" />
          </button>
        </div>

        {/* Тело модалки */}
        <div className="p-4 bg-halftone space-y-4">
          {/* Речевой пузырь с вопросом */}
          <div className="bg-white border-[2.5px] border-black p-3.5 shadow-[3px_3px_0px_#000] speech-bubble-left">
            <span className="inline-block bg-manga-cyan border border-black px-1.5 py-0.5 text-[10px] font-black uppercase mb-1.5">
              {t.quizMentorQuestion}
            </span>
            <p className="text-sm font-black text-black leading-snug">
              {quiz.question}
            </p>
          </div>

          {/* Варианты ответа */}
          <div className="space-y-2.5 pt-1">
            {quiz.options.map((option, idx) => {
              const isWrongClicked = wrongOption === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleOptionClick(option)}
                  className={`w-full py-3 px-3.5 text-left border-[3px] border-black font-black text-sm flex items-center justify-between transition-all cursor-pointer ${
                    isWrongClicked
                      ? "bg-red-200 text-red-950 shadow-[2px_2px_0px_#000] translate-x-[1px] translate-y-[1px]"
                      : "bg-white text-black shadow-[4px_4px_0px_#000] hover:bg-manga-lime active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#000]"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <span className="w-6 h-6 bg-black text-white text-xs font-black flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span>{option}</span>
                  </span>
                  <Sparkles className="w-4 h-4 stroke-[2.5] shrink-0 opacity-60" />
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
        </div>
      </div>
    </div>
  );
}
