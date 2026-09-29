"use client";

import { useEffect, useState, useCallback } from "react";

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

export interface SyncUserPayload {
  language?: "ru" | "uz";
  rank?: string;
  unlockedSkills?: string[];
  notificationsEnabled?: boolean;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://skilltree-backend-swuh.onrender.com";

/**
 * Отправляет данные пользователя из Telegram (initDataUnsafe.user) на бэкенд POST /api/users
 */
export async function sendTelegramUserToBackend(
  tgUser: TelegramUser,
  extraData: SyncUserPayload = {}
) {
  try {
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL ||
      "https://skilltree-backend-swuh.onrender.com";
    const response = await fetch(`${apiUrl}/api/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        telegramId: String(tgUser.id),
        username:
          tgUser.username ||
          `${tgUser.first_name} ${tgUser.last_name || ""}`.trim() ||
          `user_${tgUser.id}`,
        ...extraData,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.warn("Не удалось синхронизировать пользователя с /api/users:", error);
    return null;
  }
}

export function useTelegram() {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
  const [user, setUser] = useState<TelegramUser | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const initTelegram = () => {
      const tg = window.Telegram?.WebApp;
      if (tg) {
        tg.ready();
        tg.expand();
        setWebApp(tg);
        if (tg.initDataUnsafe?.user) {
          const tgUser = tg.initDataUnsafe.user;
          setUser(tgUser);
          // Автоматически отправляем данные пользователя на бэкенд /api/users
          sendTelegramUserToBackend(tgUser);
        }
        return true;
      }
      return false;
    };

    if (!initTelegram()) {
      const timer = setTimeout(initTelegram, 150);
      return () => clearTimeout(timer);
    }
  }, []);

  const expand = useCallback(() => {
    if (typeof window !== "undefined" && window.Telegram?.WebApp) {
      window.Telegram.WebApp.expand();
    }
  }, []);

  const syncUser = useCallback(
    async (extraData: SyncUserPayload = {}) => {
      if (!user) return null;
      return sendTelegramUserToBackend(user, extraData);
    },
    [user]
  );

  return {
    tg: webApp,
    user,
    expand,
    syncUser,
  };
}
