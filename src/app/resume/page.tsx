"use client";

import { useState, useEffect } from "react";
import { useTelegram } from "@/hooks/useTelegram";
import { useLanguage } from "@/utils/translations";
import { trackEvent } from "@/utils/analytics";
import { showToast } from "@/utils/toast";
import {
  Terminal,
  Copy,
  Check,
  Github,
  Code2,
  Briefcase,
  FileCode2,
  Globe,
  UserCheck,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Bot,
  Building2,
  Cpu,
} from "lucide-react";

export default function ResumePage() {
  const { user, dbUser, telegramId, username, setDbUser, isLoading, initData } =
    useTelegram();
  const { lang, t } = useLanguage();
  const r = t.resume;
  const isUz = lang === "uz";

  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    "https://skilltree-backend-swuh.onrender.com";

  const [role, setRole] = useState(
    "Junior Frontend Developer (React / Next.js)"
  );
  const [stack, setStack] = useState(
    "TypeScript, React 19, Next.js (App Router), Tailwind CSS, Git, REST API"
  );
  const [github, setGithub] = useState("https://github.com/developer");
  const [portfolio, setPortfolio] = useState("");
  const [aboutMe, setAboutMe] = useState("");
  const [projects, setProjects] = useState<string>(r.defaultProjects);
  const [customEditedProjects, setCustomEditedProjects] = useState(false);

  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(isLoading);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // AI Cover Letter
  const [targetJobTitle, setTargetJobTitle] = useState(
    "Junior Frontend Developer"
  );
  const [targetCompany, setTargetCompany] = useState("IT Компания");
  const [isGeneratingCoverLetter, setIsGeneratingCoverLetter] = useState(false);
  const [coverLetterText, setCoverLetterText] = useState("");
  const [copiedCoverLetter, setCopiedCoverLetter] = useState(false);

  useEffect(() => {
    if (!customEditedProjects) {
      setProjects(r.defaultProjects);
    }
  }, [lang, r.defaultProjects, customEditedProjects]);

  useEffect(() => {
    if (dbUser) {
      if (dbUser.github_url !== undefined && dbUser.github_url !== "") {
        setGithub(dbUser.github_url);
      }
      if (dbUser.portfolio_url !== undefined && dbUser.portfolio_url !== "") {
        setPortfolio(dbUser.portfolio_url);
      }
      if (dbUser.about_me !== undefined && dbUser.about_me !== "") {
        setAboutMe(dbUser.about_me);
      }
      if (dbUser.rank && dbUser.rank.trim() !== "") {
        setRole(dbUser.rank);
      }
      if (Array.isArray(dbUser.skills) && dbUser.skills.length > 0) {
        setStack(dbUser.skills.join(", "));
      }
      setIsLoadingProfile(false);
    } else if (!isLoading) {
      setIsLoadingProfile(false);
    }
  }, [dbUser, isLoading]);

  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

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
          username,
          github_url: github,
          portfolio_url: portfolio,
          about_me: aboutMe,
          rank: role,
          role: role,
          initData,
        }),
      });

      if (!res.ok) {
        throw new Error(`Статус: ${res.status}`);
      }

      const result = await res.json();
      if (result.user && setDbUser) {
        setDbUser(result.user);
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Ошибка при сохранении:", error);
      setSaveError(r.saveErrorNotification || "Ошибка сохранения");
      setTimeout(() => setSaveError(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const buildResumeText = () => {
    return `${r.tplPosition} ${role}
${r.tplGithub} ${github}${portfolio ? `\n${r.tplPortfolio} ${portfolio}` : ""}

${r.tplStack}
${stack}
${aboutMe ? `\n${r.tplAboutMe}\n${aboutMe}\n` : ""}
${r.tplProjects}
${projects}

${r.tplHighlightsHeader}
${r.tplHighlights}`;
  };

  const displayResume = buildResumeText();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(displayResume);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
    }
  };

  const handleGenerateCoverLetter = async () => {
    setIsGeneratingCoverLetter(true);
    trackEvent("cover_letter_requested", {
      vacancy: targetJobTitle,
      company: targetCompany,
    });

    try {
      const res = await fetch(`${apiUrl}/api/ai/cover-letter`, {
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
          title: targetJobTitle,
          company: targetCompany,
          language: lang,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.coverLetter) {
          setCoverLetterText(data.coverLetter);
          showToast(
            isUz
              ? "Kuzatuv xati yaratildi!"
              : "Сопроводительное письмо сформировано!"
          );
        }
      }
    } catch (e) {
      console.error("Cover letter error:", e);
    } finally {
      setIsGeneratingCoverLetter(false);
    }
  };

  const handleCopyCoverLetter = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(coverLetterText);
      }
      setCopiedCoverLetter(true);
      showToast(isUz ? "Nusxa olindi!" : "Скопировано в буфер обмена!");
      setTimeout(() => setCopiedCoverLetter(false), 2000);
    } catch (e) {
      console.warn("Copy error:", e);
    }
  };

  return (
    <div className="space-y-4 font-mono">
      {/* Шапка резюме */}
      <section className="cyber-panel p-3.5 space-y-2">
        <div className="flex items-center justify-between text-[9px] text-zinc-500 uppercase">
          <span className="text-cyber-green font-bold">&gt; CLEARANCE_FILE // DEVELOPER_CV</span>
          {isLoadingProfile && (
            <span className="flex items-center gap-1 text-cyber-cyan">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>SYNCING...</span>
            </span>
          )}
        </div>
        <h1 className="text-lg font-bold uppercase tracking-tight text-white">
          &gt; DEVELOPER_PROFILE &amp; AI_LETTER
        </h1>
        <p className="text-xs text-zinc-400 bg-cyber-black border border-cyber-green/30 p-2">
          &gt; Настройте параметры профиля для автоматической подстановки в ИИ-сопроводительные письма.
        </p>
      </section>

      {/* Уведомление об успехе */}
      {saveSuccess && (
        <div className="cyber-panel p-3 border-cyber-green shadow-cyber-glow flex items-center justify-between text-xs text-cyber-green">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
            <span>&gt; PROFILE_UPDATED // CHANGES_PERSISTED</span>
          </span>
          <button type="button" onClick={() => setSaveSuccess(false)} className="text-zinc-500 hover:text-white">
            [x]
          </button>
        </div>
      )}

      {/* Уведомление об ошибке */}
      {saveError && (
        <div className="cyber-panel-red p-3 flex items-center justify-between text-xs text-cyber-red">
          <span className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>&gt; ERROR: {saveError}</span>
          </span>
          <button type="button" onClick={() => setSaveError(null)} className="text-zinc-500 hover:text-white">
            [x]
          </button>
        </div>
      )}

      {/* Форма редактирования профиля */}
      <form onSubmit={handleSaveProfile} className="cyber-panel p-3.5 space-y-3">
        <div>
          <label htmlFor="desired-role" className="block text-[10px] text-zinc-400 uppercase mb-1">
            &gt; TARGET_POSITION
          </label>
          <input
            id="desired-role"
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full bg-cyber-black border border-zinc-800 focus:border-cyber-green px-2.5 py-1.5 text-xs text-white focus:outline-none rounded-none"
          />
        </div>

        <div>
          <label htmlFor="tech-stack" className="block text-[10px] text-zinc-400 uppercase mb-1">
            &gt; TECH_STACK
          </label>
          <input
            id="tech-stack"
            type="text"
            value={stack}
            onChange={(e) => setStack(e.target.value)}
            className="w-full bg-cyber-black border border-zinc-800 focus:border-cyber-green px-2.5 py-1.5 text-xs text-white focus:outline-none rounded-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label htmlFor="github-url" className="block text-[10px] text-zinc-400 uppercase mb-1">
              &gt; GITHUB_URL
            </label>
            <input
              id="github-url"
              type="url"
              value={github}
              onChange={(e) => setGithub(e.target.value)}
              className="w-full bg-cyber-black border border-zinc-800 focus:border-cyber-green px-2.5 py-1.5 text-xs text-white focus:outline-none rounded-none"
            />
          </div>
          <div>
            <label htmlFor="portfolio-url" className="block text-[10px] text-zinc-400 uppercase mb-1">
              &gt; PORTFOLIO_URL
            </label>
            <input
              id="portfolio-url"
              type="url"
              value={portfolio}
              onChange={(e) => setPortfolio(e.target.value)}
              className="w-full bg-cyber-black border border-zinc-800 focus:border-cyber-green px-2.5 py-1.5 text-xs text-white focus:outline-none rounded-none"
            />
          </div>
        </div>

        <div>
          <label htmlFor="about-me" className="block text-[10px] text-zinc-400 uppercase mb-1">
            &gt; ABOUT_ME // BIO
          </label>
          <textarea
            id="about-me"
            rows={2}
            value={aboutMe}
            onChange={(e) => setAboutMe(e.target.value)}
            className="w-full bg-cyber-black border border-zinc-800 focus:border-cyber-green px-2.5 py-1.5 text-xs text-white focus:outline-none rounded-none resize-none"
          />
        </div>

        <div className="pt-1">
          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-2.5 px-3 bg-cyber-black text-cyber-green border border-cyber-green hover:bg-cyber-green hover:text-cyber-black font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer rounded-none cyber-glow"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>SAVING_DATA...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>&gt; PERSIST_PROFILE_DATA</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Просмотр резюме */}
      <section className="cyber-panel overflow-hidden">
        <div className="bg-cyber-black border-b border-cyber-green/30 px-3 py-2 flex items-center justify-between text-[10px]">
          <span className="text-zinc-400 uppercase flex items-center gap-1.5">
            <FileCode2 className="w-3.5 h-3.5 text-cyber-green" />
            <span>RESUME_PREVIEW.TXT</span>
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className="px-2 py-0.5 border border-cyber-green/50 bg-cyber-dark text-cyber-green hover:bg-cyber-green hover:text-cyber-black text-[9px] font-bold uppercase transition-all cursor-pointer"
          >
            {copied ? "[COPIED]" : "[COPY_TO_CLIPBOARD]"}
          </button>
        </div>
        <div className="p-3 bg-cyber-black">
          <pre className="whitespace-pre-wrap text-[11px] font-mono leading-relaxed text-zinc-300">
            {displayResume}
          </pre>
        </div>
      </section>

      {/* Генератор сопроводительных писем */}
      <section className="cyber-panel p-3.5 space-y-3">
        <div className="border-b border-cyber-green/30 pb-2 flex items-center justify-between">
          <span className="text-xs font-bold uppercase text-white flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-cyber-cyan" />
            <span>AI_COVER_LETTER_DISPATCH</span>
          </span>
          <span className="text-[9px] bg-cyber-black border border-cyber-green/40 px-1.5 py-0.5 text-cyber-green">
            GEMINI 2.5
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label className="block text-[9px] text-zinc-400 uppercase mb-1">
              &gt; VACANCY_TITLE
            </label>
            <input
              type="text"
              value={targetJobTitle}
              onChange={(e) => setTargetJobTitle(e.target.value)}
              className="w-full bg-cyber-black border border-zinc-800 focus:border-cyber-green px-2.5 py-1.5 text-xs text-white focus:outline-none rounded-none"
            />
          </div>
          <div>
            <label className="block text-[9px] text-zinc-400 uppercase mb-1">
              &gt; COMPANY_NAME
            </label>
            <input
              type="text"
              value={targetCompany}
              onChange={(e) => setTargetCompany(e.target.value)}
              className="w-full bg-cyber-black border border-zinc-800 focus:border-cyber-green px-2.5 py-1.5 text-xs text-white focus:outline-none rounded-none"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleGenerateCoverLetter}
          disabled={isGeneratingCoverLetter}
          className="w-full py-2.5 px-3 bg-cyber-black text-cyber-cyan border border-cyber-cyan hover:bg-cyber-cyan hover:text-cyber-black font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer rounded-none cyber-glow-blue"
        >
          {isGeneratingCoverLetter ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>&gt; AI_GENERATING_TRANSMISSION...</span>
            </>
          ) : (
            <>
              <Bot className="w-4 h-4" />
              <span>&gt; COMPILE_COVER_LETTER</span>
            </>
          )}
        </button>

        {coverLetterText && (
          <div className="space-y-2 pt-1 animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-zinc-400 uppercase">OUTPUT:</span>
              <button
                type="button"
                onClick={handleCopyCoverLetter}
                className="px-2 py-0.5 bg-cyber-black border border-cyber-green/50 text-cyber-green hover:bg-cyber-green hover:text-cyber-black text-[9px] font-bold uppercase transition-all cursor-pointer"
              >
                {copiedCoverLetter ? "[COPIED]" : "[COPY]"}
              </button>
            </div>
            <textarea
              value={coverLetterText}
              onChange={(e) => setCoverLetterText(e.target.value)}
              rows={7}
              className="w-full bg-cyber-black border border-cyber-green/50 p-2.5 text-xs font-mono leading-relaxed text-zinc-200 focus:outline-none focus:border-cyber-green resize-none rounded-none"
            />
          </div>
        )}
      </section>
    </div>
  );
}
