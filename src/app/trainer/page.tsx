"use client";

import { useState } from "react";
import { useLanguage } from "@/utils/translations";
import { useTelegram } from "@/hooks/useTelegram";
import {
  Swords,
  AlertTriangle,
  CheckCircle2,
  Send,
  Sparkles,
  Bot,
  User,
} from "lucide-react";

interface UserSubmittedTurn {
  id: string;
  userText: string;
}

export default function TrainerPage() {
  const { t } = useLanguage();
  const { user } = useTelegram();
  const tr = t.trainer;

  const [extraTurns, setExtraTurns] = useState<UserSubmittedTurn[]>([]);
  const [input, setInput] = useState("");

  const userDisplayName = user?.first_name
    ? user.first_name.toUpperCase()
    : tr.userSpeakerDefault;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setExtraTurns((prev) => [
      ...prev,
      {
        id: `turn-${Date.now()}`,
        userText: input.trim(),
      },
    ]);
    setInput("");
  };

  // Формируем список сообщений динамически на выбранном языке (ru / uz)
  const renderedMessages = [
    ...tr.initialMessages.map((msg) => ({
      ...msg,
      speakerName:
        msg.sender === "mentor" ? tr.mentorSpeaker : userDisplayName,
      speakerBadge: msg.sender === "mentor" ? tr.mentorBadge : tr.userBadge,
      feedback: "feedback" in msg ? msg.feedback : undefined,
      sfx: "sfx" in msg ? msg.sfx : undefined,
    })),
    ...extraTurns.flatMap((turn) => [
      {
        id: `${turn.id}-user`,
        sender: "user" as const,
        speakerName: userDisplayName,
        speakerBadge: tr.userBadge,
        timestamp: tr.nowTimestamp,
        text: turn.userText,
        sfx: undefined,
        feedback: undefined,
      },
      {
        id: `${turn.id}-ai`,
        sender: "mentor" as const,
        speakerName: tr.mentorSpeaker,
        speakerBadge: tr.mentorBadge,
        timestamp: tr.nowTimestamp,
        sfx: tr.aiReply.sfx,
        text: tr.aiReply.text,
        feedback: tr.aiReply.feedback,
      },
    ]),
  ];

  return (
    <div className="space-y-4">
      {/* Manga Arena Header */}
      <section className="bg-manga-pink text-white border-[3px] border-black shadow-[4px_4px_0px_#000] p-3.5 bg-speedlines">
        <div className="flex items-center justify-between">
          <span className="inline-block bg-manga-yellow text-black text-[10px] font-black uppercase px-2 py-0.5 border border-black">
            {tr.heroBadge}
          </span>
          <span className="text-xs font-black bg-black text-manga-lime px-2 py-0.5 border border-white">
            {tr.roundBadge}
          </span>
        </div>
        <h1 className="text-2xl font-black uppercase tracking-tight leading-none mt-2 flex items-center gap-2">
          <Swords className="w-6 h-6 stroke-[2.5]" />
          {tr.heroTitle}
        </h1>
      </section>

      {/* Comic Dialogue Feed */}
      <section aria-label={tr.heroTitle} className="space-y-5">
        {renderedMessages.map((msg) => {
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
                  <div className="w-7 h-7 bg-black text-manga-yellow border-2 border-black flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <span className="text-xs font-black uppercase bg-white border-2 border-black px-2 py-0.5 shadow-[1px_1px_0px_#000]">
                  {msg.speakerName}
                </span>
                <span className="text-[10px] font-black bg-manga-yellow border border-black px-1.5 py-0.5">
                  {msg.speakerBadge}
                </span>
                {!isMentor && (
                  <div className="w-7 h-7 bg-manga-lime text-black border-2 border-black flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 stroke-[2.5]" />
                  </div>
                )}
              </div>

              {/* Comic Speech Bubble */}
              <div
                className={`border-[3px] border-black p-3.5 shadow-[4px_4px_0px_#000] ${
                  isMentor
                    ? "bg-white speech-bubble-left mr-3"
                    : "bg-manga-yellow/90 speech-bubble-right ml-3"
                }`}
              >
                {msg.sfx && (
                  <div className="mb-2">
                    <span className="inline-block bg-black text-manga-yellow text-[10px] font-black uppercase px-2 py-0.5 -skew-x-6 border border-black">
                      ⚡ {msg.sfx}
                    </span>
                  </div>
                )}

                <p className="text-xs font-bold leading-relaxed text-black">
                  {msg.text}
                </p>

                {/* AI Feedback & Error Highlighting Block */}
                {msg.feedback && (
                  <div className="mt-3 pt-3 border-t-2 border-dashed border-black space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="bg-black text-white text-[10px] font-black px-2 py-0.5 uppercase">
                        {tr.verdictPrefix} {msg.feedback.score}
                      </span>
                      <span className="bg-manga-lime border border-black text-[10px] font-black px-2 py-0.5 uppercase">
                        {msg.feedback.xpAwarded}
                      </span>
                    </div>

                    {/* Highlighted Error Box */}
                    <div className="bg-red-100 border-2 border-black p-2.5 shadow-[1px_1px_0px_#000]">
                      <div className="flex items-center gap-1.5 text-[11px] font-black uppercase text-red-900 mb-1">
                        <AlertTriangle className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
                        <span>{tr.mistakeLabel}</span>
                      </div>
                      <p className="text-xs font-bold text-red-950 underline decoration-wavy decoration-red-600">
                        {msg.feedback.mistakeHighlight}
                      </p>
                    </div>

                    {/* Correct Explanation Box */}
                    <div className="bg-manga-lime/40 border-2 border-black p-2.5 shadow-[1px_1px_0px_#000]">
                      <div className="flex items-center gap-1.5 text-[11px] font-black uppercase text-black mb-1">
                        <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
                        <span>{tr.correctionLabel}</span>
                      </div>
                      <p className="text-xs font-bold text-black leading-snug">
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
        className="pt-2 bg-white border-[3px] border-black p-3 shadow-[4px_4px_0px_#000] space-y-2"
      >
        <label
          htmlFor="trainer-input"
          className="text-[11px] font-black uppercase flex items-center gap-1"
        >
          <Sparkles className="w-3.5 h-3.5 text-manga-pink" />
          {tr.inputLabel}
        </label>
        <div className="flex gap-2">
          <input
            id="trainer-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={tr.inputPlaceholder}
            className="flex-1 bg-manga-bg border-2 border-black px-3 py-2 text-xs font-bold focus:outline-none focus:bg-manga-yellow/20"
          />
          <button
            type="submit"
            className="bg-manga-lime border-2 border-black px-3.5 py-2 font-black text-xs uppercase shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] flex items-center gap-1 shrink-0"
          >
            <Send className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{tr.sendButton}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
