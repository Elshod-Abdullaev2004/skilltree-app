"use client";

import { useState } from "react";
import {
  Sparkles,
  Copy,
  Check,
  Github,
  Code2,
  Briefcase,
  FolderGit2,
  FileText,
} from "lucide-react";

export default function ResumePage() {
  const [role, setRole] = useState("Junior Frontend Developer (React / Next.js)");
  const [stack, setStack] = useState(
    "TypeScript, React 19, Next.js (App Router), Tailwind CSS, Git, REST API"
  );
  const [github, setGithub] = useState("https://github.com/alex-kuro-dev");
  const [projects, setProjects] = useState(
    "1. SkillTree TMA — Telegram Mini App для поиска первой работы в IT (Next.js, Tailwind).\n2. CryptoPulse — трекер портфеля с графиками в реальном времени и WebSockets."
  );
  const [generatedResume, setGeneratedResume] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const buildResumeText = () => {
    return `🎯 ПОЗИЦИЯ: ${role}
🔗 GITHUB: ${github}

⚡ КЛЮЧЕВОЙ СТЕК:
${stack}

🚀 ОПЫТ И ПЕТ-ПРОЕКТЫ (IMPACT-ФОРМАТ):
${projects}

💡 ДОСТИЖЕНИЯ ДЛЯ HR-СКРИНИНГА:
• Разработал Mobile-First архитектуру для Telegram Mini App с оценкой Lighthouse Performance 98/100.
• Настроил строгую типизацию компонентов и переиспользуемую UI-систему на Tailwind CSS.
• Готов к выполнению тестового задания и выходу в команду за 24 часа.`;
  };

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    setGeneratedResume(buildResumeText());
    setCopied(false);
  };

  const displayResume = generatedResume || buildResumeText();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(displayResume);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(true);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <section className="bg-manga-cyan border-[3px] border-manga-ink shadow-brutal p-3.5 bg-halftone-cyan">
        <span className="inline-block bg-manga-ink text-manga-cyan text-[10px] font-black uppercase px-2 py-0.5 tracking-wider">
          ГЕНЕРАТОР ОФФЕРОВ • AI CV
        </span>
        <h1 className="text-2xl font-black uppercase tracking-tight leading-none mt-1.5">
          ИИ-Резюме за 10 сек
        </h1>
        <div className="mt-2.5 mb-2 bg-white border-2 border-manga-ink p-2.5 shadow-brutal-sm speech-bubble-left">
          <p className="text-xs font-bold leading-snug">
            Заполни 4 поля ниже — ИИ упакует твои пет-проекты на языке метрик,
            который обожают техлиды и ATS-фильтры!
          </p>
        </div>
      </section>

      {/* Form Card */}
      <form
        onSubmit={handleGenerate}
        className="bg-white border-[3px] border-manga-ink shadow-brutal p-3.5 space-y-3.5"
      >
        <div>
          <label
            htmlFor="desired-role"
            className="flex items-center gap-1.5 text-xs font-black uppercase mb-1"
          >
            <Briefcase className="w-3.5 h-3.5 stroke-[2.5]" />
            Желаемая должность
          </label>
          <input
            id="desired-role"
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="Например: Junior Frontend Developer"
            className="w-full bg-manga-bg border-2 border-manga-ink px-3 py-2 text-xs font-bold focus:outline-none focus:bg-manga-yellow/20 shadow-brutal-active"
          />
        </div>

        <div>
          <label
            htmlFor="tech-stack"
            className="flex items-center gap-1.5 text-xs font-black uppercase mb-1"
          >
            <Code2 className="w-3.5 h-3.5 stroke-[2.5]" />
            Стек технологий
          </label>
          <input
            id="tech-stack"
            type="text"
            value={stack}
            onChange={(e) => setStack(e.target.value)}
            placeholder="React, TypeScript, Node.js, Tailwind CSS..."
            className="w-full bg-manga-bg border-2 border-manga-ink px-3 py-2 text-xs font-bold focus:outline-none focus:bg-manga-yellow/20 shadow-brutal-active"
          />
        </div>

        <div>
          <label
            htmlFor="github-url"
            className="flex items-center gap-1.5 text-xs font-black uppercase mb-1"
          >
            <Github className="w-3.5 h-3.5 stroke-[2.5]" />
            Ссылка на GitHub
          </label>
          <input
            id="github-url"
            type="url"
            inputMode="url"
            value={github}
            onChange={(e) => setGithub(e.target.value)}
            placeholder="https://github.com/username"
            className="w-full bg-manga-bg border-2 border-manga-ink px-3 py-2 text-xs font-bold focus:outline-none focus:bg-manga-yellow/20 shadow-brutal-active"
          />
        </div>

        <div>
          <label
            htmlFor="pet-projects"
            className="flex items-center gap-1.5 text-xs font-black uppercase mb-1"
          >
            <FolderGit2 className="w-3.5 h-3.5 stroke-[2.5]" />
            Описание пет-проектов
          </label>
          <textarea
            id="pet-projects"
            rows={4}
            value={projects}
            onChange={(e) => setProjects(e.target.value)}
            placeholder="Опиши 1-2 главных проекта, какие задачи решал..."
            className="w-full bg-manga-bg border-2 border-manga-ink px-3 py-2 text-xs font-bold focus:outline-none focus:bg-manga-yellow/20 shadow-brutal-active resize-none"
          />
        </div>

        {/* Bright Action Button */}
        <button
          type="submit"
          className="w-full py-3.5 px-4 bg-manga-lime border-[3px] border-manga-ink shadow-brutal font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-manga-yellow active:translate-x-[2px] active:translate-y-[2px] active:shadow-brutal-active transition-all"
        >
          <Sparkles className="w-4 h-4 stroke-[2.5]" />
          <span>Сгенерировать резюме</span>
        </button>
      </form>

      {/* Result Card for Copying */}
      <section
        aria-label="Готовое резюме"
        className="bg-white border-[3px] border-manga-ink shadow-brutal overflow-hidden"
      >
        <div className="bg-manga-ink text-white px-3.5 py-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs font-black uppercase text-manga-yellow">
            <FileText className="w-3.5 h-3.5" />
            Готовое резюме для отклика
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className={`px-2.5 py-1 border border-white text-[11px] font-black uppercase flex items-center gap-1 transition-colors ${
              copied
                ? "bg-manga-lime text-manga-ink border-manga-ink"
                : "bg-manga-pink text-white hover:bg-manga-yellow hover:text-manga-ink"
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>Скопировано!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Скопировать</span>
              </>
            )}
          </button>
        </div>

        <div className="p-3.5 bg-manga-bg">
          <pre className="whitespace-pre-wrap font-mono text-xs font-bold leading-relaxed text-manga-ink bg-white border-2 border-manga-ink p-3 shadow-brutal-sm">
            {displayResume}
          </pre>
        </div>
      </section>
    </div>
  );
}
