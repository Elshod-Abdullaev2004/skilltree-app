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
      if (
        customEvent.detail?.lang === "ru" ||
        customEvent.detail?.lang === "uz"
      ) {
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
    loadMoreVacancies: "Показать еще",
    loadingMore: "Загрузка...",
    noMoreVacancies: "Все вакансии загружены",

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
    quizExamBadge: "ХАРДКОР-ЭКЗАМЕН • 10 ВОПРОСОВ",
    quizConfirmTitle: "Экзамен:",
    quizMentorQuestion: "ВОПРОС ЭКЗАМЕНА:",
    quizTryAgain: "Попробуй еще раз!",
    quizAiGenerating: "⚡ Генерируем 10 хардкорных вопросов...",
    quizAiGeneratingSub: "Gemini 2.5 Flash готовит полноценный экзамен...",
    quizAiBadge: "GEMINI 2.5 FLASH • ЭКЗАМЕН",
    quizQuestionLabel: "Вопрос",
    quizOfTotal: "из 10",
    quizCorrectScore: "Правильно:",
    quizPassingNotice: "Проходной балл: минимум 8 из 10",
    quizPassedTitle: "🎉 ЭКЗАМЕН СДАН!",
    quizPassedDesc: "Великолепный результат! Твой навык подтвержден, а уровень повышен!",
    quizSaveSkillBtn: "💾 Сохранить навык (+1 LVL)",
    quizFailedTitle: "💥 ЭКЗАМЕН ПРОВАЛЕН!",
    quizFailedDesc: "Экзамен провален! Нужно подучить теорию",
    quizFailedScoreText: "Набрано правильных ответов:",
    quizFailedRequiredText: "Для сдачи экзамена требуется минимум 8 из 10.",
    quizFailedCloseBtn: "Закрыть и подучить теорию",
    quizNextBtn: "Следующий вопрос ➔",
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

    // Экран ИИ-Резюме (ResumePage)
    resume: {
      heroBadge: "ГЕНЕРАТОР ОФФЕРОВ • AI CV",
      heroTitle: "ИИ-Резюме за 10 сек",
      heroBubble:
        "Заполни 4 поля ниже — ИИ упакует твои пет-проекты на языке метрик, который обожают техлиды и ATS-фильтры!",
      labelRole: "Желаемая должность",
      placeholderRole: "Например: Junior Frontend Developer",
      labelStack: "Стек технологий",
      placeholderStack: "React, TypeScript, Node.js, Tailwind CSS...",
      labelGithub: "Ссылка на GitHub",
      placeholderGithub: "https://github.com/username",
      labelPortfolio: "Ссылка на портфолио",
      placeholderPortfolio: "https://portfolio-website.dev",
      labelAboutMe: "О себе / Био",
      placeholderAboutMe: "Кратко о себе, ключевых навыках и целях в IT...",
      labelProjects: "Описание пет-проектов",
      placeholderProjects: "Опиши 1-2 главных проекта, какие задачи решал...",
      defaultProjects:
        "1. SkillTree TMA — Telegram Mini App для поиска первой работы в IT (Next.js, Tailwind).\n2. CryptoPulse — трекер портфеля с графиками в реальном времени и WebSockets.",
      generateButton: "Сгенерировать резюме",
      saveButton: "Сохранить",
      savingButton: "Сохранение...",
      savedSuccessNotification: "Данные сохранены!",
      savedSuccessSub: "Профиль и данные резюме успешно обновлены в базе",
      saveErrorNotification: "Ошибка при сохранении данных",
      resultHeader: "Готовое резюме для отклика",
      copyButton: "Скопировать",
      copiedButton: "Скопировано!",
      tplPosition: "🎯 ПОЗИЦИЯ:",
      tplGithub: "🔗 GITHUB:",
      tplPortfolio: "🌐 ПОРТФОЛИО:",
      tplStack: "⚡ КЛЮЧЕВОЙ СТЕК:",
      tplAboutMe: "👤 О СЕБЕ:",
      tplProjects: "🚀 ОПЫТ И ПЕТ-ПРОЕКТЫ (IMPACT-ФОРМАТ):",
      tplHighlightsHeader: "💡 ДОСТИЖЕНИЯ ДЛЯ HR-СКРИНИНГА:",
      tplHighlights:
        "• Разработал Mobile-First архитектуру для Telegram Mini App с оценкой Lighthouse Performance 98/100.\n• Настроил строгую типизацию компонентов и переиспользуемую UI-систему на Tailwind CSS.\n• Готов к выполнению тестового задания и выходу в команду за 24 часа.",
    },

    // Экран Тренажера (TrainerPage)
    trainer: {
      heroBadge: "БОЕВОЙ СИМУЛЯТОР СОБЕСЕДОВАНИЯ",
      roundBadge: "РАУНД 01 / 05",
      heroTitle: "ИИ-Ментор: Тренажер",
      verdictPrefix: "ВЕРДИКТ:",
      mistakeLabel: "Подсветка ошибки в ответе:",
      correctionLabel: "Разбор от ИИ-ментора:",
      inputLabel: "Твой ответ в комикс-чате:",
      inputPlaceholder: "Напиши исправленный ответ с [...prev, newItem]...",
      sendButton: "Ответить",
      nowTimestamp: "Сейчас",
      userSpeakerDefault: "АЛЕКСЕЙ «KURO»",
      userBadge: "JUNIOR // LVL 04",
      mentorSpeaker: "СЕНСЕЙ КАЙТО [AI]",
      mentorBadge: "TECH LEAD // LVL 99",
      initialMessages: [
        {
          id: "msg-1",
          sender: "mentor" as const,
          timestamp: "14:02",
          sfx: "ВОПРОС БОССА!",
          text: "Представь техническое собеседование на Junior React. Почему в React нельзя обновлять state напрямую (например, count = count + 1) и зачем нужен иммутабельный апдейт массивов?",
        },
        {
          id: "msg-2",
          sender: "user" as const,
          timestamp: "14:03",
          text: "Если поменять переменную напрямую, React не узнает об изменении и не вызовет ререндер. А для массива можно сделать arr.push(newItem) и потом передать этот же массив в setArr(arr), чтобы обновить экран.",
        },
        {
          id: "msg-3",
          sender: "mentor" as const,
          timestamp: "14:03",
          sfx: "КОНТРАТАКА!",
          text: "Первая половина ответа — в яблочко! Но во второй части ты попался в классическую ловушку с мутацией ссылки.",
          feedback: {
            score: "7 / 10 • ХОРОШАЯ ПОПЫТКА",
            mistakeHighlight:
              "Ошибка: «сделать arr.push(newItem) и потом передать этот же массив в setArr(arr)»",
            correction:
              "Правильно: React сравнивает состояние через Object.is (по ссылке). При arr.push() ссылка на массив остается прежней, поэтому ререндер НЕ сработает! Нужно создавать новый массив: setArr(prev => [...prev, newItem]).",
            xpAwarded: "+85 XP В КОПИЛКУ REACT",
          },
        },
      ],
      aiReply: {
        sfx: "КРИТИЧЕСКИЙ УСПЕХ!",
        text: "Отличное уточнение! Использование колбэка setArr(prev => [...prev, item]) гарантирует работу со свежим состоянием даже при батчинге обновлений в React 19.",
        feedback: {
          score: "10 / 10 • БЕЗУПРЕЧНОЕ КОМБО",
          mistakeHighlight: "Ошибок не обнаружено — чистый иммутабельный код!",
          correction:
            "Совет для собеседования: упомяни также structuredClone() для глубокого копирования вложенных объектов.",
          xpAwarded: "+120 XP • УРОВЕНЬ ДОВЕРИЯ ПОВЫШЕН",
        },
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
    loadMoreVacancies: "Yana ko'rsatish",
    loadingMore: "Yuklanmoqda...",
    noMoreVacancies: "Barcha vakansiyalar yuklandi",

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
    quizExamBadge: "HARDCORE IMTIHON • 10 TA SAVOL",
    quizConfirmTitle: "Imtihon:",
    quizMentorQuestion: "IMTIHON SAVOLI:",
    quizTryAgain: "Yana bir bor urinib ko'ring!",
    quizAiGenerating: "⚡ 10 ta qiyin savol tayyorlanmoqda...",
    quizAiGeneratingSub: "Gemini 2.5 Flash to'liq imtihon tuzmoqda...",
    quizAiBadge: "GEMINI 2.5 FLASH • IMTIHON",
    quizQuestionLabel: "Savol",
    quizOfTotal: "10 dan",
    quizCorrectScore: "To'g'ri:",
    quizPassingNotice: "O'tish bali: kamida 10 dan 8",
    quizPassedTitle: "🎉 IMTIHON TOPSHIRILDI!",
    quizPassedDesc: "Ajoyib natija! Ko'nikmangiz tasdiqlandi va darajangiz oshdi!",
    quizSaveSkillBtn: "💾 Ko'nikmani saqlash (+1 LVL)",
    quizFailedTitle: "💥 IMTIHON TOPSHIRILMADI!",
    quizFailedDesc: "Экзамен провален! Нужно подучить теорию",
    quizFailedScoreText: "To'g'ri javoblar soni:",
    quizFailedRequiredText: "Imtihondan o'tish uchun kamida 10 dan 8 ta to'g'ri javob kerak.",
    quizFailedCloseBtn: "Yopish va nazariyani o'rganish",
    quizNextBtn: "Keyingi savol ➔",
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

    // Экран ИИ-Резюме (ResumePage)
    resume: {
      heroBadge: "OFFERLAR GENERATORI • AI CV",
      heroTitle: "10 soniyada AI-Rezyume",
      heroBubble:
        "Quyidagi 4 ta maydonni to'ldiring — AI sizning pet-loyihalaringizni Tech Lead va HR-filtrlar yoqtiradigan metrikalar tilida tayyorlab beradi!",
      labelRole: "Istalgan lavozim",
      placeholderRole: "Masalan: Junior Frontend Developer",
      labelStack: "Texnologiyalar steki",
      placeholderStack: "React, TypeScript, Node.js, Tailwind CSS...",
      labelGithub: "GitHub havolasi",
      placeholderGithub: "https://github.com/username",
      labelPortfolio: "Portfolio havolasi",
      placeholderPortfolio: "https://portfolio-website.dev",
      labelAboutMe: "O'zingiz haqingizda / Bio",
      placeholderAboutMe:
        "O'zingiz, asosiy ko'nikmalaringiz va IT sohasidagi maqsadlaringiz haqida...",
      labelProjects: "Pet-loyihalar tavsifi",
      placeholderProjects:
        "1-2 ta asosiy loyihangizni va qanday vazifalarni hal qilganingizni yozing...",
      defaultProjects:
        "1. SkillTree TMA — IT sohasida birinchi ishni topish uchun Telegram Mini App (Next.js, Tailwind).\n2. CryptoPulse — WebSockets va real vaqt rejimida grafiklar bilan portfel trekeri.",
      generateButton: "Rezyume yaratish",
      saveButton: "Saqlash",
      savingButton: "Saqlanmoqda...",
      savedSuccessNotification: "Ma'lumotlar saqlandi!",
      savedSuccessSub: "Profil va rezyume ma'lumotlari bazada muvaffaqiyatli yangilandi",
      saveErrorNotification: "Ma'lumotlarni saqlashda xatolik",
      resultHeader: "Topshirish uchun tayyor rezyume",
      copyButton: "Nusxalash",
      copiedButton: "Nusxalandi!",
      tplPosition: "🎯 LAVOZIM:",
      tplGithub: "🔗 GITHUB:",
      tplPortfolio: "🌐 PORTFOLIO:",
      tplStack: "⚡ ASOSIY STEK:",
      tplAboutMe: "👤 MEN HAQIMDA:",
      tplProjects: "🚀 TAJRIBA VA PET-LOYIHALAR (IMPACT-FORMAT):",
      tplHighlightsHeader: "💡 HR-SKRINING UCHUN YUTUQLAR:",
      tplHighlights:
        "• Telegram Mini App uchun Lighthouse Performance 98/100 ko'rsatkichiga ega Mobile-First arxitekturani ishlab chiqdim.\n• Komponentlarning qat'iy tiplashtirilishi va Tailwind CSS-da qayta ishlatiluvchi UI-tizimni sozladim.\n• Sinov topshirig'ini bajarishga va 24 soat ichida jamoaga qo'shilishga tayyorman.",
    },

    // Экран Тренажера (TrainerPage)
    trainer: {
      heroBadge: "SUHBAT JANGOVAR SIMULYATORI",
      roundBadge: "RAUND 01 / 05",
      heroTitle: "AI-Mentor: Trenajor",
      verdictPrefix: "XULOSA:",
      mistakeLabel: "Javobdagi xatoning ajratilishi:",
      correctionLabel: "AI-mentordan tahlil:",
      inputLabel: "Komiks-chatdagi javobingiz:",
      inputPlaceholder:
        "[...prev, newItem] bilan to'g'rilangan javobni yozing...",
      sendButton: "Javob berish",
      nowTimestamp: "Hozir",
      userSpeakerDefault: "ALEKSEY «KURO»",
      userBadge: "JUNIOR // LVL 04",
      mentorSpeaker: "SENSEY KAYTO [AI]",
      mentorBadge: "TECH LEAD // LVL 99",
      initialMessages: [
        {
          id: "msg-1",
          sender: "mentor" as const,
          timestamp: "14:02",
          sfx: "BOSS SAVOLI!",
          text: "Junior React lavozimiga texnik suhbatni tasavvur qiling. Nima uchun React-da state-ni to'g'ridan-to'g'ri yangilab bo'lmaydi (masalan, count = count + 1) va massivlarni immutabel tarzda yangilash nima uchun kerak?",
        },
        {
          id: "msg-2",
          sender: "user" as const,
          timestamp: "14:03",
          text: "Agar o'zgaruvchini to'g'ridan-to'g'ri o'zgartirsak, React bu haqda bilmaydi va qayta render (re-render) qilmaydi. Massiv uchun esa arr.push(newItem) qilib, keyin o'sha massivni setArr(arr) ga uzatish mumkin.",
        },
        {
          id: "msg-3",
          sender: "mentor" as const,
          timestamp: "14:03",
          sfx: "QARSHI HUJUM!",
          text: "Javobning birinchi qismi — ayni nishonga! Lekin ikkinchi qismida havola (reference) mutatsiyasi bilan bog'liq klassik tuzoqqa tushdingiz.",
          feedback: {
            score: "7 / 10 • YAXSHI URINISH",
            mistakeHighlight:
              "Xato: «arr.push(newItem) qilib, keyin o'sha massivni setArr(arr) ga uzatish»",
            correction:
              "To'g'ri yechim: React holatni Object.is orqali (havola bo'yicha) solishtiradi. arr.push() da massiv havolasi o'zgarmaydi, shuning uchun re-render ISHLAMAYDI! Yangi massiv yaratish kerak: setArr(prev => [...prev, newItem]).",
            xpAwarded: "+85 XP REACT XAZINASIGA",
          },
        },
      ],
      aiReply: {
        sfx: "KRITIK MUVAFFAQIYAT!",
        text: "Ajoyib aniqlik! setArr(prev => [...prev, item]) kolbekidan foydalanish React 19 da yangilanishlar guruhlanganda (batching) ham eng yangi holat bilan ishlashni kafolatlaydi.",
        feedback: {
          score: "10 / 10 • BENUQSON KOMBO",
          mistakeHighlight: "Xatolar topilmadi — toza immutabel kod!",
          correction:
            "Suhbat uchun maslahat: ichma-ich obyektlarni chuqur nusxalash uchun structuredClone() haqida ham aytib o'ting.",
          xpAwarded: "+120 XP • ISHONCH DARAJASI OSHDI",
        },
      },
    },
  },
} as const;
