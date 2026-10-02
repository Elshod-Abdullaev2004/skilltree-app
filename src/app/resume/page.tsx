"use client";

import { useState, useEffect, useCallback } from "react";
import { useTelegram } from "@/hooks/useTelegram";
import { useLanguage } from "@/utils/translations";
import {
  Sparkles,
  Copy,
  Check,
  Github,
  Code2,
  Briefcase,
  FolderGit2,
  FileText,
  Globe,
  UserCheck,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export default function ResumePage() {
  const { user } = useTelegram();
  const { lang, t } = useLanguage();
  const r = t.resume;

  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    "https://skilltree-backend-swuh.onrender.com";

  const telegramId = user?.id
    ? String(user.id)
    : typeof window !== "undefined"
    ? localStorage.getItem("skilltree_telegram_id") || "guest_dev"
    : "guest_dev";

  const username =
    user?.username ||
    (user
      ? `${user.first_name} ${user.last_name || ""}`.trim()
      : "Frontend Samurai");

  const [role, setRole] = useState(
    "Junior Frontend Developer (React / Next.js)"
  );
  const [stack, setStack] = useState(
    "TypeScript, React 19, Next.js (App Router), Tailwind CSS, Git, REST API"
  );
  const [github, setGithub] = useState("https://github.com/alex-kuro-dev");
  const [portfolio, setPortfolio] = useState("");
  const [aboutMe, setAboutMe] = useState("");
  const [projects, setProjects] = useState<string>(r.defaultProjects);
  const [customEditedProjects, setCustomEditedProjects] = useState(false);

  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // При переключении языка обновляем дефолтный текст пет-проектов, если пользователь его еще не менял вручную
  useEffect(() => {
    if (!customEditedProjects) {
      setProjects(r.defaultProjects);
    }
  }, [lang, r.defaultProjects, customEditedProjects]);

  // Загрузка сохраненных данных пользователя из API при монтировании
  const fetchUserProfile = useCallback(async () => {
    setIsLoadingProfile(true);
    try {
      const res = await fetch(
        `${apiUrl}/api/users/profile?telegramId=${encodeURIComponent(telegramId)}`
      );

      if (res.ok) {
        const data = await res.json();
        const profile = Array.isArray(data) ? data[0] : data;

        if (profile) {
          if (profile.github_url !== undefined && profile.github_url !== "") {
            setGithub(profile.github_url);
          }
          if (profile.portfolio_url !== undefined && profile.portfolio_url !== "") {
            setPortfolio(profile.portfolio_url);
          }
          if (profile.about_me !== undefined && profile.about_me !== "") {
            setAboutMe(profile.about_me);
          }
          if (profile.rank && profile.rank.trim() !== "") {
            setRole(profile.rank);
          }
          if (Array.isArray(profile.skills) && profile.skills.length > 0) {
            setStack(profile.skills.join(", "));
          }
        }
      }
    } catch (error) {
      console.warn("Не удалось подтянуть данные профиля:", error);
    } finally {
      setIsLoadingProfile(false);
    }
  }, [apiUrl, telegramId]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  // Сохранение данных профиля на бэкенд через PUT /api/users/profile
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
        },
        body: JSON.stringify({
          telegramId,
          username,
          github_url: github,
          portfolio_url: portfolio,
          about_me: aboutMe,
          rank: role,
          role: role,
        }),
      });

      if (!res.ok) {
        throw new Error(`Статус ответа: ${res.status}`);
      }

      setSaveSuccess(true);
      // Автоматическое скрытие зеленого уведомления через 4 секунды
      setTimeout(() => {
        setSaveSuccess(false);
      }, 4000);
    } catch (error) {
      console.error("Ошибка при сохранении профиля:", error);
      setSaveError(r.saveErrorNotification || "Ошибка сохранения");
      setTimeout(() => {
        setSaveError(null);
      }, 4000);
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
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(true);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <section className="bg-manga-cyan border-[3px] border-black shadow-[4px_4px_0px_#000] p-3.5 bg-halftone-cyan">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-block bg-black text-manga-cyan text-[10px] font-black uppercase px-2 py-0.5 tracking-wider">
            {r.heroBadge}
          </span>
          {isLoadingProfile && (
            <span className="inline-flex items-center gap-1 bg-white border border-black px-1.5 py-0.5 text-[9px] font-black uppercase">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>SYNC...</span>
            </span>
          )}
        </div>
        <h1 className="text-2xl font-black uppercase tracking-tight leading-none mt-1.5">
          {r.heroTitle}
        </h1>
        <div className="mt-2.5 mb-2 bg-white border-2 border-black p-2.5 shadow-[2px_2px_0px_#000] speech-bubble-left">
          <p className="text-xs font-bold leading-snug">{r.heroBubble}</p>
        </div>
      </section>

      {/* Красивое зеленое уведомление об успешном сохранении */}
      {saveSuccess && (
        <div
          role="status"
          aria-live="polite"
          className="bg-manga-lime border-[3px] border-black p-3.5 shadow-[4px_4px_0px_#000] flex items-center justify-between gap-3 animate-in fade-in zoom-in-95 duration-200"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-black text-manga-lime border-2 border-black flex items-center justify-center shrink-0 shadow-[2px_2px_0px_#000]">
              <CheckCircle2 className="w-5 h-5 stroke-[3]" />
            </div>
            <div>
              <p className="text-sm font-black uppercase text-black leading-tight">
                {lang === "uz"
                  ? "Ma'lumotlar saqlandi!"
                  : "Данные сохранены!"}
              </p>
              <p className="text-[11px] font-bold text-black/80 mt-0.5">
                {r.savedSuccessSub}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSaveSuccess(false)}
            className="w-7 h-7 bg-white hover:bg-black hover:text-white border-2 border-black font-black text-xs flex items-center justify-center shadow-[1px_1px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] transition-colors"
          >
            ✕
          </button>
        </div>
      )}

      {/* Уведомление об ошибке */}
      {saveError && (
        <div
          role="alert"
          className="bg-manga-pink border-[3px] border-black p-3 shadow-[4px_4px_0px_#000] flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 stroke-[2.5] text-black" />
            <p className="text-xs font-black uppercase text-black">{saveError}</p>
          </div>
          <button
            type="button"
            onClick={() => setSaveError(null)}
            className="text-xs font-black px-1.5 py-0.5 border border-black bg-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Form Card */}
      <form
        onSubmit={handleSaveProfile}
        className="bg-white border-[3px] border-black shadow-[4px_4px_0px_#000] p-3.5 space-y-3.5"
      >
        {/* Желаемая должность */}
        <div>
          <label
            htmlFor="desired-role"
            className="flex items-center gap-1.5 text-xs font-black uppercase mb-1"
          >
            <Briefcase className="w-3.5 h-3.5 stroke-[2.5]" />
            {r.labelRole}
          </label>
          <input
            id="desired-role"
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder={r.placeholderRole}
            className="w-full bg-manga-bg border-2 border-black px-3 py-2 text-xs font-bold focus:outline-none focus:bg-manga-yellow/20 shadow-[1px_1px_0px_#000]"
          />
        </div>

        {/* Стек технологий */}
        <div>
          <label
            htmlFor="tech-stack"
            className="flex items-center gap-1.5 text-xs font-black uppercase mb-1"
          >
            <Code2 className="w-3.5 h-3.5 stroke-[2.5]" />
            {r.labelStack}
          </label>
          <input
            id="tech-stack"
            type="text"
            value={stack}
            onChange={(e) => setStack(e.target.value)}
            placeholder={r.placeholderStack}
            className="w-full bg-manga-bg border-2 border-black px-3 py-2 text-xs font-bold focus:outline-none focus:bg-manga-yellow/20 shadow-[1px_1px_0px_#000]"
          />
        </div>

        {/* Ссылка на GitHub */}
        <div>
          <label
            htmlFor="github-url"
            className="flex items-center gap-1.5 text-xs font-black uppercase mb-1"
          >
            <Github className="w-3.5 h-3.5 stroke-[2.5]" />
            {r.labelGithub}
          </label>
          <input
            id="github-url"
            type="url"
            inputMode="url"
            value={github}
            onChange={(e) => setGithub(e.target.value)}
            placeholder={r.placeholderGithub}
            className="w-full bg-manga-bg border-2 border-black px-3 py-2 text-xs font-bold focus:outline-none focus:bg-manga-yellow/20 shadow-[1px_1px_0px_#000]"
          />
        </div>

        {/* Ссылка на Портфолио */}
        <div>
          <label
            htmlFor="portfolio-url"
            className="flex items-center gap-1.5 text-xs font-black uppercase mb-1"
          >
            <Globe className="w-3.5 h-3.5 stroke-[2.5]" />
            {r.labelPortfolio}
          </label>
          <input
            id="portfolio-url"
            type="url"
            inputMode="url"
            value={portfolio}
            onChange={(e) => setPortfolio(e.target.value)}
            placeholder={r.placeholderPortfolio}
            className="w-full bg-manga-bg border-2 border-black px-3 py-2 text-xs font-bold focus:outline-none focus:bg-manga-yellow/20 shadow-[1px_1px_0px_#000]"
          />
        </div>

        {/* О себе / Био */}
        <div>
          <label
            htmlFor="about-me"
            className="flex items-center gap-1.5 text-xs font-black uppercase mb-1"
          >
            <UserCheck className="w-3.5 h-3.5 stroke-[2.5]" />
            {r.labelAboutMe}
          </label>
          <textarea
            id="about-me"
            rows={2}
            value={aboutMe}
            onChange={(e) => setAboutMe(e.target.value)}
            placeholder={r.placeholderAboutMe}
            className="w-full bg-manga-bg border-2 border-black px-3 py-2 text-xs font-bold focus:outline-none focus:bg-manga-yellow/20 shadow-[1px_1px_0px_#000] resize-none"
          />
        </div>

        {/* Описание пет-проектов */}
        <div>
          <label
            htmlFor="pet-projects"
            className="flex items-center gap-1.5 text-xs font-black uppercase mb-1"
          >
            <FolderGit2 className="w-3.5 h-3.5 stroke-[2.5]" />
            {r.labelProjects}
          </label>
          <textarea
            id="pet-projects"
            rows={3}
            value={projects}
            onChange={(e) => {
              setCustomEditedProjects(true);
              setProjects(e.target.value);
            }}
            placeholder={r.placeholderProjects}
            className="w-full bg-manga-bg border-2 border-black px-3 py-2 text-xs font-bold focus:outline-none focus:bg-manga-yellow/20 shadow-[1px_1px_0px_#000] resize-none"
          />
        </div>

        {/* Actions Button Group: Главная кнопка Сохранить + Кнопка генерации резюме */}
        <div className="pt-1 space-y-2">
          {/* Главная кнопка Сохранить */}
          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-3.5 px-4 bg-manga-lime border-[3px] border-black shadow-[4px_4px_0px_#000] font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#34d399] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#000] transition-all disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin stroke-[2.5]" />
                <span>{r.savingButton}</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 stroke-[2.5]" />
                <span>{r.saveButton}</span>
              </>
            )}
          </button>

          {/* Кнопка сгенерировать резюме */}
          <button
            type="button"
            onClick={() => setCopied(false)}
            className="w-full py-2.5 px-4 bg-manga-yellow border-2 border-black shadow-[2px_2px_0px_#000] font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-yellow-400 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#000] transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{r.generateButton}</span>
          </button>
        </div>
      </form>

      {/* Result Card for Copying */}
      <section
        aria-label={r.resultHeader}
        className="bg-white border-[3px] border-black shadow-[4px_4px_0px_#000] overflow-hidden"
      >
        <div className="bg-black text-white px-3.5 py-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs font-black uppercase text-manga-yellow">
            <FileText className="w-3.5 h-3.5" />
            {r.resultHeader}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className={`px-2.5 py-1 border border-white text-[11px] font-black uppercase flex items-center gap-1 transition-colors cursor-pointer ${
              copied
                ? "bg-manga-lime text-black border-black"
                : "bg-manga-pink text-white hover:bg-manga-yellow hover:text-black"
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>{r.copiedButton}</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>{r.copyButton}</span>
              </>
            )}
          </button>
        </div>

        <div className="p-3.5 bg-manga-bg">
          <pre className="whitespace-pre-wrap font-mono text-xs font-bold leading-relaxed text-black bg-white border-2 border-black p-3 shadow-[2px_2px_0px_#000]">
            {displayResume}
          </pre>
        </div>
      </section>
    </div>
  );
}
