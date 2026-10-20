"use client";

import { useState, useEffect, useCallback } from "react";
import { useTelegram } from "@/hooks/useTelegram";
import { useLanguage } from "@/utils/translations";
import { trackEvent } from "@/utils/analytics";
import { showToast } from "@/utils/toast";
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
  Bot,
  Building2,
  Send,
} from "lucide-react";

export default function ResumePage() {
  const { user, dbUser, telegramId, username, setDbUser, isLoading, initData } =
    useTelegram();
  const { lang, t } = useLanguage();
  const r = t.resume;

  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    "https://skilltree-backend-swuh.onrender.com";

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
  const [isLoadingProfile, setIsLoadingProfile] = useState(isLoading);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Состояние генератора сопроводительных писем (AI Cover Letter)
  const [targetJobTitle, setTargetJobTitle] = useState(
    "Junior Frontend Developer"
  );
  const [targetCompany, setTargetCompany] = useState("IT Компания");
  const [isGeneratingCoverLetter, setIsGeneratingCoverLetter] = useState(false);
  const [coverLetterText, setCoverLetterText] = useState("");
  const [copiedCoverLetter, setCopiedCoverLetter] = useState(false);

  // При переключении языка обновляем дефолтный текст пет-проектов, если пользователь его еще не менял вручную
  useEffect(() => {
    if (!customEditedProjects) {
      setProjects(r.defaultProjects);
    }
  }, [lang, r.defaultProjects, customEditedProjects]);

  // Синхронизация данных профиля напрямую из глобального контекста TelegramProvider
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
        throw new Error(`Статус ответа: ${res.status}`);
      }

      const result = await res.json();
      if (result.user && setDbUser) {
        setDbUser(result.user);
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
            lang === "uz"
              ? "Kuzatuv xati yaratildi!"
              : "Сопроводительное письмо создано!"
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
      showToast(
        lang === "uz"
          ? "Kuzatuv xati nusxalandi!"
          : "Сопроводительное письмо скопировано в буфер!"
      );
      setTimeout(() => setCopiedCoverLetter(false), 2000);
    } catch (e) {
      console.warn("Copy error:", e);
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

      {/* Секция: ИИ Генератор сопроводительных писем (AI Cover Letter Generator) */}
      <section
        aria-label="AI Cover Letter Generator"
        className="bg-white border-[3px] border-black shadow-[4px_4px_0px_#000] overflow-hidden"
      >
        <div className="bg-manga-yellow border-b-[3px] border-black px-3.5 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 bg-black text-manga-yellow border-2 border-black flex items-center justify-center shadow-[1px_1px_0px_#000]">
              <Sparkles className="w-4 h-4 stroke-[2.5]" />
            </span>
            <div>
              <span className="block text-[9px] font-black uppercase tracking-wider text-zinc-900">
                GEMINI 2.5 FLASH
              </span>
              <h2 className="text-sm font-black uppercase text-black leading-none">
                {lang === "uz" ? "AI Kuzatuv xati" : "ИИ Сопроводительное письмо"}
              </h2>
            </div>
          </div>
          <span className="bg-black text-manga-lime text-[10px] font-black px-2 py-0.5 uppercase border border-black">
            HIGH CONVERSION
          </span>
        </div>

        <div className="p-3.5 space-y-3 bg-halftone">
          <p className="text-xs font-bold text-zinc-800 bg-white border-2 border-black p-2.5 shadow-[2px_2px_0px_#000]">
            {lang === "uz"
              ? "Vakansiya va kompaniya nomini kiriting. Gemini neyrotarmog'i profilingiz asosida rekruterlar uchun qisqa va kuchli xat yozib beradi."
              : "Укажите вакансию и компанию. Нейросеть Gemini составит короткое, цепляющее сопроводительное письмо на основе вашего GitHub и стека."}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[10px] font-black uppercase mb-1">
                {lang === "uz" ? "Vakansiya nomi" : "Вакансия"}
              </label>
              <input
                type="text"
                value={targetJobTitle}
                onChange={(e) => setTargetJobTitle(e.target.value)}
                placeholder="Junior Frontend Developer"
                className="w-full bg-white border-2 border-black px-3 py-2 text-xs font-bold focus:outline-none focus:bg-manga-yellow/20 shadow-[1px_1px_0px_#000]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase mb-1">
                {lang === "uz" ? "Kompaniya nomi" : "Компания"}
              </label>
              <input
                type="text"
                value={targetCompany}
                onChange={(e) => setTargetCompany(e.target.value)}
                placeholder="Яндекс / EPAM / Click"
                className="w-full bg-white border-2 border-black px-3 py-2 text-xs font-bold focus:outline-none focus:bg-manga-yellow/20 shadow-[1px_1px_0px_#000]"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleGenerateCoverLetter}
            disabled={isGeneratingCoverLetter}
            className="w-full py-3 px-4 bg-manga-orange hover:bg-manga-pink text-white border-[3px] border-black font-black text-xs uppercase tracking-wider shadow-[4px_4px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
          >
            {isGeneratingCoverLetter ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin stroke-[2.5]" />
                <span>{lang === "uz" ? "AI yozmoqda..." : "ИИ пишет письмо..."}</span>
              </>
            ) : (
              <>
                <Bot className="w-4 h-4 stroke-[2.5]" />
                <span>
                  {lang === "uz"
                    ? "Kuzatuv xatini yaratish"
                    : "Сгенерировать сопроводительное письмо"}
                </span>
              </>
            )}
          </button>

          {coverLetterText && (
            <div className="space-y-2 pt-2 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-zinc-700">
                  {lang === "uz" ? "Natija:" : "Готовое письмо:"}
                </span>
                <button
                  type="button"
                  onClick={handleCopyCoverLetter}
                  className="inline-flex items-center gap-1 bg-white border-2 border-black px-2.5 py-1 text-[10px] font-black uppercase shadow-[2px_2px_0px_#000] hover:bg-manga-lime transition-colors cursor-pointer"
                >
                  {copiedCoverLetter ? (
                    <>
                      <Check className="w-3 h-3 text-green-700 stroke-[3]" />
                      <span>{lang === "uz" ? "Nusxalandi" : "Скопировано"}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 stroke-[2.5]" />
                      <span>{lang === "uz" ? "Nusxa olish" : "Копировать"}</span>
                    </>
                  )}
                </button>
              </div>

              <textarea
                value={coverLetterText}
                onChange={(e) => setCoverLetterText(e.target.value)}
                rows={7}
                className="w-full bg-white border-2 border-black p-3 text-xs font-bold leading-relaxed text-black shadow-[2px_2px_0px_#000] focus:outline-none focus:bg-manga-yellow/10 resize-none font-sans"
              />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
