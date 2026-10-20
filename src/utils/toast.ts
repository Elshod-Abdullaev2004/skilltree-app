/**
 * Вспомогательная утилита для отображения глобальных нео-бруталистских Toast-уведомлений
 */
export function showToast(message: string, duration = 3500) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("skilltree:toast", {
      detail: { message, duration },
    })
  );
}
