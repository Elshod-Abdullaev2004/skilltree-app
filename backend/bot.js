const { Telegraf, Markup } = require("telegraf");
const User = require("./models/User");

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

  // 1. Обработчик команды /start: выбор языка (Русский / O'zbekcha)
  bot.start(async (ctx) => {
    await ctx.reply(
      "Выберите язык / Tilni tanlang:",
      Markup.inlineKeyboard([
        [
          Markup.button.callback("🇷🇺 Русский", "lang_ru"),
          Markup.button.callback("🇺🇿 O'zbekcha", "lang_uz"),
        ],
      ])
    );
  });

  // 2. Вспомогательная функция сохранения языка в MongoDB и отправки приветствия
  const handleLanguageSelection = async (ctx, lang) => {
    try {
      await ctx.answerCbQuery();
    } catch {
      // ignore callback query timeout
    }

    const from = ctx.from || {};
    const telegramId = String(from.id || "unknown");
    const firstName = from.first_name || (lang === "uz" ? "Dasturchi" : "Разработчик");
    const username =
      from.username ||
      `${from.first_name || ""} ${from.last_name || ""}`.trim() ||
      `user_${telegramId}`;

    // Сохраняем выбранный язык в коллекцию User в MongoDB
    try {
      await User.findOneAndUpdate(
        { telegramId },
        {
          $set: {
            telegramId,
            username,
            language: lang,
          },
        },
        { upsert: true, new: true }
      );
    } catch (dbErr) {
      console.error("❌ [Telegram Bot] Ошибка сохранения языка в БД:", dbErr.message);
    }

    if (lang === "uz") {
      const uzWelcome =
        `Salom, ${firstName}! 👋\n\n` +
        `*SkillTree* startapiga xush kelibsiz — bu IT sohasida birinchi ishni topish va ko'nikmalarni doimiy rivojlantirish uchun sizning navigatoringiz!\n\n` +
        `Ilova ichida sizni quyidagilar kutmoqda:\n` +
        `• 🎯 Yangi amaliyotlar (stajirovka) va Junior vakansiyalar\n` +
        `• ⚡ HR talablariga mos AI-rezyume generatori\n` +
        `• ⚔️ AI-mentor bilan texnik suhbat trenajori\n` +
        `• 🌳 Interaktiv Ko'nikmalar Daraxti (SkillTree)\n\n` +
        `Ilovani ishga tushirish uchun quyidagi tugmani bosing:`;

      await ctx.reply(uzWelcome, {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([
          [Markup.button.webApp("🚀 SkillTree-ni ochish", webAppUrl)],
        ]),
      });
    } else {
      const ruWelcome =
        `Привет, ${firstName}! 👋\n\n` +
        `Добро пожаловать в *SkillTree* — твой навигатор для поиска первой работы в IT и непрерывной прокачки навыков!\n\n` +
        `Внутри мини-приложения тебя ждут:\n` +
        `• 🎯 Свежие стажировки и Junior-вакансии\n` +
        `• ⚡ Генератор ИИ-резюме под требования HR\n` +
        `• ⚔️ Тренажер технических собеседований с ИИ-ментором\n` +
        `• 🌳 Интерактивное Дерево навыков (SkillTree)\n\n` +
        `Нажми кнопку ниже, чтобы запустить приложение:`;

      await ctx.reply(ruWelcome, {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([
          [Markup.button.webApp("🚀 Открыть SkillTree", webAppUrl)],
        ]),
      });
    }
  };

  bot.action("lang_ru", (ctx) => handleLanguageSelection(ctx, "ru"));
  bot.action("lang_uz", (ctx) => handleLanguageSelection(ctx, "uz"));

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
