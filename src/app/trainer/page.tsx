"use client";

import { useState } from "react";
import { INITIAL_TRAINER_MESSAGES, type ChatMessage } from "@/data/mockData";
import {
  Swords,
  AlertTriangle,
  CheckCircle2,
  Send,
  Sparkles,
  Bot,
  User,
} from "lucide-react";

export default function TrainerPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(
    INITIAL_TRAINER_MESSAGES
  );
  const [input, setInput] = useState("");

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      speakerName: "АЛЕКСЕЙ «KURO»",
      speakerBadge: "JUNIOR // LVL 04",
      timestamp: "Сейчас",
      text: input.trim(),
    };

    const aiReply: ChatMessage = {
      id: `ai-${Date.now() + 1}`,
      sender: "mentor",
      speakerName: "СЕНСЕЙ КАЙТО [AI]",
      speakerBadge: "TECH LEAD // LVL 99",
      timestamp: "Сейчас",
      sfx: "КРИТИЧЕСКИЙ УСПЕХ!",
      text: "Отличное уточнение! Использование колбэка setArr(prev => [...prev, item]) гарантирует работу со свежим состоянием даже при батчинге обновлений в React 19.",
      feedback: {
        score: "10 / 10 • БЕЗУПРЕЧНОЕ КОМБО",
        mistakeHighlight: "Ошибок не обнаружено — чистый иммутабельный код!",
        correction:
          "Совет для собеседования: упомяни также structuredClone() для глубокого копирования вложенных объектов.",
        xpAwarded: "+120 XP • УРОВЕНЬ ДОВЕРИЯ ПОВЫШЕН",
      },
    };

    setMessages((prev) => [...prev, userMsg, aiReply]);
    setInput("");
  };

  return (
    <div className="space-y-4">
      {/* Manga Arena Header */}
      <section className="bg-manga-pink text-white border-[3px] border-manga-ink shadow-brutal p-3.5 bg-speedlines">
        <div className="flex items-center justify-between">
          <span className="inline-block bg-manga-yellow text-manga-ink text-[10px] font-black uppercase px-2 py-0.5 border border-manga-ink">
            БОЕВОЙ СИМУЛЯТОР СОБЕСЕДОВАНИЯ
          </span>
          <span className="text-xs font-black bg-manga-ink text-manga-lime px-2 py-0.5 border border-white">
            РАУНД 01 / 05
          </span>
        </div>
        <h1 className="text-2xl font-black uppercase tracking-tight leading-none mt-2 flex items-center gap-2">
          <Swords className="w-6 h-6 stroke-[2.5]" />
          ИИ-Ментор: Тренажер
        </h1>
      </section>

      {/* Comic Dialogue Feed */}
      <section aria-label="Диалог с ИИ-ментором" className="space-y-5">
        {messages.map((msg) => {
          const isMentor = msg.sender === "mentor";

          return (
            <div key={msg.id} className="space-y-2">
              {/* Speaker Strip */}
              <div
                className={`flex items-center gap-2 ${
                  isMentor ? "justify-start" : "justify-end"
                }`}
              >
                {isMentor && (
                  <div className="w-7 h-7 bg-manga-ink text-manga-yellow border-2 border-manga-ink flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <span className="text-xs font-black uppercase bg-white border-2 border-manga-ink px-2 py-0.5 shadow-brutal-active">
                  {msg.speakerName}
                </span>
                <span className="text-[10px] font-black bg-manga-yellow border border-manga-ink px-1.5 py-0.5">
                  {msg.speakerBadge}
                </span>
                {!isMentor && (
                  <div className="w-7 h-7 bg-manga-lime text-manga-ink border-2 border-manga-ink flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 stroke-[2.5]" />
                  </div>
                )}
              </div>

              {/* Comic Speech Bubble */}
              <div
                className={`border-[3px] border-manga-ink p-3.5 shadow-brutal ${
                  isMentor
                    ? "bg-white speech-bubble-left mr-3"
                    : "bg-manga-yellow/90 speech-bubble-right ml-3"
                }`}
              >
                {msg.sfx && (
                  <div className="mb-2">
                    <span className="inline-block bg-manga-ink text-manga-yellow text-[10px] font-black uppercase px-2 py-0.5 -skew-x-6 border border-manga-ink">
                      ⚡ {msg.sfx}
                    </span>
                  </div>
                )}

                <p className="text-xs font-bold leading-relaxed text-manga-ink">
                  {msg.text}
                </p>

                {/* AI Feedback & Error Highlighting Block */}
                {msg.feedback && (
                  <div className="mt-3 pt-3 border-t-2 border-dashed border-manga-ink space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="bg-manga-ink text-white text-[10px] font-black px-2 py-0.5 uppercase">
                        ВЕРДИКТ: {msg.feedback.score}
                      </span>
                      <span className="bg-manga-lime border border-manga-ink text-[10px] font-black px-2 py-0.5 uppercase">
                        {msg.feedback.xpAwarded}
                      </span>
                    </div>

                    {/* Highlighted Error Box */}
                    <div className="bg-red-100 border-2 border-manga-ink p-2.5 shadow-brutal-active">
                      <div className="flex items-center gap-1.5 text-[11px] font-black uppercase text-red-900 mb-1">
                        <AlertTriangle className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
                        <span>Подсветка ошибки в ответе:</span>
                      </div>
                      <p className="text-xs font-bold text-red-950 underline decoration-wavy decoration-red-600">
                        {msg.feedback.mistakeHighlight}
                      </p>
                    </div>

                    {/* Correct Explanation Box */}
                    <div className="bg-manga-lime/40 border-2 border-manga-ink p-2.5 shadow-brutal-active">
                      <div className="flex items-center gap-1.5 text-[11px] font-black uppercase text-manga-ink mb-1">
                        <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
                        <span>Разбор от ИИ-ментора:</span>
                      </div>
                      <p className="text-xs font-bold text-manga-ink leading-snug">
                        {msg.feedback.correction}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </section>

      {/* Reply Input Box */}
      <form
        onSubmit={handleSend}
        className="pt-2 bg-white border-[3px] border-manga-ink p-3 shadow-brutal space-y-2"
      >
        <label
          htmlFor="trainer-input"
          className="block text-[11px] font-black uppercase flex items-center gap-1"
        >
          <Sparkles className="w-3.5 h-3.5 text-manga-pink" />
          Твой ответ в комикс-чате:
        </label>
        <div className="flex gap-2">
          <input
            id="trainer-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Напиши исправленный ответ с [...prev, newItem]..."
            className="flex-1 bg-manga-bg border-2 border-manga-ink px-3 py-2 text-xs font-bold focus:outline-none focus:bg-manga-yellow/20"
          />
          <button
            type="submit"
            className="bg-manga-lime border-2 border-manga-ink px-3.5 py-2 font-black text-xs uppercase shadow-brutal-sm active:translate-x-[1px] active:translate-y-[1px] flex items-center gap-1"
          >
            <Send className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Ответить</span>
          </button>
        </div>
      </form>
    </div>
  );
}
