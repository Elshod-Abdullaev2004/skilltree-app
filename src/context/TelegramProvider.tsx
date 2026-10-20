"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import { trackEvent } from "@/utils/analytics";
import { setAppLanguage, type Language } from "@/utils/translations";

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

export interface TelegramWebApp {
  initData: string;
  initDataUnsafe?: {
    query_id?: string;
    user?: TelegramUser;
    auth_date?: string;
    hash?: string;
  };
  ready: () => void;
  expand: () => void;
  close: () => void;
  isExpanded?: boolean;
  platform?: string;
}

export interface DbUser {
  _id?: string;
  telegramId: string;
  username: string;
  language: "ru" | "uz";
  rank: string;
  skills: string[];
  level: number;
  unlockedSkills: string[];
  notificationsEnabled: boolean;
  github_url?: string;
  portfolio_url?: string;
  about_me?: string;
}

export interface SyncUserPayload {
  language?: "ru" | "uz";
  rank?: string;
  skills?: string[];
  level?: number;
  unlockedSkills?: string[];
  notificationsEnabled?: boolean;
  github_url?: string;
  portfolio_url?: string;
  about_me?: string;
}

export interface TelegramContextType {
  user: TelegramUser | null;
  webApp: TelegramWebApp | null;
  tg: TelegramWebApp | null;
  dbUser: DbUser | null;
  telegramId: string;
  username: string;
  initData: string;
  isLoading: boolean;
  expand: () => void;
  syncUser: (extraData?: SyncUserPayload) => Promise<DbUser | null>;
  setDbUser: React.Dispatch<React.SetStateAction<DbUser | null>>;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

const TelegramContext = createContext<TelegramContextType | undefined>(
  undefined
);

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://skilltree-backend-swuh.onrender.com";

/**
 * Глобальный провайдер контекста Telegram Web App.
 * Выполняет первичную авторизацию/синхронизацию с бэкендом строго один раз при монтировании.
 */
export function TelegramProvider({ children }: { children: React.ReactNode }) {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [dbUser, setDbUser] = useState<DbUser | null>(null);
  const [initData, setInitData] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // useEffect срабатывает строго один раз при монтировании (с пустым массивом зависимостей [])
  useEffect(() => {
    let isMounted = true;

    async function initializeTelegramAndAuth() {
      if (typeof window === "undefined") return;

      const tg = window.Telegram?.WebApp;
      let tgUser: TelegramUser | null = null;
      let rawInitData = "";

      if (tg) {
        try {
          tg.ready();
          tg.expand();
        } catch {}

        if (isMounted) {
          setWebApp(tg);
        }

        rawInitData = tg.initData || "";
        if (isMounted) {
          setInitData(rawInitData);
        }
        if (rawInitData) {
          try {
            sessionStorage.setItem("skilltree_init_data", rawInitData);
          } catch {}
        }

        if (tg.initDataUnsafe?.user) {
          tgUser = tg.initDataUnsafe.user;
          if (isMounted) {
            setUser(tgUser);
          }
          try {
            localStorage.setItem("skilltree_telegram_id", String(tgUser.id));
          } catch {}
        }
      }

      // Определяем telegramId и username для первичной авторизации
      const resolvedTelegramId = tgUser?.id
        ? String(tgUser.id)
        : (typeof window !== "undefined"
            ? localStorage.getItem("skilltree_telegram_id")
            : null) || "guest_dev";

      const resolvedUsername =
        tgUser?.username ||
        (tgUser
          ? `${tgUser.first_name} ${tgUser.last_name || ""}`.trim()
          : "Frontend Samurai");

      const resolvedLanguage =
        (typeof window !== "undefined"
          ? (localStorage.getItem("skilltree_lang") as "ru" | "uz")
          : null) ||
        (tgUser?.language_code?.toLowerCase().startsWith("uz") ? "uz" : "ru");

      // Первичный запрос авторизации на бэкенд (найти или создать юзера в базе)
      try {
        const response = await fetch(`${API_BASE_URL}/api/users`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(rawInitData
              ? {
                  Authorization: `Bearer ${rawInitData}`,
                  "x-telegram-init-data": rawInitData,
                }
              : { "x-guest-mode": "true" }),
          },
          body: JSON.stringify({
            telegramId: resolvedTelegramId,
            username: resolvedUsername,
            language: resolvedLanguage,
            initData: rawInitData,
          }),
        });

        if (response.ok) {
          const data: DbUser = await response.json();
          if (isMounted && data) {
            setDbUser(data);

            // Автоматическое применение языка, выбранного пользователем в Telegram-боте
            const dbLang = data.language;
            setAppLanguage((dbLang as Language) || "ru");

            if (typeof data.level === "number") {
              try {
                localStorage.setItem("skilltree_level", String(data.level));
                window.dispatchEvent(
                  new CustomEvent("skilltree:level-updated", {
                    detail: { level: data.level, skills: data.skills || [] },
                  })
                );
              } catch {}
            }
          }
        }
      } catch (authError) {
        console.warn(
          "⚠️ [TelegramProvider] Ошибка первичной авторизации:",
          authError
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
          // Шаг 1 воронки: app_opened (при успешной инициализации пользователя в TelegramProvider)
          trackEvent("app_opened", {
            telegram_id: resolvedTelegramId,
            username: resolvedUsername,
            platform: tg?.platform || "web",
            language: resolvedLanguage,
          });
        }
      }
    }

    initializeTelegramAndAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const expand = useCallback(() => {
    if (typeof window !== "undefined" && window.Telegram?.WebApp) {
      window.Telegram.WebApp.expand();
    }
  }, []);

  const syncUser = useCallback(
    async (extraData: SyncUserPayload = {}) => {
      const resolvedTelegramId = user?.id
        ? String(user.id)
        : (typeof window !== "undefined"
            ? localStorage.getItem("skilltree_telegram_id")
            : null) || "guest_dev";

      const resolvedUsername =
        user?.username ||
        (user
          ? `${user.first_name} ${user.last_name || ""}`.trim()
          : "Frontend Samurai");

      try {
        const response = await fetch(`${API_BASE_URL}/api/users`, {
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
            telegramId: resolvedTelegramId,
            username: resolvedUsername,
            initData,
            ...extraData,
          }),
        });

        if (response.ok) {
          const updated: DbUser = await response.json();
          setDbUser(updated);
          return updated;
        }
      } catch (err) {
        console.warn("⚠️ [TelegramProvider] Ошибка синхронизации:", err);
      }
      return null;
    },
    [user, initData]
  );

  const telegramId = useMemo(() => {
    if (user?.id) return String(user.id);
    if (typeof window !== "undefined") {
      return localStorage.getItem("skilltree_telegram_id") || "guest_dev";
    }
    return "guest_dev";
  }, [user]);

  const username = useMemo(() => {
    if (user?.username) return user.username;
    if (user?.first_name) {
      return `${user.first_name} ${user.last_name || ""}`.trim();
    }
    return dbUser?.username || "Frontend Samurai";
  }, [user, dbUser]);

  const contextValue = useMemo<TelegramContextType>(
    () => ({
      user,
      webApp,
      tg: webApp,
      dbUser,
      telegramId,
      username,
      initData,
      isLoading,
      expand,
      syncUser,
      setDbUser,
    }),
    [
      user,
      webApp,
      dbUser,
      telegramId,
      username,
      initData,
      isLoading,
      expand,
      syncUser,
    ]
  );

  return (
    <TelegramContext.Provider value={contextValue}>
      {children}
    </TelegramContext.Provider>
  );
}

/**
 * Кастомный хук для синхронного получения данных пользователя и Telegram Web App из контекста
 */
export function useTelegram(): TelegramContextType {
  const context = useContext(TelegramContext);
  if (!context) {
    throw new Error("useTelegram must be used within a TelegramProvider");
  }
  return context;
}
