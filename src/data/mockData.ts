export type VacancyLevel = "Стажировка" | "Junior";

export interface Vacancy {
  id: string;
  title: string;
  company: string;
  salary: string;
  levelTag: VacancyLevel;
  tags: string[];
  format: string;
  matchScore: number;
  accentBg: string;
  questNote: string;
  postedAt: string;
}

export type SkillStatus = "completed" | "current" | "locked";

export interface SkillNode {
  id: string;
  title: string;
  subtitle: string;
  xp: number;
  tier: number;
  branch: "left" | "center" | "right";
  status: SkillStatus;
  unlocksCount: number;
  description: string;
  parentIds: string[];
}

export const VACANCY_FILTER_TAGS = [
  "Все",
  "React",
  "Frontend",
  "Node.js",
  "TypeScript",
  "Fullstack",
  "Стажировка",
  "Junior",
] as const;

export const MOCK_VACANCIES: Vacancy[] = [
  {
    id: "vac-1",
    title: "Frontend Developer (React)",
    company: "NeoBank Labs",
    salary: "90 000 – 120 000 ₽",
    levelTag: "Junior",
    tags: ["React", "Frontend", "TypeScript", "Junior"],
    format: "Удаленно • Полный день",
    matchScore: 94,
    accentBg: "bg-manga-lime",
    questNote: "Ищут джуна с крепким React и пониманием компонентной архитектуры без бюрократии!",
    postedAt: "2 ч назад",
  },
  {
    id: "vac-2",
    title: "Стажер Frontend-разработчик",
    company: "Kitsune Cloud",
    salary: "55 000 – 75 000 ₽",
    levelTag: "Стажировка",
    tags: ["React", "Frontend", "Стажировка"],
    format: "Гибрид / Удаленно • Гибкий график",
    matchScore: 98,
    accentBg: "bg-manga-yellow",
    questNote: "Оплачиваемая стажировка с личным ментором. Перевод в штат через 3 месяца!",
    postedAt: "4 ч назад",
  },
  {
    id: "vac-3",
    title: "Junior Fullstack JS Engineer",
    company: "CyberManga Studio",
    salary: "110 000 – 140 000 ₽",
    levelTag: "Junior",
    tags: ["React", "Node.js", "Fullstack", "TypeScript", "Junior"],
    format: "Удаленно • Telegram Mini Apps",
    matchScore: 86,
    accentBg: "bg-manga-cyan",
    questNote: "Разработка геймифицированных Telegram Mini Apps на Next.js и Node.js.",
    postedAt: "Вчера",
  },
  {
    id: "vac-4",
    title: "Node.js Backend Intern",
    company: "Pulse FinTech",
    salary: "60 000 – 80 000 ₽",
    levelTag: "Стажировка",
    tags: ["Node.js", "TypeScript", "Стажировка"],
    format: "Удаленно • 30ч в неделю",
    matchScore: 79,
    accentBg: "bg-manga-yellow",
    questNote: "Пишем микросервисы и REST API. Достаточно одного хорошего пет-проекта на GitHub!",
    postedAt: "Вчера",
  },
  {
    id: "vac-5",
    title: "Junior UI / React Разработчик",
    company: "PixelForge AI",
    salary: "95 000 – 115 000 ₽",
    levelTag: "Junior",
    tags: ["React", "Frontend", "Junior"],
    format: "Удаленно • Стартап",
    matchScore: 92,
    accentBg: "bg-manga-lime",
    questNote: "Любовь к крутому UI, Tailwind CSS и анимациям даст +100 очков на собеседовании.",
    postedAt: "2 дня назад",
  },
];

export const USER_PROFILE = {
  name: "Алексей «Kuro» Соколов",
  handle: "@alex_kuro_dev",
  rank: "Junior Web Developer",
  chapter: "АРКА 02: ПЕРВЫЙ ОФФЕР",
  level: 4,
  xp: 1450,
  nextLevelXp: 2000,
  streakDays: 12,
  mentorQuote:
    "Йо, самурай! Твой базовый фронтенд уже светится на 100%! Разблокируй TypeScript и CI/CD, чтобы пробить потолок зарплаты в 130 000 ₽!",
};

export const SKILL_TREE_NODES: SkillNode[] = [
  {
    id: "html-css",
    title: "HTML5 & CSS3 Архитектура",
    subtitle: "Семантика, Flexbox, Grid, Mobile-First",
    xp: 250,
    tier: 1,
    branch: "center",
    status: "completed",
    unlocksCount: 14,
    description: "Фундамент веб-разработки: адаптивная верстка, доступность (a11y) и идеальная сетка на мобильных устройствах.",
    parentIds: [],
  },
  {
    id: "js-core",
    title: "JavaScript ES6+ Core",
    subtitle: "Замыкания, Event Loop, Промисы, DOM",
    xp: 400,
    tier: 2,
    branch: "left",
    status: "completed",
    unlocksCount: 22,
    description: "Глубокое понимание асинхронности, работы движка V8, методов массивов и чистого кода без костылей.",
    parentIds: ["html-css"],
  },
  {
    id: "git-flow",
    title: "Git & Командный Flow",
    subtitle: "Commits, Branches, Rebase, Pull Requests",
    xp: 250,
    tier: 2,
    branch: "right",
    status: "completed",
    unlocksCount: 19,
    description: "Уверенная работа в команде: разрешение конфликтов, чистая история коммитов и культура Code Review.",
    parentIds: ["html-css"],
  },
  {
    id: "react-hooks",
    title: "React 19 & Tailwind UI",
    subtitle: "Хуки, Стейт-менеджмент, Компоненты",
    xp: 550,
    tier: 3,
    branch: "center",
    status: "completed",
    unlocksCount: 31,
    description: "Построение быстрых SPA приложений, кастомные хуки, оптимизация ререндеров и дизайн-системы на Tailwind CSS.",
    parentIds: ["js-core", "git-flow"],
  },
  {
    id: "typescript",
    title: "TypeScript Strict",
    subtitle: "Generics, Utility Types, Type Guards",
    xp: 500,
    tier: 4,
    branch: "left",
    status: "locked",
    unlocksCount: 27,
    description: "Строгая типизация промышленного уровня. Защищает продакшен от undefined is not a function.",
    parentIds: ["react-hooks"],
  },
  {
    id: "nextjs-ssr",
    title: "Next.js App Router",
    subtitle: "SSR, Server Actions, Оптимизация",
    xp: 600,
    tier: 4,
    branch: "right",
    status: "locked",
    unlocksCount: 18,
    description: "Современный фреймворк для продакшена: серверные компоненты, роутинг, SEO и мгновенная загрузка.",
    parentIds: ["react-hooks"],
  },
  {
    id: "cicd-docker",
    title: "CI/CD & Docker Деплой",
    subtitle: "GitHub Actions, Контейнеры, Linux",
    xp: 650,
    tier: 5,
    branch: "center",
    status: "locked",
    unlocksCount: 15,
    description: "Финальный босс Junior+ уровня: автоматические пайплайны тестирования, сборка Docker-образов и автодеплой.",
    parentIds: ["typescript", "nextjs-ssr"],
  },
];

export interface ChatMessage {
  id: string;
  sender: "mentor" | "user";
  speakerName: string;
  speakerBadge: string;
  timestamp: string;
  text: string;
  sfx?: string;
  feedback?: {
    score: string;
    mistakeHighlight: string;
    correction: string;
    xpAwarded: string;
  };
}

export const INITIAL_TRAINER_MESSAGES: ChatMessage[] = [
  {
    id: "msg-1",
    sender: "mentor",
    speakerName: "СЕНСЕЙ КАЙТО [AI]",
    speakerBadge: "TECH LEAD // LVL 99",
    timestamp: "14:02",
    sfx: "ВОПРОС БОССА!",
    text: "Представь техническое собеседование на Junior React. Почему в React нельзя обновлять state напрямую (например, count = count + 1) и зачем нужен иммутабельный апдейт массивов?",
  },
  {
    id: "msg-2",
    sender: "user",
    speakerName: "АЛЕКСЕЙ «KURO»",
    speakerBadge: "JUNIOR // LVL 04",
    timestamp: "14:03",
    text: "Если поменять переменную напрямую, React не узнает об изменении и не вызовет ререндер. А для массива можно сделать arr.push(newItem) и потом передать этот же массив в setArr(arr), чтобы обновить экран.",
  },
  {
    id: "msg-3",
    sender: "mentor",
    speakerName: "СЕНСЕЙ КАЙТО [AI]",
    speakerBadge: "TECH LEAD // LVL 99",
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
];
