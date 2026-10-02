"use client";

import { useState, useEffect, useCallback } from "react";
import { useTelegram } from "@/hooks/useTelegram";
import { useLanguage } from "@/utils/translations";
import QuizModal, { type QuizQuestion } from "@/components/QuizModal";
import {
  Award,
  Bell,
  CheckCircle2,
  Lock,
  Sparkles,
  Zap,
  ArrowDown,
  Code2,
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
  } catch {
    // ignore storage errors
  }
}

export default function TreePage() {
  const { user } = useTelegram();
  const { t } = useLanguage();
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

  const telegramId = user?.id ? String(user.id) : "guest_dev";
  const username =
    user?.username ||
    (user
      ? `${user.first_name} ${user.last_name || ""}`.trim()
      : "Frontend Samurai");

  const fetchUserProfile = useCallback(async () => {
    try {
      const res = await fetch(
        `${apiUrl}/api/users?telegramId=${encodeURIComponent(telegramId)}`
      );
      if (res.ok) {
        const data = await res.json();
        const found = Array.isArray(data) ? data[0] : data;
        if (found) {
          const loadedSkills = Array.isArray(found.skills) ? found.skills : [];
          const computedLevel =
            typeof found.level === "number"
              ? found.level
              : 1 + loadedSkills.length;
          setLearnedSkills(loadedSkills);
          setLevel(computedLevel);
          broadcastLevelUpdate(computedLevel, loadedSkills);
        }
      }
    } catch (error) {
      console.warn("Не удалось загрузить профиль навыков:", error);
    }
  }, [apiUrl, telegramId]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  const handleSkillCardClick = (skillName: SkillKey) => {
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
        },
        body: JSON.stringify({
          telegramId,
          username,
          skill: skillName,
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
    <div className="space-y-5">
      {/* Модальное окно проверки навыка с генерацией от ИИ */}
      <QuizModal
        skill={activeSkillQuizKey}
        quiz={activeQuiz}
        onClose={() => setActiveSkillQuizKey(null)}
        onSuccess={handleQuizSuccess}
      />

      {/* Шапка профиля и текущего уровня */}
      <section className="bg-white border-[3px] border-black shadow-[4px_4px_0px_#000] overflow-hidden">
        <div className="bg-black text-white px-3.5 py-2 flex items-center justify-between">
          <span className="text-[11px] font-black tracking-widest uppercase text-manga-yellow">
            {t.hunterCardBadge}
          </span>
          <span className="text-[11px] font-mono bg-zinc-800 px-2 py-0.5 border border-zinc-600 text-manga-lime">
            {user?.username ? `@${user.username}` : "@frontend_samurai"}
          </span>
        </div>

        <div className="p-3.5 bg-halftone space-y-3.5">
          <div className="flex items-center gap-3">
            {/* Рамка уровня */}
            <div className="w-16 h-16 shrink-0 bg-manga-yellow border-[3px] border-black shadow-[3px_3px_0px_#000] flex flex-col items-center justify-center -rotate-2">
              <span className="text-[10px] font-black uppercase">
                {t.levelLabel}
              </span>
              <span className="text-2xl font-black leading-none">{level}</span>
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-black uppercase tracking-tight leading-tight truncate">
                {user
                  ? `${t.greeting}, ${user.first_name}!`
                  : t.defaultUser}
              </h1>
              <div className="mt-1 inline-flex items-center gap-1.5 bg-manga-lime border-2 border-black px-2.5 py-0.5 shadow-[2px_2px_0px_#000]">
                <Award className="w-4 h-4 stroke-[2.5] shrink-0" />
                <span className="text-xs font-black uppercase tracking-wide">
                  LVL {level} • {learnedSkills.length} /{" "}
                  {FRONTEND_ROADMAP.length} {t.skillsWord}
                </span>
              </div>
              <p className="text-[11px] font-bold text-zinc-700 mt-1">
                {t.xpAccumulated} <span className="font-black">{totalXp} XP</span>
              </p>
            </div>
          </div>

          {/* Прогресс-бар прохождения дерева */}
          <div className="bg-white border-2 border-black p-2.5 shadow-[2px_2px_0px_#000]">
            <div className="flex items-center justify-between text-xs font-black uppercase mb-1.5">
              <span className="flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 fill-manga-yellow" />
                {t.roadmapProgress}
              </span>
              <span>{progressPercent}%</span>
            </div>
            <div className="w-full h-4 bg-zinc-200 border-2 border-black overflow-hidden p-0.5">
              <div
                className="h-full bg-manga-lime transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Интерактивный Roadmap: HTML -> CSS -> JavaScript -> React -> Next.js -> Tailwind */}
      <section
        aria-label={t.treeTitle}
        className="bg-white border-[3px] border-black shadow-[4px_4px_0px_#000] p-3.5 bg-speedlines"
      >
        <div className="flex items-center justify-between border-b-[3px] border-black pb-2.5 mb-4">
          <div>
            <span className="text-[10px] font-black uppercase bg-manga-yellow px-2 py-0.5 border border-black">
              {t.roadmapBadge}
            </span>
            <h2 className="text-lg font-black uppercase tracking-tight mt-1 flex items-center gap-1.5">
              <Code2 className="w-5 h-5 stroke-[2.5]" />
              {t.treeTitle}
            </h2>
          </div>

          <div className="text-right text-[10px] font-bold space-y-1">
            <div className="flex items-center justify-end gap-1.5">
              <span className="w-3 h-3 bg-manga-lime border-2 border-black inline-block" />
              <span className="font-black">{t.statusLearned}</span>
            </div>
            <div className="flex items-center justify-end gap-1.5">
              <span className="w-3 h-3 bg-zinc-300 border-2 border-black inline-block" />
              <span className="font-black">{t.statusNotLearned}</span>
            </div>
          </div>
        </div>

        <p className="text-xs font-bold text-zinc-800 mb-4 bg-manga-yellow/40 border-2 border-black p-2.5 shadow-[2px_2px_0px_#000]">
          {t.treeHint}
        </p>

        {/* Вертикальная цепочка: HTML -> CSS -> JavaScript -> React -> Next.js -> Tailwind */}
        <div className="flex flex-col items-center">
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
                  className={`w-full text-left border-[3px] border-black p-3.5 transition-all select-none ${
                    isLearned
                      ? "bg-manga-lime text-black shadow-[4px_4px_0px_#000] -translate-y-0.5 cursor-default"
                      : "bg-zinc-200 text-zinc-600 shadow-[4px_4px_0px_#000] hover:bg-zinc-300/80 active:translate-x-[2px] active:translate-y-[2px] cursor-pointer"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-black uppercase border-2 border-black ${
                        isLearned
                          ? "bg-black text-manga-lime"
                          : "bg-zinc-300 text-zinc-700"
                      }`}
                    >
                      {stepTranslation.stepNumber}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 border-2 border-black ${
                          isLearned
                            ? "bg-white text-black"
                            : "bg-zinc-300 text-zinc-700"
                        }`}
                      >
                        +{step.xp} XP
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-black uppercase border-2 border-black ${
                          isLearned
                            ? "bg-white text-black"
                            : "bg-zinc-800 text-manga-yellow"
                        }`}
                      >
                        {isLearned ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 stroke-[3] text-green-700" />
                            <span>{t.badgeConfirmed}</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-3 h-3 stroke-[2.5]" />
                            <span>
                              {isSaving ? t.badgeSaving : t.badgeTakeQuiz}
                            </span>
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3
                        className={`text-lg font-black uppercase tracking-tight leading-tight ${
                          isLearned ? "text-black" : "text-zinc-700"
                        }`}
                      >
                        {step.name}
                      </h3>
                      <p
                        className={`text-xs font-bold mt-0.5 leading-snug ${
                          isLearned ? "text-zinc-900" : "text-zinc-600"
                        }`}
                      >
                        {stepTranslation.subtitle}
                      </p>
                    </div>

                    <div
                      className={`w-10 h-10 shrink-0 border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_#000] ${
                        isLearned
                          ? "bg-manga-yellow text-black"
                          : "bg-zinc-300 text-zinc-700"
                      }`}
                    >
                      {isLearned ? (
                        <Sparkles className="w-5 h-5 stroke-[2.5]" />
                      ) : (
                        <Lock className="w-5 h-5 stroke-[2.5]" />
                      )}
                    </div>
                  </div>
                </button>

                {/* Стрелка-связка к следующему навыку в цепочке */}
                {index < FRONTEND_ROADMAP.length - 1 && (
                  <div className="py-1.5 flex flex-col items-center">
                    <div
                      className={`w-[3px] h-3 ${
                        isLearned ? "bg-black" : "bg-zinc-400"
                      }`}
                    />
                    <div
                      className={`w-6 h-6 border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_#000] ${
                        isLearned
                          ? "bg-manga-lime text-black"
                          : "bg-zinc-200 text-zinc-600"
                      }`}
                    >
                      <ArrowDown className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                    <div
                      className={`w-[3px] h-3 ${
                        isLearned ? "bg-black" : "bg-zinc-400"
                      }`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Тумблер уведомлений в Telegram */}
      <section
        aria-label={t.tgNotifyTitle}
        className="bg-manga-cyan/30 border-[3px] border-black shadow-[4px_4px_0px_#000] p-3.5"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <div
              className={`w-10 h-10 shrink-0 border-2 border-black shadow-[2px_2px_0px_#000] flex items-center justify-center transition-colors ${
                tgNotifications ? "bg-manga-yellow" : "bg-zinc-200"
              }`}
            >
              <Bell className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <label
                htmlFor="tg-vacancy-toggle"
                className="text-sm font-black uppercase leading-tight block cursor-pointer"
              >
                {t.tgNotifyTitle}
              </label>
              <p className="text-xs font-bold text-zinc-700 mt-0.5">
                {t.tgNotifyDescPrefix} {learnedSkills.length}
              </p>
            </div>
          </div>

          <button
            id="tg-vacancy-toggle"
            type="button"
            role="switch"
            aria-checked={tgNotifications}
            onClick={() => setTgNotifications((prev) => !prev)}
            className={`relative w-16 h-9 shrink-0 border-[3px] border-black shadow-[2px_2px_0px_#000] transition-colors p-0.5 cursor-pointer ${
              tgNotifications ? "bg-manga-lime" : "bg-zinc-300"
            }`}
          >
            <span className="sr-only">{t.tgNotifyTitle}</span>
            <span
              className={`block w-6 h-6 bg-black text-white border border-black transition-transform flex items-center justify-center text-[9px] font-black ${
                tgNotifications ? "translate-x-7" : "translate-x-0"
              }`}
            >
              {tgNotifications ? "ON" : "OFF"}
            </span>
          </button>
        </div>
      </section>
    </div>
  );
}
