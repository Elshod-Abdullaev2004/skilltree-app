"use client";

import { useState, useEffect, useCallback } from "react";
import { useTelegram } from "@/hooks/useTelegram";
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

export interface RoadmapStep {
  id: string;
  name: string;
  stepNumber: string;
  subtitle: string;
  xp: number;
  description: string;
}

export const FRONTEND_ROADMAP: RoadmapStep[] = [
  {
    id: "HTML",
    name: "HTML",
    stepNumber: "ШАГ 01",
    subtitle: "Семантическая верстка, формы, доступность (a11y)",
    xp: 150,
    description: "Базовый скелет любого веб-приложения: теги, SEO-семантика и структура документа.",
  },
  {
    id: "CSS",
    name: "CSS",
    stepNumber: "ШАГ 02",
    subtitle: "Flexbox, CSS Grid, адаптивность Mobile-First, анимации",
    xp: 200,
    description: "Стилизация интерфейсов, кастомные переменные и идеальная мобильная верстка.",
  },
  {
    id: "JavaScript",
    name: "JavaScript",
    stepNumber: "ШАГ 03",
    subtitle: "ES6+, Замыкания, Event Loop, Promises, Fetch API",
    xp: 350,
    description: "Язык логики фронтенда: работа с DOM, асинхронные запросы к серверу и алгоритмы.",
  },
  {
    id: "React",
    name: "React",
    stepNumber: "ШАГ 04",
    subtitle: "Компоненты, Хуки (useState, useEffect), Стейт-менеджмент",
    xp: 450,
    description: "Создание современных реактивных интерфейсов и переиспользуемой компонентной базы.",
  },
  {
    id: "Next.js",
    name: "Next.js",
    stepNumber: "ШАГ 05",
    subtitle: "App Router, SSR, Server Components, Оптимизация",
    xp: 550,
    description: "Продакшен-фреймворк для полнофункциональных веб-приложений и быстрой загрузки.",
  },
  {
    id: "Tailwind",
    name: "Tailwind",
    stepNumber: "ШАГ 06",
    subtitle: "Utility-First CSS, Нео-брутализм, Дизайн-системы",
    xp: 300,
    description: "Скоростная сборка стильных интерфейсов прямо в разметке без раздутых CSS-файлов.",
  },
];

export default function TreePage() {
  const { user } = useTelegram();
  const [learnedSkills, setLearnedSkills] = useState<string[]>([]);
  const [level, setLevel] = useState<number>(1);
  const [savingSkill, setSavingSkill] = useState<string | null>(null);
  const [tgNotifications, setTgNotifications] = useState<boolean>(true);

  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    "https://skilltree-backend-swuh.onrender.com";

  const telegramId = user?.id ? String(user.id) : "guest_dev";
  const username =
    user?.username ||
    (user ? `${user.first_name} ${user.last_name || ""}`.trim() : "Frontend Samurai");

  // Загружаем сохраненные навыки пользователя с бэкенда
  const fetchUserProfile = useCallback(async () => {
    try {
      const res = await fetch(
        `${apiUrl}/api/users?telegramId=${encodeURIComponent(telegramId)}`
      );
      if (res.ok) {
        const data = await res.json();
        const found = Array.isArray(data) ? data[0] : data;
        if (found) {
          if (Array.isArray(found.skills)) {
            setLearnedSkills(found.skills);
          }
          if (typeof found.level === "number") {
            setLevel(found.level);
          } else if (Array.isArray(found.skills)) {
            setLevel(1 + found.skills.length);
          }
        }
      }
    } catch (error) {
      console.warn("Не удалось загрузить профиль навыков:", error);
    }
  }, [apiUrl, telegramId]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  // Обработчик клика по навыку: отправляет POST /api/users/skills и закрашивает карточку
  const handleSkillClick = async (skillName: string) => {
    const alreadyLearned = learnedSkills.includes(skillName);

    // Оптимистичное обновление UI (мгновенно закрашиваем карточку кислотно-зеленым)
    if (!alreadyLearned) {
      const nextSkills = [...learnedSkills, skillName];
      setLearnedSkills(nextSkills);
      setLevel(1 + nextSkills.length);
    }

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
        if (data?.user?.skills) {
          setLearnedSkills(data.user.skills);
        }
        if (typeof data?.user?.level === "number") {
          setLevel(data.user.level);
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
      {/* Шапка профиля и текущего уровня */}
      <section className="bg-white border-[3px] border-black shadow-[4px_4px_0px_#000] overflow-hidden">
        <div className="bg-black text-white px-3.5 py-2 flex items-center justify-between">
          <span className="text-[11px] font-black tracking-widest uppercase text-manga-yellow">
            КАРТОЧКА ОХОТНИКА • SKILLTREE
          </span>
          <span className="text-[11px] font-mono bg-zinc-800 px-2 py-0.5 border border-zinc-600 text-manga-lime">
            {user?.username ? `@${user.username}` : "@frontend_samurai"}
          </span>
        </div>

        <div className="p-3.5 bg-halftone space-y-3.5">
          <div className="flex items-center gap-3">
            {/* Рамка уровня */}
            <div className="w-16 h-16 shrink-0 bg-manga-yellow border-[3px] border-black shadow-[3px_3px_0px_#000] flex flex-col items-center justify-center -rotate-2">
              <span className="text-[10px] font-black uppercase">УРОВЕНЬ</span>
              <span className="text-2xl font-black leading-none">{level}</span>
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-black uppercase tracking-tight leading-tight truncate">
                {user ? `Привет, ${user.first_name}!` : "Frontend Разработчик"}
              </h1>
              <div className="mt-1 inline-flex items-center gap-1.5 bg-manga-lime border-2 border-black px-2.5 py-0.5 shadow-[2px_2px_0px_#000]">
                <Award className="w-4 h-4 stroke-[2.5] shrink-0" />
                <span className="text-xs font-black uppercase tracking-wide">
                  LVL {level} • {learnedSkills.length} / {FRONTEND_ROADMAP.length} НАВЫКОВ
                </span>
              </div>
              <p className="text-[11px] font-bold text-zinc-700 mt-1">
                Накоплено опыта: <span className="font-black">{totalXp} XP</span>
              </p>
            </div>
          </div>

          {/* Прогресс-бар прохождения дерева */}
          <div className="bg-white border-2 border-black p-2.5 shadow-[2px_2px_0px_#000]">
            <div className="flex items-center justify-between text-xs font-black uppercase mb-1.5">
              <span className="flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 fill-manga-yellow" />
                Прогресс Frontend Roadmap
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
        aria-label="Интерактивное дерево навыков Frontend"
        className="bg-white border-[3px] border-black shadow-[4px_4px_0px_#000] p-3.5 bg-speedlines"
      >
        <div className="flex items-center justify-between border-b-[3px] border-black pb-2.5 mb-4">
          <div>
            <span className="text-[10px] font-black uppercase bg-manga-yellow px-2 py-0.5 border border-black">
              FRONTEND ROADMAP • ИНТЕРАКТИВНО
            </span>
            <h2 className="text-lg font-black uppercase tracking-tight mt-1 flex items-center gap-1.5">
              <Code2 className="w-5 h-5 stroke-[2.5]" />
              Дерево навыков
            </h2>
          </div>

          <div className="text-right text-[10px] font-bold space-y-1">
            <div className="flex items-center justify-end gap-1.5">
              <span className="w-3 h-3 bg-manga-lime border-2 border-black inline-block" />
              <span className="font-black">Изучено</span>
            </div>
            <div className="flex items-center justify-end gap-1.5">
              <span className="w-3 h-3 bg-zinc-300 border-2 border-black inline-block" />
              <span className="font-black">Не изучено</span>
            </div>
          </div>
        </div>

        <p className="text-xs font-bold text-zinc-700 mb-4 bg-manga-bg border-2 border-black p-2.5 shadow-[2px_2px_0px_#000]">
          👆 Нажми на любую карточку навыка ниже, чтобы отметить его изученным и сохранить в свой профиль MongoDB!
        </p>

        {/* Вертикальная цепочка: HTML -> CSS -> JavaScript -> React -> Next.js -> Tailwind */}
        <div className="flex flex-col items-center">
          {FRONTEND_ROADMAP.map((step, index) => {
            const isLearned = learnedSkills.includes(step.id);
            const isSaving = savingSkill === step.id;

            return (
              <div key={step.id} className="w-full flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => handleSkillClick(step.id)}
                  disabled={isSaving}
                  className={`w-full text-left border-[3px] border-black p-3.5 transition-all select-none cursor-pointer ${
                    isLearned
                      ? "bg-manga-lime text-black shadow-[4px_4px_0px_#000] -translate-y-0.5"
                      : "bg-zinc-200 text-zinc-600 shadow-[4px_4px_0px_#000] hover:bg-zinc-300/80 active:translate-x-[2px] active:translate-y-[2px]"
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
                      {step.stepNumber}
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
                            : "bg-zinc-700 text-white"
                        }`}
                      >
                        {isLearned ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 stroke-[3] text-green-700" />
                            <span>ИЗУЧЕНО</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-3 h-3 stroke-[2.5]" />
                            <span>{isSaving ? "СОХРАНЕНИЕ..." : "ИЗУЧИТЬ"}</span>
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
                        {step.subtitle}
                      </p>
                    </div>

                    <div
                      className={`w-10 h-10 shrink-0 border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_#000] ${
                        isLearned ? "bg-manga-yellow text-black" : "bg-zinc-300 text-zinc-700"
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
                        isLearned ? "bg-manga-lime text-black" : "bg-zinc-200 text-zinc-600"
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
        aria-label="Настройки уведомлений Telegram"
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
                Уведомлять о вакансиях в Telegram
              </label>
              <p className="text-xs font-bold text-zinc-700 mt-0.5">
                Подбор вакансий под твои {learnedSkills.length} изученных навыка
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
            <span className="sr-only">Уведомлять о вакансиях в Telegram</span>
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
