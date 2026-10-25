"use client";

import { useState } from "react";
import { useLanguage } from "@/utils/translations";
import { useTelegram } from "@/hooks/useTelegram";
import {
  Binary,
  AlertTriangle,
  CheckCircle2,
  Send,
  Terminal,
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
    <div className="space-y-4 font-mono">
      {/* Cyber Arena Header */}
      <section className="cyber-panel p-3.5 space-y-2">
        <div className="flex items-center justify-between text-[9px]">
          <span className="text-cyber-green font-bold uppercase tracking-widest">
            SIMULATION // INTERVIEW_CHAMBER
          </span>
          <span className="bg-cyber-black text-cyber-blue px-2 py-0.5 border border-cyber-blue/40 font-bold uppercase">
            ROUND: ACTIVE
          </span>
        </div>
        <h1 className="text-base font-bold uppercase tracking-tight text-white flex items-center gap-2">
          <Binary className="w-5 h-5 text-cyber-green stroke-[2.5]" />
          <span>&gt; AI_TECHNICAL_DIALOGUE_SIMULATOR</span>
        </h1>
      </section>

      {/* Cyber Dialogue Feed */}
      <section aria-label="Dialogue" className="space-y-3.5">
        {renderedMessages.map((msg) => {
          const isMentor = msg.sender === "mentor";

          return (
            <div key={msg.id} className="space-y-1.5">
              {/* Speaker Strip */}
              <div
                className={`flex items-center gap-2 text-[10px] ${
                  isMentor ? "justify-start" : "justify-end"
                }`}
              >
                {isMentor && (
                  <div className="w-5 h-5 bg-cyber-black text-cyber-green border border-cyber-green flex items-center justify-center shrink-0">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}
                <span className="font-bold text-white uppercase">
                  {msg.speakerName}
                </span>
                <span className="text-zinc-500 font-mono">
                  [{msg.speakerBadge}]
                </span>
                {!isMentor && (
                  <div className="w-5 h-5 bg-cyber-dark text-cyber-cyan border border-cyber-cyan/50 flex items-center justify-center shrink-0">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>

              {/* Message Box */}
              <div
                className={`p-3 border text-xs leading-relaxed ${
                  isMentor
                    ? "bg-cyber-dark text-zinc-200 border-cyber-green/40 mr-2 shadow-[0_0_15px_rgba(0,0,0,0.5)]"
                    : "bg-cyber-black text-white border-cyber-blue/50 ml-2"
                }`}
              >
                {msg.sfx && (
                  <div className="mb-1.5">
                    <span className="text-[9px] text-cyber-blue uppercase tracking-wider font-bold">
                      &gt;&gt; {msg.sfx}
                    </span>
                  </div>
                )}

                <p>{msg.text}</p>

                {/* AI Feedback & Error Highlighting Block */}
                {msg.feedback && (
                  <div className="mt-2.5 pt-2.5 border-t border-zinc-800 space-y-2 text-[11px]">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="bg-cyber-black text-cyber-green border border-cyber-green/40 px-1.5 py-0.5 text-[9px] uppercase font-bold">
                        VERDICT: {msg.feedback.score}
                      </span>
                      <span className="text-cyber-cyan text-[10px] font-bold">
                        +{msg.feedback.xpAwarded}
                      </span>
                    </div>

                    {/* Ошибка */}
                    <div className="bg-cyber-black border border-cyber-red/50 p-2 text-cyber-red">
                      <div className="flex items-center gap-1 text-[10px] uppercase font-bold mb-0.5">
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                        <span>MISTAKE_DETECTED</span>
                      </div>
                      <p className="text-zinc-300">
                        {msg.feedback.mistakeHighlight}
                      </p>
                    </div>

                    {/* Исправление */}
                    <div className="bg-cyber-black border border-cyber-green/40 p-2 text-cyber-green">
                      <div className="flex items-center gap-1 text-[10px] uppercase font-bold mb-0.5">
                        <CheckCircle2 className="w-3 h-3 shrink-0" />
                        <span>RECOMMENDED_FIX</span>
                      </div>
                      <p className="text-zinc-300">
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
      <form onSubmit={handleSend} className="cyber-panel p-3 space-y-2">
        <label htmlFor="trainer-input" className="text-[9px] text-zinc-400 uppercase flex items-center gap-1">
          <Terminal className="w-3 h-3 text-cyber-green" />
          <span>&gt; ENTER_ARGUMENT_TO_TERMINAL</span>
        </label>
        <div className="flex gap-2">
          <input
            id="trainer-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="console.log('response')..."
            className="flex-1 bg-cyber-black border border-zinc-800 focus:border-cyber-green px-3 py-2 text-xs text-white focus:outline-none rounded-none"
          />
          <button
            type="submit"
            className="bg-cyber-black text-cyber-green border border-cyber-green hover:bg-cyber-green hover:text-cyber-black px-3.5 py-2 font-bold text-xs uppercase flex items-center gap-1 shrink-0 transition-all cursor-pointer rounded-none cyber-glow"
          >
            <Send className="w-3 h-3 stroke-[2]" />
            <span>[SEND]</span>
          </button>
        </div>
      </form>
    </div>
  );
}
