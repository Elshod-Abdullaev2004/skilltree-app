"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";

export default function ResumePage() {
  const { lang, t } = useLanguage();
  const r = t.resume;

  const [role, setRole] = useState("Junior Frontend Developer (React / Next.js)");
  const [stack, setStack] = useState(
    "TypeScript, React 19, Next.js (App Router), Tailwind CSS, Git, REST API"
  );
  const [github, setGithub] = useState("https://github.com/alex-kuro-dev");
  const [projects, setProjects] = useState<string>(r.defaultProjects);
  const [customEditedProjects, setCustomEditedProjects] = useState(false);
  const [copied, setCopied] = useState(false);

  // При переключении языка обновляем дефолтный текст пет-проектов, если пользователь его еще не менял вручную
  useEffect(() => {
    if (!customEditedProjects) {
      setProjects(r.defaultProjects);
    }
  }, [lang, r.defaultProjects, customEditedProjects]);

  const buildResumeText = () => {
    return `${r.tplPosition} ${role}
${r.tplGithub} ${github}

${r.tplStack}
${stack}

${r.tplProjects}
${projects}

${r.tplHighlightsHeader}
${r.tplHighlights}`;
  };

  const displayResume = buildResumeText();

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    setCopied(false);
  };

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
        <span className="inline-block bg-black text-manga-cyan text-[10px] font-black uppercase px-2 py-0.5 tracking-wider">
          {r.heroBadge}
        </span>
        <h1 className="text-2xl font-black uppercase tracking-tight leading-none mt-1.5">
          {r.heroTitle}
        </h1>
        <div className="mt-2.5 mb-2 bg-white border-2 border-black p-2.5 shadow-[2px_2px_0px_#000] speech-bubble-left">
          <p className="text-xs font-bold leading-snug">{r.heroBubble}</p>
        </div>
      </section>

      {/* Form Card */}
      <form
        onSubmit={handleGenerate}
        className="bg-white border-[3px] border-black shadow-[4px_4px_0px_#000] p-3.5 space-y-3.5"
      >
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
            rows={4}
            value={projects}
            onChange={(e) => {
              setCustomEditedProjects(true);
              setProjects(e.target.value);
            }}
            placeholder={r.placeholderProjects}
            className="w-full bg-manga-bg border-2 border-black px-3 py-2 text-xs font-bold focus:outline-none focus:bg-manga-yellow/20 shadow-[1px_1px_0px_#000] resize-none"
          />
        </div>

        {/* Bright Action Button */}
        <button
          type="submit"
          className="w-full py-3.5 px-4 bg-manga-lime border-[3px] border-black shadow-[4px_4px_0px_#000] font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-manga-yellow active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#000] transition-all"
        >
          <Sparkles className="w-4 h-4 stroke-[2.5]" />
          <span>{r.generateButton}</span>
        </button>
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
            className={`px-2.5 py-1 border border-white text-[11px] font-black uppercase flex items-center gap-1 transition-colors ${
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
