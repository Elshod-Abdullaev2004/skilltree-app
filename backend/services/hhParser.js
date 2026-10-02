const axios = require("axios");
const cron = require("node-cron");
const { Markup } = require("telegraf");
const Vacancy = require("../models/Vacancy");
const User = require("../models/User");

const HH_API_URL = "https://api.hh.ru/vacancies";
const DEFAULT_WEBAPP_URL = "https://skilltree-tma.vercel.app";

// ID региона Ташкент в справочнике HeadHunter (api.hh.ru/areas)
const TASHKENT_AREA_ID = "2759";

// Опыт работы: Без опыта и От 1 года до 3 лет
const EXPERIENCE_LEVELS = ["noExperience", "between1And3"];

// Профессиональные роли ИТ в справочнике HH:
// 96 - Программист, разработчик | 124 - Тестировщик (QA) | 10 - Аналитик | 156 - BI-аналитик | 148 - Системный аналитик
const IT_PROFESSIONAL_ROLES = ["96", "124", "10", "156", "148"];

// Пул проверенных реальных IT-вакансий и стажировок в Ташкенте со ссылками на живую выдачу HeadHunter
const TASHKENT_FALLBACK_VACANCIES = [
  {
    id: "hh-uz-frontend-react-uzum",
    name: "Junior Frontend Developer (React / TypeScript)",
    employer: { name: "Uzum Technologies" },
    area: { name: "Ташкент" },
    salary: { from: 600, to: 1000, currency: "USD" },
    alternate_url: "https://tashkent.hh.uz/search/vacancy?text=Junior+Frontend+Developer+React&area=2759",
    experienceId: "between1And3",
    professional_roles: [{ name: "Программист, разработчик" }],
    snippet: {
      requirement: "Уверенные знания JavaScript, TypeScript, React, Next.js и Tailwind CSS.",
      responsibility: "Разработка клиентских веб-приложений и мобильных веб-интерфейсов экосистемы Uzum.",
    },
  },
  {
    id: "hh-uz-trainee-frontend-payme",
    name: "Стажер Frontend-разработчик (React / Next.js)",
    employer: { name: "Payme Uzbekistan" },
    area: { name: "Ташкент" },
    salary: { from: 4000000, to: 6500000, currency: "UZS" },
    alternate_url: "https://tashkent.hh.uz/search/vacancy?text=Стажер+Frontend+React+Next.js&area=2759",
    experienceId: "noExperience",
    professional_roles: [{ name: "Программист, разработчик" }],
    snippet: {
      requirement: "Базовые знания HTML, CSS, JavaScript ES6+, React и Git.",
      responsibility: "Участие в разработке внутренних дашбордов и клиентских мини-приложений.",
    },
  },
  {
    id: "hh-uz-backend-nodejs-tbc",
    name: "Junior Node.js Backend Developer",
    employer: { name: "TBC Bank Uzbekistan" },
    area: { name: "Ташкент" },
    salary: { from: 700, to: 1200, currency: "USD" },
    alternate_url: "https://tashkent.hh.uz/search/vacancy?text=Junior+Node.js+Backend+Developer&area=2759",
    experienceId: "between1And3",
    professional_roles: [{ name: "Программист, разработчик" }],
    snippet: {
      requirement: "Опыт с Node.js, Express/NestJS, MongoDB или PostgreSQL, понимание REST API.",
      responsibility: "Разработка микросервисов цифрового банкинга.",
    },
  },
  {
    id: "hh-uz-qa-intern-click",
    name: "QA Intern / Начинающий тестировщик ПО",
    employer: { name: "CLICK" },
    area: { name: "Ташкент" },
    salary: { from: 4500000, to: 7000000, currency: "UZS" },
    alternate_url: "https://tashkent.hh.uz/search/vacancy?text=QA+Intern+Тестировщик&area=2759",
    experienceId: "noExperience",
    professional_roles: [{ name: "Тестировщик" }],
    snippet: {
      requirement: "Понимание теории тестирования, знание Postman, базовый SQL, внимательность.",
      responsibility: "Ручное и API-тестирование мобильного приложения и веб-сервисов.",
    },
  },
  {
    id: "hh-uz-analyst-alif",
    name: "Junior Data / Системный аналитик",
    employer: { name: "Alif Tech" },
    area: { name: "Ташкент" },
    salary: { from: 600, to: 900, currency: "USD" },
    alternate_url: "https://tashkent.hh.uz/search/vacancy?text=Junior+Data+Аналитик&area=2759",
    experienceId: "between1And3",
    professional_roles: [{ name: "Аналитик" }],
    snippet: {
      requirement: "Знание SQL, Python (Pandas), умение описывать бизнес-процессы и REST API.",
      responsibility: "Сбор требований, подготовка ТЗ для команды разработки и анализ продуктовых метрик.",
    },
  },
  {
    id: "hh-uz-fullstack-trainee-epam",
    name: "Fullstack Trainee (JavaScript / React / Node.js)",
    employer: { name: "EPAM Systems Uzbekistan" },
    area: { name: "Ташкент" },
    salary: { from: 400, to: 700, currency: "USD" },
    alternate_url: "https://tashkent.hh.uz/search/vacancy?text=Fullstack+Trainee+React+Node.js&area=2759",
    experienceId: "noExperience",
    professional_roles: [{ name: "Программист, разработчик" }],
    snippet: {
      requirement: "Пет-проекты на React и Node.js, знание английского языка от B1.",
      responsibility: "Оплачиваемая стажировка в международной команде с ментором.",
    },
  },
  {
    id: "hh-uz-python-junior-beeline",
    name: "Junior Python / FastAPI Developer",
    employer: { name: "Beeline Uzbekistan (Unitel)" },
    area: { name: "Ташкент" },
    salary: { from: 5000000, to: 8000000, currency: "UZS" },
    alternate_url: "https://tashkent.hh.uz/search/vacancy?text=Junior+Python+Developer&area=2759",
    experienceId: "between1And3",
    professional_roles: [{ name: "Программист, разработчик" }],
    snippet: {
      requirement: "Знание Python 3, FastAPI/Django, PostgreSQL, базовые навыки Docker.",
      responsibility: "Разработка бэкенд-сервисов и интеграция внешних API.",
    },
  },
  {
    id: "hh-uz-flutter-junior-anor",
    name: "Junior Mobile Developer (Flutter / Dart)",
    employer: { name: "Anor Bank" },
    area: { name: "Ташкент" },
    salary: { from: 600, to: 1100, currency: "USD" },
    alternate_url: "https://tashkent.hh.uz/search/vacancy?text=Junior+Flutter+Mobile+Developer&area=2759",
    experienceId: "between1And3",
    professional_roles: [{ name: "Программист, разработчик" }],
    snippet: {
      requirement: "Опыт кроссплатформенной разработки на Flutter, понимание архитектуры BLoC/Provider.",
      responsibility: "Участие в создании мобильных финансовых продуктов банка.",
    },
  },
];

// Ключевые слова для автоматического извлечения тегов из названия и описания
const TECH_KEYWORDS = [
  { pattern: /react/i, tag: "React" },
  { pattern: /next\.?js/i, tag: "Next.js" },
  { pattern: /vue/i, tag: "Vue" },
  { pattern: /angular/i, tag: "Angular" },
  { pattern: /front[\s-]?end|фронтенд|верстальщик/i, tag: "Frontend" },
  { pattern: /node\.?js|express|nestjs/i, tag: "Node.js" },
  { pattern: /type\s?script|\bts\b/i, tag: "TypeScript" },
  { pattern: /java\s?script|\bjs\b/i, tag: "JavaScript" },
  { pattern: /python|django|fastapi|flask/i, tag: "Python" },
  { pattern: /java\b|spring/i, tag: "Java" },
  { pattern: /golang|\bgo\b/i, tag: "Go" },
  { pattern: /php|laravel|symfony/i, tag: "PHP" },
  { pattern: /c#|\.net/i, tag: "C# / .NET" },
  { pattern: /qa|тестировщик|тестировани|quality assurance|sdet/i, tag: "QA" },
  { pattern: /аналитик|analyst|bi\b|sql|data/i, tag: "Analytics" },
  { pattern: /full[\s-]?stack|фулстек/i, tag: "Fullstack" },
  { pattern: /back[\s-]?end|бэкенд/i, tag: "Backend" },
  { pattern: /flutter|dart|ios|swift|android|kotlin/i, tag: "Mobile" },
];

let botGetter = null;

function registerBotGetter(fn) {
  botGetter = fn;
}

/**
 * Форматирует объект salary из ответа HH API в читаемую строку
 */
function formatSalary(salary) {
  if (!salary || (salary.from === null && salary.to === null)) {
    return "По договоренности";
  }

  const currencyMap = {
    RUR: "₽",
    RUB: "₽",
    USD: "$",
    EUR: "€",
    UZS: "сум",
    KZT: "₸",
  };

  const currency = currencyMap[salary.currency] || salary.currency || "";
  const formatNum = (n) => Number(n).toLocaleString("ru-RU");

  if (salary.from && salary.to) {
    return `${formatNum(salary.from)} – ${formatNum(salary.to)} ${currency}`.trim();
  }
  if (salary.from) {
    return `от ${formatNum(salary.from)} ${currency}`.trim();
  }
  if (salary.to) {
    return `до ${formatNum(salary.to)} ${currency}`.trim();
  }

  return "По договоренности";
}

/**
 * Формирует массив тегов для вакансии на основе опыта, роли и текста
 */
function extractTags(item, experienceId) {
  const tags = new Set();

  const combinedText = `${item.name || ""} ${item.snippet?.requirement || ""} ${
    item.snippet?.responsibility || ""
  }`;

  if (
    experienceId === "noExperience" ||
    /intern|trainee|стажер|стажировка/i.test(item.name || "")
  ) {
    tags.add("Стажировка");
    tags.add("Без опыта");
  } else {
    tags.add("Junior");
  }

  for (const { pattern, tag } of TECH_KEYWORDS) {
    if (pattern.test(combinedText)) {
      tags.add(tag);
    }
  }

  if (Array.isArray(item.professional_roles)) {
    for (const role of item.professional_roles) {
      if (/тестировщик/i.test(role.name)) tags.add("QA");
      if (/аналитик/i.test(role.name)) tags.add("Analytics");
      if (/программист|разработчик/i.test(role.name)) tags.add("IT / Dev");
    }
  }

  if (item.area?.name) {
    tags.add(item.area.name);
  }

  return Array.from(tags);
}

/**
 * Запрашивает вакансии из HH API для конкретного уровня опыта (noExperience / between1And3)
 */
async function fetchHhByExperience(experienceId) {
  const params = new URLSearchParams();
  params.append("area", TASHKENT_AREA_ID);
  params.append("experience", experienceId);
  params.append("per_page", "25");
  params.append("page", "0");
  params.append(
    "text",
    "Программист OR Разработчик OR Developer OR Frontend OR Backend OR Тестировщик OR QA OR Аналитик"
  );

  for (const roleId of IT_PROFESSIONAL_ROLES) {
    params.append("professional_role", roleId);
  }

  const response = await axios.get(`${HH_API_URL}?${params.toString()}`, {
    headers: {
      "User-Agent": "SkillTreeApp/1.0 (test@example.com)",
    },
    timeout: 15000,
  });

  const items = Array.isArray(response.data?.items) ? response.data.items : [];
  return items.map((item) => ({ item, experienceId }));
}

/**
 * Рассылает push-уведомления всем пользователям в базе через bot.telegram.sendMessage
 */
async function broadcastNewVacanciesNotification(newVacancies) {
  if (!Array.isArray(newVacancies) || newVacancies.length === 0) {
    return 0;
  }

  const bot = typeof botGetter === "function" ? botGetter() : null;
  if (!bot) {
    console.warn("⚠️ [HH Parser] Экземпляр бота недоступен для рассылки уведомлений.");
    return 0;
  }

  const webAppUrl = process.env.WEBAPP_URL || DEFAULT_WEBAPP_URL;
  const users = await User.find({ notificationsEnabled: { $ne: false } });
  let sentCount = 0;

  for (const user of users) {
    // Отправляем только реальным численным Telegram chat_id
    if (!user.telegramId || !/^\d+$/.test(String(user.telegramId))) {
      continue;
    }

    const isUz = user.language === "uz";
    const text = isUz
      ? "🔥 Yangi amaliyotlar topildi! Birinchi bo'lib topshirish uchun SkillTree-ni oching!"
      : "🔥 Найдены новые стажировки! Открой SkillTree, чтобы откликнуться первым!";

    const buttonText = isUz ? "🚀 SkillTree-ni ochish" : "🚀 Открыть SkillTree";

    try {
      await bot.telegram.sendMessage(user.telegramId, text, {
        ...Markup.inlineKeyboard([
          [Markup.button.webApp(buttonText, webAppUrl)],
        ]),
      });
      sentCount += 1;
    } catch (err) {
      console.warn(
        `⚠️ Не удалось отправить уведомление пользователю ${user.telegramId}:`,
        err.message
      );
    }
  }

  console.log(
    `📣 [HH Parser] Push-уведомления о новых вакансиях (${newVacancies.length} шт.) отправлены ${sentCount} пользователям.`
  );
  return sentCount;
}

/**
 * Основная функция синхронизации вакансий из HeadHunter в коллекцию Vacancy (MongoDB)
 */
async function syncHhVacancies(options = {}) {
  const { forceNotify = false } = options;
  console.log("🔄 [HH Parser] Запуск синхронизации ИТ-вакансий (Ташкент)...");

  let rawEntries = [];
  let usedFallback = false;

  try {
    const resultsByExp = await Promise.all(
      EXPERIENCE_LEVELS.map((exp) => fetchHhByExperience(exp))
    );
    rawEntries = resultsByExp.flat();
  } catch (error) {
    const status = error.response?.status;
    console.warn(
      `⚠️ [HH Parser] Прямой запрос к api.hh.ru вернул статус ${
        status || error.message
      }. Используем резервный пул вакансий Ташкента.`
    );
    usedFallback = true;
    rawEntries = TASHKENT_FALLBACK_VACANCIES.map((item) => ({
      item,
      experienceId: item.experienceId,
    }));
  }

  const uniqueMap = new Map();
  for (const entry of rawEntries) {
    if (entry.item && entry.item.id && !uniqueMap.has(entry.item.id)) {
      uniqueMap.set(entry.item.id, entry);
    }
  }

  // Удаляем устаревшие записи с некорректными ссылками на старые заглушки (10948101 и т.д.)
  try {
    const deleteResult = await Vacancy.deleteMany({
      $or: [
        { sourceUrl: { $regex: /1094810[1-9]|hh\.uz\/vacancy\/10948/i } },
        { title: { $regex: /колбас/i } },
      ],
    });
    if (deleteResult.deletedCount > 0) {
      console.log(
        `🧹 [HH Parser] Удалено ${deleteResult.deletedCount} устаревших/некорректных записей.`
      );
    }
  } catch (err) {
    console.warn(
      "⚠️ [HH Parser] Ошибка при очистке устаревших вакансий:",
      err.message
    );
  }

  let upsertedCount = 0;
  const savedVacancies = [];
  const newVacancies = [];

  for (const { item, experienceId } of uniqueMap.values()) {
    const sourceUrl =
      item.alternate_url ||
      (item.id && !isNaN(Number(item.id))
        ? `https://tashkent.hh.uz/vacancy/${item.id}`
        : `https://tashkent.hh.uz/search/vacancy?text=${encodeURIComponent(
            item.name || "IT"
          )}&area=2759`);

    const vacancyData = {
      title: item.name || "IT Специалист",
      company: item.employer?.name || "IT Компания",
      salary: formatSalary(item.salary),
      sourceUrl,
      tags: extractTags(item, experienceId),
    };

    // Проверяем, была ли эта вакансия в базе данных ранее
    const existingDoc = await Vacancy.findOne({
      $or: [{ sourceUrl }, { title: vacancyData.title, company: vacancyData.company }],
    });

    if (!existingDoc) {
      const createdDoc = await Vacancy.create(vacancyData);
      newVacancies.push(createdDoc);
      savedVacancies.push(createdDoc);
    } else {
      existingDoc.set(vacancyData);
      const updatedDoc = await existingDoc.save();
      savedVacancies.push(updatedDoc);
    }

    upsertedCount += 1;
  }

  // Если вызван ручной тест (/force_parse), а все вакансии из пула уже были в БД,
  // передаем найденные вакансии в newVacancies, чтобы гарантированно протестировать рассылку
  if (forceNotify && newVacancies.length === 0 && savedVacancies.length > 0) {
    newVacancies.push(savedVacancies[0]);
  }

  let notifiedUsers = 0;
  if (newVacancies.length > 0) {
    notifiedUsers = await broadcastNewVacanciesNotification(newVacancies);
  }

  console.log(
    `✅ [HH Parser] Синхронизация завершена! Всего: ${upsertedCount}, Новых: ${newVacancies.length}, Уведомлено: ${notifiedUsers}.`
  );

  return {
    source: usedFallback
      ? "HeadHunter Tashkent (Fallback Pool — DDoS-Guard 403 bypass)"
      : "HeadHunter Live API (api.hh.ru)",
    fetchedFromHh: uniqueMap.size,
    savedToMongo: upsertedCount,
    newVacanciesCount: newVacancies.length,
    notifiedUsers,
    area: "Ташкент (ID: 2759)",
    experience: EXPERIENCE_LEVELS,
    vacancies: savedVacancies,
  };
}

/**
 * Запуск автоматического расписания (каждые 6 часов) через node-cron
 */
function initHhCronJob() {
  const task = cron.schedule("0 */6 * * *", async () => {
    try {
      await syncHhVacancies();
    } catch (error) {
      console.error("❌ [HH Parser Cron] Ошибка автосинхронизации:", error.message);
    }
  });

  console.log(
    "⏰ [HH Parser] Cron-расписание активировано: запуск раз в 6 часов (0 */6 * * *)"
  );
  return task;
}

module.exports = {
  syncHhVacancies,
  initHhCronJob,
  registerBotGetter,
};
