const { Telegraf, Markup } = require("telegraf");

// Продакшен HTTPS URL нашего Next.js фронтенда на Vercel
const DEFAULT_WEBAPP_URL = "https://skilltree-tma.vercel.app";

let botInstance = null;

function startBot() {
  const token = process.env.BOT_TOKEN;

  if (!token || token === "ЗДЕСЬ_БУДЕТ_ТОКЕН_БОТА") {
    console.warn(
      "⚠️ [Telegram Bot] Переменная BOT_TOKEN не задана в .env. Добавьте BOT_TOKEN и перезапустите сервер."
    );
    return null;
  }

  const bot = new Telegraf(token);
  const webAppUrl = process.env.WEBAPP_URL || DEFAULT_WEBAPP_URL;

  // Обработчик команды /start
  bot.start(async (ctx) => {
    const firstName = ctx.from?.first_name || "Разработчик";

    const welcomeText =
      `Привет, ${firstName}! 👋\n\n` +
      `Добро пожаловать в *SkillTree* — твой навигатор для поиска первой работы в IT и непрерывной прокачки навыков!\n\n` +
      `Внутри мини-приложения тебя ждут:\n` +
      `• 🎯 Свежие стажировки и Junior-вакансии\n` +
      `• ⚡ Генератор ИИ-резюме под требования HR\n` +
      `• ⚔️ Тренажер технических собеседований с ИИ-ментором\n` +
      `• 🌳 Интерактивное Дерево навыков (SkillTree)\n\n` +
      `Нажми кнопку ниже, чтобы запустить приложение:`;

    await ctx.reply(welcomeText, {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        [Markup.button.webApp("🚀 Открыть SkillTree", webAppUrl)],
      ]),
    });
  });

  // Проверяем токен через getMe(), устанавливаем кнопку меню WebApp и запускаем long-polling
  bot.telegram
    .getMe()
    .then(async (botInfo) => {
      console.log(
        `🤖 [Telegram Bot] Бот @${botInfo.username} успешно авторизован! WebApp URL: ${webAppUrl}`
      );
      try {
        await bot.telegram.setChatMenuButton({
          menuButton: {
            type: "web_app",
            text: "🚀 SkillTree",
            web_app: { url: webAppUrl },
          },
        });
      } catch (menuErr) {
        console.warn("⚠️ Не удалось обновить Menu Button:", menuErr.message);
      }
    })
    .catch((err) => {
      console.error("❌ [Telegram Bot] Ошибка авторизации токена:", err.message);
    });

  bot.launch().catch((err) => {
    console.error("❌ [Telegram Bot] Ошибка работы polling:", err.message);
  });

  // Корректная остановка бота при завершении процесса
  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));

  botInstance = bot;
  return bot;
}

module.exports = { startBot, getBot: () => botInstance };
