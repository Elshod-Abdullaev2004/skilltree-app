"use client";

import { useState } from "react";
import {
  SKILL_TREE_NODES,
  USER_PROFILE,
  type SkillNode,
} from "@/data/mockData";
import { useTelegram } from "@/hooks/useTelegram";
import {
  Award,
  Bell,
  CheckCircle2,
  Lock,
  Sparkles,
  Zap,
  Shield,
  ChevronRight,
  Unlock,
} from "lucide-react";

export default function SkillTreePage() {
  const { user, syncUser } = useTelegram();
  const [nodes, setNodes] = useState<SkillNode[]>(SKILL_TREE_NODES);
  const [selectedNodeId, setSelectedNodeId] = useState<string>("typescript");
  const [tgNotifications, setTgNotifications] = useState<boolean>(true);

  const completedCount = nodes.filter((n) => n.status === "completed").length;
  const totalXp = nodes
    .filter((n) => n.status === "completed")
    .reduce((sum, n) => sum + n.xp, 0);

  const selectedNode =
    nodes.find((n) => n.id === selectedNodeId) ?? nodes[0];

  const toggleUnlockDemo = (nodeId: string) => {
    setNodes((prev) => {
      const updated = prev.map((node) => {
        if (node.id !== nodeId) return node;
        return {
          ...node,
          status: (node.status === "completed" ? "locked" : "completed") as
            | "completed"
            | "locked",
        };
      });
      const unlockedIds = updated
        .filter((n) => n.status === "completed")
        .map((n) => n.id);
      syncUser({ unlockedSkills: unlockedIds });
      return updated;
    });
  };

  const getNodeById = (id: string) => nodes.find((n) => n.id === id)!;

  return (
    <div className="space-y-5">
      {/* 1. User Profile & Rank Hero Card */}
      <section className="bg-white border-[3px] border-manga-ink shadow-brutal overflow-hidden">
        <div className="bg-manga-ink text-white px-3.5 py-2 flex items-center justify-between">
          <span className="text-[11px] font-black tracking-widest uppercase text-manga-yellow">
            КАРТОЧКА ОХОТНИКА • ПРОФИЛЬ
          </span>
          <span className="text-[11px] font-mono bg-zinc-800 px-2 py-0.5 border border-zinc-600 text-manga-lime">
            {user?.username ? `@${user.username}` : USER_PROFILE.handle}
          </span>
        </div>

        <div className="p-3.5 bg-halftone space-y-3.5">
          <div className="flex items-center gap-3">
            {/* Manga Avatar Frame */}
            <div className="relative w-16 h-16 shrink-0 bg-manga-yellow border-[3px] border-manga-ink shadow-brutal-sm flex flex-col items-center justify-center -rotate-2">
              <span className="text-xl font-black leading-none">侍</span>
              <span className="text-[9px] font-black bg-manga-ink text-white px-1 mt-0.5 uppercase">
                LVL {USER_PROFILE.level}
              </span>
            </div>

            {/* Name & Current Rank */}
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-black uppercase tracking-tight leading-tight truncate">
                {user ? `Привет, ${user.first_name}!` : USER_PROFILE.name}
              </h1>
              <div className="mt-1 inline-flex items-center gap-1.5 bg-manga-lime border-2 border-manga-ink px-2.5 py-0.5 shadow-brutal-active">
                <Award className="w-4 h-4 stroke-[2.5] shrink-0" />
                <span className="text-xs font-black uppercase tracking-wide">
                  {USER_PROFILE.rank}
                </span>
              </div>
              <p className="text-[11px] font-bold text-zinc-600 mt-1">
                Открыто навыков: {completedCount} из {nodes.length}
              </p>
            </div>
          </div>

          {/* XP Progress Bar */}
          <div className="bg-white border-2 border-manga-ink p-2.5 shadow-brutal-sm">
            <div className="flex items-center justify-between text-xs font-black uppercase mb-1.5">
              <span className="flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 fill-manga-yellow" />
                Прогресс до Middle-ранга
              </span>
              <span>
                {totalXp} / {USER_PROFILE.nextLevelXp} XP
              </span>
            </div>
            <div className="w-full h-4 bg-zinc-200 border-2 border-manga-ink overflow-hidden p-0.5">
              <div
                className="h-full bg-manga-pink transition-all duration-300"
                style={{
                  width: `${Math.min(
                    100,
                    Math.round((totalXp / USER_PROFILE.nextLevelXp) * 100)
                  )}%`,
                }}
              />
            </div>
          </div>

          {/* Sensei Speech Bubble */}
          <div className="bg-manga-yellow border-2 border-manga-ink p-2.5 shadow-brutal-sm speech-bubble-right mb-2">
            <p className="text-xs font-bold leading-snug text-manga-ink">
              <span className="bg-manga-ink text-white px-1.5 py-0.5 text-[10px] font-black uppercase mr-1.5">
                МЕНТОР:
              </span>
              {USER_PROFILE.mentorQuote}
            </p>
          </div>
        </div>
      </section>

      {/* 2. Visual Skill Tree (Ветка развития) */}
      <section
        aria-label="Дерево навыков"
        className="bg-white border-[3px] border-manga-ink shadow-brutal p-3.5 bg-speedlines"
      >
        <div className="flex items-center justify-between border-b-2 border-manga-ink pb-2.5 mb-4">
          <div>
            <span className="text-[10px] font-black uppercase bg-manga-cyan px-1.5 py-0.5 border border-manga-ink">
              SKILL TREE • ВЕТКА WEB DEV
            </span>
            <h2 className="text-lg font-black uppercase tracking-tight mt-1">
              Дерево навыков
            </h2>
          </div>
          <div className="text-right text-[10px] font-bold space-y-0.5">
            <div className="flex items-center justify-end gap-1">
              <span className="w-2.5 h-2.5 bg-manga-lime border border-manga-ink inline-block" />
              <span>Пройдено</span>
            </div>
            <div className="flex items-center justify-end gap-1">
              <span className="w-2.5 h-2.5 bg-zinc-300 border border-manga-ink inline-block" />
              <span>Заблокировано</span>
            </div>
          </div>
        </div>

        {/* Visual Tree Diagram */}
        <div className="relative flex flex-col items-center">
          {/* TIER 1: HTML5 & CSS3 (Center Root) */}
          <SkillNodeButton
            node={getNodeById("html-css")}
            isSelected={selectedNodeId === "html-css"}
            onSelect={setSelectedNodeId}
            colorClass="bg-manga-lime"
          />

          {/* Connector Tier 1 -> Tier 2 (Split into 2 branches) */}
          <div className="w-full flex flex-col items-center">
            <div className="w-[3px] h-4 bg-manga-ink" />
            <div className="w-1/2 h-[3px] bg-manga-ink" />
            <div className="w-1/2 flex justify-between">
              <div className="w-[3px] h-4 bg-manga-ink" />
              <div className="w-[3px] h-4 bg-manga-ink" />
            </div>
          </div>

          {/* TIER 2: JS Core (Left) + Git Flow (Right) */}
          <div className="grid grid-cols-2 gap-3 w-full">
            <SkillNodeButton
              node={getNodeById("js-core")}
              isSelected={selectedNodeId === "js-core"}
              onSelect={setSelectedNodeId}
              colorClass="bg-manga-yellow"
              compact
            />
            <SkillNodeButton
              node={getNodeById("git-flow")}
              isSelected={selectedNodeId === "git-flow"}
              onSelect={setSelectedNodeId}
              colorClass="bg-manga-cyan"
              compact
            />
          </div>

          {/* Connector Tier 2 -> Tier 3 (Merge into Center) */}
          <div className="w-full flex flex-col items-center">
            <div className="w-1/2 flex justify-between">
              <div className="w-[3px] h-4 bg-manga-ink" />
              <div className="w-[3px] h-4 bg-manga-ink" />
            </div>
            <div className="w-1/2 h-[3px] bg-manga-ink" />
            <div className="w-[3px] h-4 bg-manga-ink" />
          </div>

          {/* TIER 3: React 19 & Tailwind UI (Center) */}
          <SkillNodeButton
            node={getNodeById("react-hooks")}
            isSelected={selectedNodeId === "react-hooks"}
            onSelect={setSelectedNodeId}
            colorClass="bg-manga-lime"
          />

          {/* Connector Tier 3 -> Tier 4 (Split into Locked Next Steps) */}
          <div className="w-full flex flex-col items-center">
            <div className="w-[3px] h-4 border-l-[3px] border-dashed border-manga-ink" />
            <div className="w-1/2 border-t-[3px] border-dashed border-manga-ink" />
            <div className="w-1/2 flex justify-between">
              <div className="w-[3px] h-4 border-l-[3px] border-dashed border-manga-ink" />
              <div className="w-[3px] h-4 border-l-[3px] border-dashed border-manga-ink" />
            </div>
          </div>

          {/* TIER 4: TypeScript Strict (Left, Locked) + Next.js App Router (Right, Locked) */}
          <div className="grid grid-cols-2 gap-3 w-full">
            <SkillNodeButton
              node={getNodeById("typescript")}
              isSelected={selectedNodeId === "typescript"}
              onSelect={setSelectedNodeId}
              colorClass="bg-manga-yellow"
              compact
            />
            <SkillNodeButton
              node={getNodeById("nextjs-ssr")}
              isSelected={selectedNodeId === "nextjs-ssr"}
              onSelect={setSelectedNodeId}
              colorClass="bg-manga-cyan"
              compact
            />
          </div>

          {/* Connector Tier 4 -> Tier 5 (Merge into Final Boss Node: CI/CD) */}
          <div className="w-full flex flex-col items-center">
            <div className="w-1/2 flex justify-between">
              <div className="w-[3px] h-4 border-l-[3px] border-dashed border-manga-ink" />
              <div className="w-[3px] h-4 border-l-[3px] border-dashed border-manga-ink" />
            </div>
            <div className="w-1/2 border-t-[3px] border-dashed border-manga-ink" />
            <div className="w-[3px] h-4 border-l-[3px] border-dashed border-manga-ink" />
          </div>

          {/* TIER 5: CI/CD & Docker (Center, Locked) */}
          <SkillNodeButton
            node={getNodeById("cicd-docker")}
            isSelected={selectedNodeId === "cicd-docker"}
            onSelect={setSelectedNodeId}
            colorClass="bg-manga-pink text-white"
          />
        </div>

        {/* Selected Node Inspector Box */}
        <div className="mt-5 bg-manga-bg border-[3px] border-manga-ink p-3 shadow-brutal-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 border border-manga-ink ${
                  selectedNode.status === "completed"
                    ? "bg-manga-lime text-manga-ink"
                    : "bg-zinc-800 text-white"
                }`}
              >
                {selectedNode.status === "completed" ? (
                  <>
                    <CheckCircle2 className="w-3 h-3" />
                    НАВЫК ОСВОЕН
                  </>
                ) : (
                  <>
                    <Lock className="w-3 h-3" />
                    СЛЕДУЮЩИЙ ШАГ • ЗАБЛОКИРОВАНО
                  </>
                )}
              </span>
              <h3 className="text-base font-black mt-1 text-manga-ink">
                {selectedNode.title}
              </h3>
            </div>
            <span className="bg-manga-yellow border-2 border-manga-ink px-2 py-0.5 text-xs font-black shrink-0">
              +{selectedNode.xp} XP
            </span>
          </div>

          <p className="text-xs font-bold text-zinc-700 mt-1.5 leading-snug">
            {selectedNode.description}
          </p>

          <div className="mt-3 pt-2.5 border-t-2 border-dashed border-manga-ink flex items-center justify-between gap-2">
            <span className="text-[11px] font-black text-manga-ink flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-manga-pink" />
              Открывает +{selectedNode.unlocksCount} вакансий
            </span>

            <button
              type="button"
              onClick={() => toggleUnlockDemo(selectedNode.id)}
              className={`px-3 py-1.5 border-2 border-manga-ink text-xs font-black uppercase flex items-center gap-1 shadow-brutal-active transition-transform active:translate-x-[1px] active:translate-y-[1px] ${
                selectedNode.status === "completed"
                  ? "bg-white text-manga-ink"
                  : "bg-manga-lime text-manga-ink"
              }`}
            >
              {selectedNode.status === "completed" ? (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Заблокировать</span>
                </>
              ) : (
                <>
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Изучить (Демо)</span>
                </>
              )}
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* 3. Toggle Switch: "Уведомлять о вакансиях в Telegram" */}
      <section
        aria-label="Настройки уведомлений Telegram"
        className="bg-manga-cyan/30 border-[3px] border-manga-ink shadow-brutal p-3.5"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <div
              className={`w-10 h-10 shrink-0 border-2 border-manga-ink shadow-brutal-sm flex items-center justify-center transition-colors ${
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
                {tgNotifications
                  ? "Бот @skilltree_bot пришлет пуш, как только появится подходящая Junior-вакансия!"
                  : "Уведомления отключены. Включи, чтобы не пропустить стажировки."}
              </p>
            </div>
          </div>

          {/* Brutalist Manga Toggle Switch */}
          <button
            id="tg-vacancy-toggle"
            type="button"
            role="switch"
            aria-checked={tgNotifications}
            onClick={() => setTgNotifications((prev) => !prev)}
            className={`relative w-16 h-9 shrink-0 border-[3px] border-manga-ink shadow-brutal-sm transition-colors p-0.5 cursor-pointer ${
              tgNotifications ? "bg-manga-lime" : "bg-zinc-300"
            }`}
          >
            <span className="sr-only">Уведомлять о вакансиях в Telegram</span>
            <span
              className={`block w-6 h-6 bg-manga-ink text-white border border-manga-ink transition-transform flex items-center justify-center text-[9px] font-black ${
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

interface SkillNodeButtonProps {
  node: SkillNode;
  isSelected: boolean;
  onSelect: (id: string) => void;
  colorClass: string;
  compact?: boolean;
}

function SkillNodeButton({
  node,
  isSelected,
  onSelect,
  colorClass,
  compact = false,
}: SkillNodeButtonProps) {
  const isCompleted = node.status === "completed";

  return (
    <button
      type="button"
      onClick={() => onSelect(node.id)}
      className={`relative w-full text-left border-[3px] border-manga-ink p-3 transition-all select-none ${
        isCompleted
          ? `${colorClass} bg-halftone-dense shadow-brutal`
          : "bg-zinc-200/90 text-zinc-600 shadow-brutal-sm hover:bg-zinc-200"
      } ${
        isSelected
          ? "ring-4 ring-manga-pink ring-offset-2 ring-offset-white -translate-y-0.5"
          : "active:translate-x-[1px] active:translate-y-[1px]"
      }`}
    >
      {/* Top Status Row */}
      <div className="flex items-center justify-between gap-1 mb-1">
        <span
          className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-black uppercase border border-manga-ink ${
            isCompleted
              ? "bg-white text-manga-ink"
              : "bg-manga-ink text-manga-yellow"
          }`}
        >
          {isCompleted ? (
            <>
              <CheckCircle2 className="w-3 h-3 stroke-[3] text-green-700" />
              <span>ОТКРЫТО</span>
            </>
          ) : (
            <>
              <Lock className="w-3 h-3 stroke-[2.5]" />
              <span>ЗАКРЫТО</span>
            </>
          )}
        </span>

        <span
          className={`text-[10px] font-black px-1.5 py-0.5 border border-manga-ink ${
            isCompleted
              ? "bg-manga-ink text-manga-lime"
              : "bg-zinc-300 text-zinc-700"
          }`}
        >
          +{node.xp} XP
        </span>
      </div>

      {/* Node Title & Subtitle */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3
            className={`${
              compact ? "text-xs" : "text-sm"
            } font-black uppercase leading-tight ${
              isCompleted ? "text-manga-ink" : "text-zinc-700"
            }`}
          >
            {node.title}
          </h3>
          <p
            className={`text-[11px] font-bold mt-0.5 leading-snug ${
              isCompleted ? "text-zinc-900" : "text-zinc-500"
            }`}
          >
            {node.subtitle}
          </p>
        </div>

        {/* Big Padlock or Shield Icon */}
        <div
          className={`w-8 h-8 shrink-0 border-2 border-manga-ink flex items-center justify-center ${
            isCompleted
              ? "bg-white text-manga-ink shadow-brutal-active"
              : "bg-zinc-300 text-manga-ink"
          }`}
        >
          {isCompleted ? (
            <Shield className="w-4 h-4 stroke-[2.5]" />
          ) : (
            <Lock className="w-4 h-4 stroke-[2.5]" />
          )}
        </div>
      </div>
    </button>
  );
}
