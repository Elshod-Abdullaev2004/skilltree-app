"use client";

import { useState, useEffect } from "react";
import { useTelegram } from "@/hooks/useTelegram";
import { useLanguage } from "@/utils/translations";
import { trackEvent } from "@/utils/analytics";
import QuizModal, { type QuizQuestion } from "@/components/QuizModal";
import Link from "next/link";
import { showToast } from "@/utils/toast";
import {
  Award,
  Bell,
  CheckCircle2,
  Lock,
  Sparkles,
  Zap,
  ArrowDown,
  Cpu,
  Terminal,
  Briefcase,
  ChevronRight,
} from "lucide-react";

export type SkillKey =
  | "HTML"
  | "CSS"
  | "JavaScript"
  | "React"
  | "Next.js"
  | "Tailwind";

export interface RoadmapStep {
  id: SkillKey;
  name: string;
  xp: number;
}

export const FRONTEND_ROADMAP: RoadmapStep[] = [
  { id: "HTML", name: "HTML", xp: 150 },
  { id: "CSS", name: "CSS", xp: 200 },
  { id: "JavaScript", name: "JavaScript", xp: 350 },
  { id: "React", name: "React", xp: 450 },
  { id: "Next.js", name: "Next.js", xp: 550 },
  { id: "Tailwind", name: "Tailwind", xp: 300 },
];

export function broadcastLevelUpdate(level: number, skills: string[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("skilltree_level", String(level));
    localStorage.setItem("skilltree_skills", JSON.stringify(skills));
    window.dispatchEvent(
      new CustomEvent("skilltree:level-updated", {
        detail: { level, skills },
      })
    );
  } catch {}
}

export default function TreePage() {
  const { user, dbUser, telegramId, username, setDbUser, initData } =
    useTelegram();
  const { t, lang } = useLanguage();
  const isUz = lang === "uz";

  const [learnedSkills, setLearnedSkills] = useState<string[]>([]);
  const [level, setLevel] = useState<number>(1);
  const [activeSkillQuizKey, setActiveSkillQuizKey] = useState<SkillKey | null>(
    null
  );
  const [savingSkill, setSavingSkill] = useState<string | null>(null);
  const [tgNotifications, setTgNotifications] = useState<boolean>(true);

  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    "https://skilltree-backend-swuh.onrender.com";

  useEffect(() => {
    if (dbUser) {
      const loadedSkills = Array.isArray(dbUser.skills) ? dbUser.skills : [];
      const computedLevel =
        typeof dbUser.level === "number"
          ? dbUser.level
          : 1 + loadedSkills.length;
      setLearnedSkills(loadedSkills);
      setLevel(computedLevel);
      broadcastLevelUpdate(computedLevel, loadedSkills);
      if (typeof dbUser.notificationsEnabled === "boolean") {
        setTgNotifications(dbUser.notificationsEnabled);
      }
    }
  }, [dbUser]);

  const handleToggleNotifications = async () => {
    const nextVal = !tgNotifications;
    setTgNotifications(nextVal);

    try {
      const res = await fetch(`${apiUrl}/api/users/profile`, {
        method: "PUT",
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
          telegramId,
          notificationsEnabled: nextVal,
        }),
      });

      if (res.ok) {
        setDbUser((prev) =>
          prev ? { ...prev, notificationsEnabled: nextVal } : null
        );
        showToast(
          nextVal
            ? isUz
              ? "Bildirishnomalar faollashtirildi! [DISPATCH: ON]"
              : "Уведомления активированы! [DISPATCH: ON]"
            : isUz
              ? "Bildirishnomalar o'chirildi. [DISPATCH: MUTED]"
              : "Уведомления отключены. [DISPATCH: MUTED]"
        );
      }
    } catch (err) {
      console.warn("Ошибка сохранения уведомлений:", err);
    }
  };

  const handleSkillCardClick = (skillName: SkillKey) => {
    trackEvent("skill_clicked", {
      skill: skillName,
      learned: learnedSkills.includes(skillName),
      level,
    });

    if (learnedSkills.includes(skillName)) {
      return;
    }
    setActiveSkillQuizKey(skillName);
  };

  const activeQuiz: QuizQuestion | null = activeSkillQuizKey
    ? {
        skill: activeSkillQuizKey,
        question: t.quizzes[activeSkillQuizKey].question,
        options: t.quizzes[activeSkillQuizKey].options,
        correctAnswer: t.quizzes[activeSkillQuizKey].correctAnswer,
      }
    : null;

  const handleQuizSuccess = async (skillName: string) => {
    const nextSkills = learnedSkills.includes(skillName)
      ? learnedSkills
      : [...learnedSkills, skillName];
    const nextLevel = 1 + nextSkills.length;

    setLearnedSkills(nextSkills);
    setLevel(nextLevel);
    broadcastLevelUpdate(nextLevel, nextSkills);
    setSavingSkill(skillName);

    try {
      const res = await fetch(`${apiUrl}/api/users/skills`, {
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
          telegramId,
          username,
          skill: skillName,
          initData,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.user?.skills)) {
          const srvSkills = data.user.skills;
          const srvLevel =
            typeof data?.user?.level === "number"
              ? data.user.level
              : 1 + srvSkills.length;
          setLearnedSkills(srvSkills);
          setLevel(srvLevel);
          broadcastLevelUpdate(srvLevel, srvSkills);
          setDbUser((prev) =>
            prev ? { ...prev, skills: srvSkills, level: srvLevel } : null
          );
        }
      }
    } catch (error) {
      console.error("Ошибка при сохранении навыка:", error);
    } finally {
      setSavingSkill(null);
    }
  };

  const totalXp = FRONTEND_ROADMAP.filter((step) =>
    learnedSkills.includes(step.id)
  ).reduce((sum, step) => sum + step.xp, 0);

  const progressPercent = Math.round(
    (learnedSkills.length / FRONTEND_ROADMAP.length) * 100
  );

  return (
    <div className="space-y-4 font-mono">
      <QuizModal
        skill={activeSkillQuizKey}
        quiz={activeQuiz}
        onClose={() => setActiveSkillQuizKey(null)}
        onSuccess={handleQuizSuccess}
      />

      {/* Шапка профиля и текущего уровня матрицы */}
      <section className="cyber-panel p-3.5 space-y-3">
        <div className="bg-cyber-black border-b border-cyber-green/30 px-2 py-1.5 flex items-center justify-between text-[10px] -mx-3.5 -mt-3.5 mb-3">
          <span className="font-bold text-cyber-green uppercase tracking-widest">
            OPERATOR_ID // {user?.username ? `@${user.username}` : "@developer"}
          </span>
          <span className="bg-cyber-dark text-cyber-blue px-2 py-0.5 border border-cyber-blue/40 font-bold uppercase text-[9px]">
            MATRIX_STATUS: ACTIVE
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-14 h-14 shrink-0 bg-cyber-black border border-cyber-green flex flex-col items-center justify-center shadow-cyber-glow">
            <span className="text-[8px] font-bold text-zinc-500 uppercase">
              LEVEL
            </span>
            <span className="text-xl font-bold text-cyber-green leading-none">
              {level.toString().padStart(2, "0")}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="text-base font-bold uppercase tracking-tight text-white truncate">
              {user ? `> ${user.first_name.toUpperCase()}` : "> DEVELOPER"}
            </h1>
            <div className="mt-1 inline-flex items-center gap-1.5 bg-cyber-black border border-cyber-green/50 px-2 py-0.5 text-[10px] text-cyber-green">
              <Award className="w-3.5 h-3.5 stroke-[2] shrink-0" />
              <span>
                {learnedSkills.length} / {FRONTEND_ROADMAP.length} MODULES_UNLOCKED
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 mt-1">
              ACCUMULATED_XP: <span className="text-cyber-green font-bold">{totalXp} XP</span>
            </p>
          </div>
        </div>

        {/* Прогресс-бар матрицы */}
        <div className="bg-cyber-black border border-zinc-800 p-2 space-y-1">
          <div className="flex items-center justify-between text-[10px] uppercase text-zinc-400">
            <span className="flex items-center gap-1 text-cyber-green">
              <Zap className="w-3 h-3 text-cyber-green fill-cyber-green" />
              <span>ROADMAP_SYNCHRONIZATION</span>
            </span>
            <span className="font-bold text-white">{progressPercent}%</span>
          </div>
          <div className="w-full h-2 bg-cyber-dark border border-zinc-700 p-0.5">
            <div
              className="h-full bg-cyber-green shadow-cyber-glow transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </section>

      {/* Интерактивный Roadmap */}
      <section aria-label="Roadmap" className="cyber-panel p-3.5 space-y-3">
        <div className="flex items-center justify-between border-b border-cyber-green/30 pb-2">
          <div>
            <span className="text-[8px] font-bold uppercase text-zinc-500">
              LEARNING_PATH
            </span>
            <h2 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-1.5 mt-0.5">
              <Cpu className="w-4 h-4 text-cyber-green stroke-[2.5]" />
              <span>SKILL_TREE_MATRIX</span>
            </h2>
          </div>

          <div className="text-right text-[9px] space-y-0.5">
            <div className="flex items-center justify-end gap-1.5 text-cyber-green">
              <span className="w-2 h-2 bg-cyber-green inline-block shadow-cyber-glow" />
              <span>VERIFIED</span>
            </div>
            <div className="flex items-center justify-end gap-1.5 text-zinc-500">
              <span className="w-2 h-2 bg-zinc-700 inline-block" />
              <span>LOCKED</span>
            </div>
          </div>
        </div>

        <p className="text-[10px] text-zinc-400 bg-cyber-black border border-cyber-green/30 p-2">
          &gt; Кликните по заблокированному модулю, чтобы запустить процедуру ИИ-экзамена из 10 вопросов.
        </p>

        {/* Цепочка модулей */}
        <div className="flex flex-col items-center pt-1">
          {FRONTEND_ROADMAP.map((step, index) => {
            const isLearned = learnedSkills.includes(step.id);
            const isSaving = savingSkill === step.id;
            const stepTranslation = t.steps[step.id];

            return (
              <div key={step.id} className="w-full flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => handleSkillCardClick(step.id)}
                  disabled={isSaving}
                  className={`w-full text-left border p-3 transition-all select-none rounded-none cursor-pointer ${
                    isLearned
                      ? "bg-cyber-dark text-white border-cyber-green shadow-cyber-glow"
                      : "bg-cyber-black text-zinc-400 border-zinc-800 hover:border-cyber-green/50 hover:text-white"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span
                      className={`px-1.5 py-0.5 text-[9px] font-bold uppercase border ${
                        isLearned
                          ? "bg-cyber-green text-cyber-black border-cyber-green"
                          : "bg-cyber-dark text-zinc-500 border-zinc-700"
                      }`}
                    >
                      MOD_0{index + 1}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 bg-cyber-black border border-zinc-700 text-zinc-300">
                        +{step.xp} XP
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold uppercase border ${
                          isLearned
                            ? "border-cyber-green text-cyber-green bg-cyber-black"
                            : "border-zinc-800 text-zinc-500 bg-cyber-black"
                        }`}
                      >
                        {isLearned ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-cyber-green" />
                            <span>UNLOCKED</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-3 h-3 text-zinc-500" />
                            <span>{isSaving ? "SAVING..." : "EXAM_REQUIRED"}</span>
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3
                        className={`text-sm font-bold uppercase tracking-tight ${
                          isLearned ? "text-cyber-green" : "text-white"
                        }`}
                      >
                        {step.name}
                      </h3>
                      <p className="text-[10px] text-zinc-400 mt-0.5 leading-snug">
                        {stepTranslation.subtitle}
                      </p>
                    </div>

                    <div
                      className={`w-8 h-8 shrink-0 border flex items-center justify-center ${
                        isLearned
                          ? "bg-cyber-green text-cyber-black border-cyber-green"
                          : "bg-cyber-black text-zinc-600 border-zinc-800"
                      }`}
                    >
                      {isLearned ? (
                        <Sparkles className="w-4 h-4 stroke-[2]" />
                      ) : (
                        <Lock className="w-4 h-4 stroke-[2]" />
                      )}
                    </div>
                  </div>
                </button>

                {/* Связка между блоками */}
                {index < FRONTEND_ROADMAP.length - 1 && (
                  <div className="py-1 flex flex-col items-center">
                    <div
                      className={`w-[1px] h-2.5 ${
                        isLearned ? "bg-cyber-green shadow-cyber-glow" : "bg-zinc-800"
                      }`}
                    />
                    <div
                      className={`w-5 h-5 border flex items-center justify-center text-[10px] ${
                        isLearned
                          ? "border-cyber-green text-cyber-green bg-cyber-black"
                          : "border-zinc-800 text-zinc-600 bg-cyber-black"
                      }`}
                    >
                      <ArrowDown className="w-3 h-3" />
                    </div>
                    <div
                      className={`w-[1px] h-2.5 ${
                        isLearned ? "bg-cyber-green shadow-cyber-glow" : "bg-zinc-800"
                      }`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Уведомления */}
      <section className="cyber-panel p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-cyber-green" />
            <div>
              <span className="text-xs font-bold uppercase text-white block">
                TELEGRAM_FEED_DISPATCH
              </span>
              <span className="text-[9px] text-zinc-500">
                {isUz ? "Filtr bo'yicha bildirishnomalar" : "Уведомления по открытым навыкам"}
              </span>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={tgNotifications}
            onClick={handleToggleNotifications}
            className={`px-3 py-1 text-[10px] font-bold border transition-all rounded-none cursor-pointer ${
              tgNotifications
                ? "bg-cyber-green text-cyber-black border-cyber-green shadow-cyber-glow"
                : "bg-cyber-black text-zinc-500 border-zinc-800"
            }`}
          >
            {tgNotifications ? "[ACTIVE]" : "[MUTED]"}
          </button>
        </div>
      </section>

      {/* Продуктовый мост в Ленту Вакансий (Замыкание воронки на North Star Metric) */}
      <section className="pt-1 pb-4">
        <Link
          href="/?filter=match"
          className="w-full py-3 px-4 bg-cyber-black text-cyber-green border border-cyber-green hover:bg-cyber-green hover:text-cyber-black font-bold text-xs uppercase tracking-widest flex items-center justify-between transition-all cursor-pointer rounded-none cyber-glow"
        >
          <span className="flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            <span>
              {isUz
                ? "> KO'NIKMALARGA MOS VAKANSIYALAR [MATCH FEED]"
                : "> ВАКАНСИИ ПОД ОТКРЫТЫЕ НАВЫКИ [MATCH FEED]"}
            </span>
          </span>
          <ChevronRight className="w-4 h-4 stroke-[2.5]" />
        </Link>
      </section>
    </div>
  );
}
