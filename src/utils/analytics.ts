/**
 * Вспомогательная утилита для сбора продуктовой аналитики (воронка SkillTree)
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://skilltree-backend-swuh.onrender.com";

export type FunnelEventType =
  | "app_opened"
  | "skill_clicked"
  | "vacancy_viewed"
  | "quiz_completed"
  | "vacancy_apply_clicked"
  | (string & {});

/**
 * Отправка события продуктовой аналитики на бэкенд
 * @param eventType Название события (например: 'app_opened', 'skill_clicked', 'vacancy_viewed', 'quiz_completed', 'vacancy_apply_clicked')
 * @param payload Дополнительные метаданные события (объект)
 */
export async function trackEvent(
  eventType: FunnelEventType,
  payload: Record<string, unknown> = {}
): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    const tg = window.Telegram?.WebApp;
    const initData =
      tg?.initData ||
      sessionStorage.getItem("skilltree_init_data") ||
      "";

    const telegramId =
      tg?.initDataUnsafe?.user?.id
        ? String(tg.initDataUnsafe.user.id)
        : localStorage.getItem("skilltree_telegram_id") || "guest_dev";

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (initData) {
      headers["Authorization"] = `Bearer ${initData}`;
      headers["x-telegram-init-data"] = initData;
    } else {
      headers["x-guest-mode"] = "true";
    }

    // Неблокирующий запрос аналитики
    fetch(`${API_BASE_URL}/api/analytics/track`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        eventType,
        telegram_id: telegramId,
        payload,
      }),
    }).catch((err) => {
      console.warn(`[Analytics] Не удалось отправить событие ${eventType}:`, err);
    });
  } catch (err) {
    console.warn(`[Analytics] Ошибка в trackEvent (${eventType}):`, err);
  }
}
