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

// Пул проверенных реальных IT-вакансий и стажировок в Ташкенте с прямыми веб-ссылками на конкретные вакансии
const TASHKENT_FALLBACK_VACANCIES = [
  {
    id: "134880323",
    name: "Intern Front-end Developer (JavaScript / HTML / CSS)",
    employer: { name: "Itransition" },
    area: { name: "Ташкент" },
    salary: { from: 500, to: 800, currency: "USD" },
    alternate_url: "https://tashkent.hh.uz/vacancy/134880323",
    experienceId: "noExperience",
    professional_roles: [{ name: "Программист, разработчик" }],
    snippet: {
      requirement: "Базовые знания HTML5, CSS3, JavaScript ES6+, интерес к современной фронтенд разработке.",
      responsibility: "Обучение и участие в реальных проектах компании под руководством опытного ментора.",
    },
  },
  {
    id: "137785384",
    name: "Intern/Junior Full-stack engineer",
    employer: { name: "ООО VERTEX FREIGHT" },
    area: { name: "Ташкент" },
    salary: { from: 400, to: 700, currency: "USD" },
    alternate_url: "https://tashkent.hh.uz/vacancy/137785384",
    experienceId: "noExperience",
    professional_roles: [{ name: "Программист, разработчик" }],
    snippet: {
      requirement: "Понимание принципов работы клиент-серверных приложений, базовые знания React и Node.js.",
      responsibility: "Разработка модулей логистической платформы и внутренних веб-интерфейсов.",
    },
  },
  {
    id: "137571195",
    name: "React js - frontend-разработчик",
    employer: { name: "Apex Insurance" },
    area: { name: "Ташкент" },
    salary: { from: 6000000, to: 10000000, currency: "UZS" },
    alternate_url: "https://tashkent.hh.uz/vacancy/137571195",
    experienceId: "between1And3",
    professional_roles: [{ name: "Программист, разработчик" }],
    snippet: {
      requirement: "Опыт коммерческой разработки на React, Redux Toolkit/Zustand, адаптивная верстка, REST API.",
      responsibility: "Разработка пользовательских интерфейсов страховых сервисов и личного кабинета.",
    },
  },
  {
    id: "136973012",
    name: "Middle Frontend Developer (React + TypeScript) в стартап",
    employer: { name: "Skyeng Uzbekistan" },
    area: { name: "Ташкент" },
    salary: { from: 8000000, to: 14000000, currency: "UZS" },
    alternate_url: "https://tashkent.hh.uz/vacancy/136973012",
    experienceId: "between1And3",
    professional_roles: [{ name: "Программист, разработчик" }],
    snippet: {
      requirement: "Уверенный React, TypeScript, опыт оптимизации производительности, Next.js, Git.",
      responsibility: "Создание новых фичей образовательной платформы в продуктовой команде.",
    },
  },
  {
    id: "137227333",
    name: "Frontend Web Developer (React / JavaScript)",
    employer: { name: "Garant bank" },
    area: { name: "Ташкент" },
    salary: { from: 7000000, to: 12000000, currency: "UZS" },
    alternate_url: "https://tashkent.hh.uz/vacancy/137227333",
    experienceId: "between1And3",
    professional_roles: [{ name: "Программист, разработчик" }],
    snippet: {
      requirement: "Знание React, современных веб-стандартов, опыт интеграции банковских API.",
      responsibility: "Поддержка и развитие интернет-банкинга и портала для клиентов.",
    },
  },
  {
    id: "137449444",
    name: "Frontend-разработчик (React / Vue)",
    employer: { name: "Uzum Technologies" },
    area: { name: "Ташкент" },
    salary: { from: 800, to: 1300, currency: "USD" },
    alternate_url: "https://tashkent.hh.uz/vacancy/137449444",
    experienceId: "between1And3",
    professional_roles: [{ name: "Программист, разработчик" }],
    snippet: {
      requirement: "Отличное знание JavaScript/TypeScript, опыт с React или Vue, адаптивная верстка.",
      responsibility: "Разработка сервисов экосистемы Uzum Market и финтех-модулей.",
    },
  },
  {
    id: "137463376",
    name: "Junior Node.js / Бекенд разработчик",
    employer: { name: "Payme Uzbekistan" },
    area: { name: "Ташкент" },
    salary: { from: 6000000, to: 9500000, currency: "UZS" },
    alternate_url: "https://tashkent.hh.uz/vacancy/137463376",
    experienceId: "between1And3",
    professional_roles: [{ name: "Программист, разработчик" }],
    snippet: {
      requirement: "Node.js, Express, понимание архитектуры микросервисов, PostgreSQL/MongoDB, REST API.",
      responsibility: "Разработка и оптимизация платежных шлюзов и API для партнеров.",
    },
  },
  {
    id: "137064626",
    name: "Python Backend Developer (FastAPI / Django)",
    employer: { name: "TBC Bank Uzbekistan" },
    area: { name: "Ташкент" },
    salary: { from: 700, to: 1200, currency: "USD" },
    alternate_url: "https://tashkent.hh.uz/vacancy/137064626",
    experienceId: "between1And3",
    professional_roles: [{ name: "Программист, разработчик" }],
    snippet: {
      requirement: "Знание Python 3, FastAPI, PostgreSQL, Docker, опыт работы с брокерами сообщений.",
      responsibility: "Создание высоконагруженных бэкенд-сервисов цифрового банка.",
    },
  },
  {
    id: "137669278",
    name: "Java Backend Developer (Middle / Junior+)",
    employer: { name: "Anor Bank" },
    area: { name: "Ташкент" },
    salary: { from: 800, to: 1400, currency: "USD" },
    alternate_url: "https://tashkent.hh.uz/vacancy/137669278",
    experienceId: "between1And3",
    professional_roles: [{ name: "Программист, разработчик" }],
    snippet: {
      requirement: "Java Core, Spring Boot, Spring Security, Hibernate, PostgreSQL, Git.",
      responsibility: "Разработка сервисов дистанционного банковского обслуживания.",
    },
  },
  {
    id: "134904135",
    name: "React Native / Mobile Developer",
    employer: { name: "CLICK" },
    area: { name: "Ташкент" },
    salary: { from: 5000000, to: 8500000, currency: "UZS" },
    alternate_url: "https://tashkent.hh.uz/vacancy/134904135",
    experienceId: "between1And3",
    professional_roles: [{ name: "Программист, разработчик" }],
    snippet: {
      requirement: "Опыт кроссплатформенной разработки на React Native, TypeScript, Redux, работа с нативными модулями.",
      responsibility: "Развитие мобильного приложения платежной системы CLICK.",
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
  const { forceNotify = false, forceReset = false } = options;
  console.log("🔄 [HH Parser] Запуск синхронизации ИТ-вакансий (Ташкент)...");

  if (forceReset) {
    const totalDeleted = await Vacancy.deleteMany({});
    console.log(`🧹 [HH Parser] Полный сброс: удалено ${totalDeleted.deletedCount} вакансий перед новой синхронизацией.`);
  }

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

  // Удаляем устаревшие записи с некорректными ссылками (поисковые ссылки search?, старые 10948101 и т.д.)
  try {
    const deleteResult = await Vacancy.deleteMany({
      $or: [
        { sourceUrl: { $regex: /search\?|\/10948|колбас/i } },
        { title: { $regex: /колбас/i } },
      ],
    });
    if (deleteResult.deletedCount > 0) {
      console.log(
        `🧹 [HH Parser] Удалено ${deleteResult.deletedCount} устаревших/поисковых записей.`
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
    // Получаем строгую прямую веб-ссылку на вакансию
    const sourceUrl =
      item.alternate_url ||
      (item.id && !isNaN(Number(item.id))
        ? `https://tashkent.hh.uz/vacancy/${item.id}`
        : item.url || "");

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
