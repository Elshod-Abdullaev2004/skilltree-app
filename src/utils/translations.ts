"use client";

import { useState, useEffect, useCallback } from "react";
import { sendTelegramUserToBackend } from "@/hooks/useTelegram";

export type Language = "ru" | "uz";

export function useLanguage() {
  const [lang, setLangState] = useState<Language>("ru");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const saved = localStorage.getItem("skilltree_lang");
    if (saved === "ru" || saved === "uz") {
      setLangState(saved);
    } else {
      const tgLang =
        window.Telegram?.WebApp?.initDataUnsafe?.user?.language_code;
      if (tgLang && tgLang.toLowerCase().startsWith("uz")) {
        setLangState("uz");
      } else {
        setLangState("ru");
      }
    }

    const handleLangUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<{ lang: Language }>;
      if (customEvent.detail?.lang === "ru" || customEvent.detail?.lang === "uz") {
        setLangState(customEvent.detail.lang);
      }
    };

    window.addEventListener("skilltree:lang-updated", handleLangUpdate);
    return () => {
      window.removeEventListener("skilltree:lang-updated", handleLangUpdate);
    };
  }, []);

  const setLanguage = useCallback((nextLang: Language) => {
    setLangState(nextLang);
    if (typeof window !== "undefined") {
      localStorage.setItem("skilltree_lang", nextLang);
      window.dispatchEvent(
        new CustomEvent("skilltree:lang-updated", {
          detail: { lang: nextLang },
        })
      );
      const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
      if (tgUser) {
        sendTelegramUserToBackend(tgUser, { language: nextLang });
      }
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(lang === "ru" ? "uz" : "ru");
  }, [lang, setLanguage]);

  return {
    lang,
    setLanguage,
    toggleLanguage,
    t: translations[lang],
  };
}

export const translations = {
  ru: {
    // Шапка (Header)
    greeting: "Привет",
    defaultUser: "Разработчик",
    chapterVacancies: "ГЛАВА 01 // ДОСКА КВЕСТОВ",
    chapterResume: "ГЛАВА 02 // ИИ-ГЕНЕРАТОР",
    chapterTrainer: "ГЛАВА 03 // ДОДЗЁ МЕНТОРА",
    chapterTree: "ГЛАВА 04 // ДЕРЕВО НАВЫКОВ",
    streakSuffix: "д",

    // Нижняя навигация (BottomNav)
    navVacancies: "Вакансии",
    navTree: "Дерево",
    navResume: "Резюме",
    navTrainer: "Тренажер",

    // Экран Вакансий (Vacancies)
    heroBadgeLive: "ДОСКА ОФФЕРОВ • LIVE",
    vacanciesTitle: "Вакансии для старта",
    inDatabase: "В базе",
    itemsCountSuffix: "шт.",
    botTipLabel: "SKILLTREE AI:",
    botTipText:
      "Свежие ИТ-вакансии и стажировки из базы данных. Выбирай направление и откликайся!",
    filterTitle: "Категории вакансий:",
    resetFilter: "Сбросить фильтр",
    filterAll: "Все",
    filterFrontend: "Frontend",
    filterBackend: "Backend",
    filterNoExp: "Без опыта",
    loadingVacancies: "Загружаем свежие квесты-вакансии с сервера...",
    errorLoadingVacancies:
      "Не удалось загрузить вакансии с сервера. Проверьте соединение и попробуйте снова.",
    retryButton: "Повторить попытку",
    emptyCategoryPrefix: "В категории",
    emptyCategorySuffix: "пока нет вакансий",
    showAllVacancies: "Показать все вакансии",

    // Карточка вакансии (VacancyCard)
    badgeNoExp: "Без опыта / Стажировка",
    badgeJunior: "Junior",
    cityTashkent: "Ташкент",
    salaryLabel: "Зарплата",
    salaryNegotiable: "По договоренности",
    applyButton: "Откликнуться",

    // Экран Дерева Навыков (SkillTree)
    hunterCardBadge: "КАРТОЧКА ОХОТНИКА • SKILLTREE",
    levelLabel: "УРОВЕНЬ",
    skillsWord: "НАВЫКОВ",
    xpAccumulated: "Накоплено опыта:",
    roadmapProgress: "Прогресс Frontend Roadmap",
    roadmapBadge: "FRONTEND ROADMAP • КВИЗ-ПРОВЕРКА",
    treeTitle: "Дерево навыков",
    statusLearned: "Изучено",
    statusNotLearned: "Не изучено",
    treeHint:
      "🎯 Нажми на серый навык и ответь на 1 вопрос, чтобы подтвердить знания, запустить салют и получить +1 LVL!",
    badgeConfirmed: "ПОДТВЕРЖДЕНО",
    badgeTakeQuiz: "ПРОЙТИ ТЕСТ",
    badgeSaving: "СОХРАНЕНИЕ...",
    tgNotifyTitle: "Уведомлять о вакансиях в Telegram",
    tgNotifyDescPrefix: "Подбор вакансий под твои изученные навыки:",

    // Описание шагов Roadmap
    steps: {
      HTML: {
        stepNumber: "ШАГ 01",
        subtitle: "Семантическая верстка, формы, доступность (a11y)",
      },
      CSS: {
        stepNumber: "ШАГ 02",
        subtitle: "Flexbox, CSS Grid, адаптивность Mobile-First, анимации",
      },
      JavaScript: {
        stepNumber: "ШАГ 03",
        subtitle: "ES6+, Замыкания, Event Loop, Promises, Fetch API",
      },
      React: {
        stepNumber: "ШАГ 04",
        subtitle: "Компоненты, Хуки (useState, useEffect), Стейт-менеджмент",
      },
      "Next.js": {
        stepNumber: "ШАГ 05",
        subtitle: "App Router, SSR, Server Components, Оптимизация",
      },
      Tailwind: {
        stepNumber: "ШАГ 06",
        subtitle: "Utility-First CSS, Нео-брутализм, Дизайн-системы",
      },
    },

    // Модальное окно викторины (QuizModal)
    quizExamBadge: "ЭКЗАМЕН НАВЫКА • +1 LVL",
    quizConfirmTitle: "Подтверди:",
    quizMentorQuestion: "ВОПРОС МЕНТОРА:",
    quizTryAgain: "Попробуй еще раз!",
    quizzes: {
      HTML: {
        question:
          "Какой семантический тег используется для основного уникального содержимого страницы?",
        options: ["<div>", "<main>", "<footer>"],
        correctAnswer: "<main>",
      },
      CSS: {
        question:
          "Какое свойство Flexbox выравнивает элементы вдоль главной оси?",
        options: ["align-items", "justify-content", "display"],
        correctAnswer: "justify-content",
      },
      JavaScript: {
        question:
          "Какой метод массива создает новый массив, преобразуя каждый элемент?",
        options: ["forEach", "map", "reduce"],
        correctAnswer: "map",
      },
      React: {
        question: "Какой хук используется для работы с состоянием?",
        options: ["useEffect", "useState", "useRef"],
        correctAnswer: "useState",
      },
      "Next.js": {
        question:
          "Какая директория в современном Next.js отвечает за маршрутизацию App Router?",
        options: ["app/", "pages/", "public/"],
        correctAnswer: "app/",
      },
      Tailwind: {
        question:
          "Какой утилитарный класс в Tailwind CSS задает внутренний отступ (padding)?",
        options: ["m-4", "p-4", "border-4"],
        correctAnswer: "p-4",
      },
    },
  },

  uz: {
    // Шапка (Header)
    greeting: "Salom",
    defaultUser: "Dasturchi",
    chapterVacancies: "01-BOB // VAKANSIYALAR DOSKASI",
    chapterResume: "02-BOB // AI-GENERATOR",
    chapterTrainer: "03-BOB // MENTOR DOZOSI",
    chapterTree: "04-BOB // KO'NIKMALAR DARAXTI",
    streakSuffix: "k",

    // Нижняя навигация (BottomNav)
    navVacancies: "Vakansiyalar",
    navTree: "Daraxt",
    navResume: "Rezyume",
    navTrainer: "Trenajor",

    // Экран Вакансий (Vacancies)
    heroBadgeLive: "OFFERLAR DOSKASI • LIVE",
    vacanciesTitle: "Boshlang'ich vakansiyalar",
    inDatabase: "Bazada",
    itemsCountSuffix: "ta",
    botTipLabel: "SKILLTREE AI:",
    botTipText:
      "Ma'lumotlar bazasidan yangi IT-vakansiyalar va amaliyotlar. Yo'nalishni tanlang va ariza topshiring!",
    filterTitle: "Vakansiya toifalari:",
    resetFilter: "Filterni tozalash",
    filterAll: "Barchasi",
    filterFrontend: "Frontend",
    filterBackend: "Backend",
    filterNoExp: "Tajribasiz",
    loadingVacancies: "Serverdan yangi vakansiyalar yuklanmoqda...",
    errorLoadingVacancies:
      "Serverdan vakansiyalarni yuklab bo'lmadi. Internet aloqasini tekshiring va qayta urinib ko'ring.",
    retryButton: "Qayta urinish",
    emptyCategoryPrefix: "Toifada",
    emptyCategorySuffix: "hozircha vakansiyalar yo'q",
    showAllVacancies: "Barcha vakansiyalarni ko'rsatish",

    // Карточка вакансии (VacancyCard)
    badgeNoExp: "Tajribasiz / Amaliyot",
    badgeJunior: "Junior",
    cityTashkent: "Toshkent",
    salaryLabel: "Maosh",
    salaryNegotiable: "Kelishuv asosida",
    applyButton: "Topshirish",

    // Экран Дерева Навыков (SkillTree)
    hunterCardBadge: "OVCHI KARTASI • SKILLTREE",
    levelLabel: "DARAJA",
    skillsWord: "KO'NIKMA",
    xpAccumulated: "To'plangan tajriba:",
    roadmapProgress: "Frontend Roadmap jarayoni",
    roadmapBadge: "FRONTEND ROADMAP • KVIZ-TEKSHIRUV",
    treeTitle: "Ko'nikmalar daraxti",
    statusLearned: "O'rganildi",
    statusNotLearned: "O'rganilmagan",
    treeHint:
      "🎯 Kulrang ko'nikmani bosing va bilimingizni tasdiqlash, mushakbozlikni yoqish hamda +1 LVL olish uchun 1 ta savolga javob bering!",
    badgeConfirmed: "TASDIQLANDI",
    badgeTakeQuiz: "TESTDAN O'TISH",
    badgeSaving: "SAQLANMOQDA...",
    tgNotifyTitle: "Telegram orqali vakansiyalar haqida xabar berish",
    tgNotifyDescPrefix: "O'rganilgan ko'nikmalaringiz bo'yicha vakansiyalar:",

    // Описание шагов Roadmap
    steps: {
      HTML: {
        stepNumber: "01-QADAM",
        subtitle: "Semantik sahifalash, formalar, qulaylik (a11y)",
      },
      CSS: {
        stepNumber: "02-QADAM",
        subtitle: "Flexbox, CSS Grid, Mobile-First moslashuvchanlik, animatsiya",
      },
      JavaScript: {
        stepNumber: "03-QADAM",
        subtitle: "ES6+, Closure, Event Loop, Promises, Fetch API",
      },
      React: {
        stepNumber: "04-QADAM",
        subtitle: "Komponentlar, Hooklar (useState, useEffect), State boshqaruvi",
      },
      "Next.js": {
        stepNumber: "05-QADAM",
        subtitle: "App Router, SSR, Server Components, Optimallashtirish",
      },
      Tailwind: {
        stepNumber: "06-QADAM",
        subtitle: "Utility-First CSS, Neo-brutalizm, Dizayn tizimlari",
      },
    },

    // Модальное окно викторины (QuizModal)
    quizExamBadge: "KO'NIKMA IMTIHONI • +1 LVL",
    quizConfirmTitle: "Tasdiqlang:",
    quizMentorQuestion: "MENTOR SAVOLI:",
    quizTryAgain: "Yana bir bor urinib ko'ring!",
    quizzes: {
      HTML: {
        question:
          "Sahifaning asosiy noyob mazmuni uchun qaysi semantik teg ishlatiladi?",
        options: ["<div>", "<main>", "<footer>"],
        correctAnswer: "<main>",
      },
      CSS: {
        question:
          "Flexbox-ning qaysi xususiyati elementlarni asosiy o'q bo'ylab tekislaydi?",
        options: ["align-items", "justify-content", "display"],
        correctAnswer: "justify-content",
      },
      JavaScript: {
        question:
          "Qaysi massiv metodi har bir elementni o'zgartirib yangi massiv yaratadi?",
        options: ["forEach", "map", "reduce"],
        correctAnswer: "map",
      },
      React: {
        question: "Holat (state) bilan ishlash uchun qaysi hook ishlatiladi?",
        options: ["useEffect", "useState", "useRef"],
        correctAnswer: "useState",
      },
      "Next.js": {
        question:
          "Zamonaviy Next.js-da App Router marshrutizatsiyasi uchun qaysi papka javob beradi?",
        options: ["app/", "pages/", "public/"],
        correctAnswer: "app/",
      },
      Tailwind: {
        question:
          "Tailwind CSS-da ichki masofani (padding) qaysi klass belgilaydi?",
        options: ["m-4", "p-4", "border-4"],
        correctAnswer: "p-4",
      },
    },
  },
} as const;
