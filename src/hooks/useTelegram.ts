"use client";

export {
  useTelegram,
  TelegramProvider,
  type TelegramUser,
  type TelegramWebApp,
  type DbUser,
  type SyncUserPayload,
  type TelegramContextType,
} from "@/context/TelegramProvider";

import type { TelegramUser, SyncUserPayload } from "@/context/TelegramProvider";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://skilltree-backend-swuh.onrender.com";

/**
 * Вспомогательная функция обратной совместимости
 */
export async function sendTelegramUserToBackend(
  tgUser: TelegramUser,
  extraData: SyncUserPayload = {}
) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/users`, {
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
    console.warn("Не удалось синхронизировать пользователя:", error);
    return null;
  }
}
