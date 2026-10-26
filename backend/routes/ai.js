const express = require("express");
const axios = require("axios");
const { GoogleGenAI } = require("@google/genai");
const telegramAuth = require("../middleware/telegramAuth");
const User = require("../models/User");

const router = express.Router();

/**
 * Генерирует качественный резервный шаблон сопроводительного письма, если нейросеть недоступна
 */
function generateFallbackCoverLetter({
  title,
  company,
  about_me,
  github_url,
  portfolio_url,
  skills,
  isUz,
  testScore,
  testTotal = 15,
}) {
  const stack =
    skills && skills.length > 0
      ? skills.join(", ")
      : "HTML5, CSS3, JavaScript, React, Next.js";

  const testMention =
    typeof testScore === "number" && testScore >= 12
      ? isUz
        ? `Men ushbu vakansiya bo'yicha chuqur texnik intervyudan muvaffaqiyatli o'tib, ${testScore}/${testTotal} ball (80%+ dan yuqori) to'pladim va amaliy bilimlarim hamda arxitekturani tushunishimni to'liq tasdiqladim.\n\n`
        : `Я успешно прошел углубленное техническое собеседование под требования этой вакансии с результатом ${testScore} из ${testTotal} баллов (более 80%), подтвердив фундаментальную базу и готовность к боевым задачам.\n\n`
      : "";

  if (isUz) {
    return `Assalomu alaykum!

Meni ${company} jamoasidagi «${title}» vakansiyasi juda qiziqtirdi. Men IT sohasida faol rivojlanayotgan va jamoaga maksimal foyda keltirishga intilayotgan Junior dasturchiman.

${testMention}${about_me ? `${about_me}\n\n` : ""}Mening amaliy bilimlarim va texnologiyalarim: ${stack}. O'z loyihalarimda toza kod yozish, zamonaviy standartlar va qulay foydalanuvchi interfeysiga (UI/UX) alohida e'tibor qarataman.

${github_url ? `💻 GitHub profilim: ${github_url}\n` : ""}${portfolio_url ? `🌐 Portfolio: ${portfolio_url}\n` : ""}
${company} talablariga tez moslashib, amaliy topshiriqlarni mas'uliyat bilan bajarishga tayyorman.

Texnik suhbatda ko'nikmalarimni batafsil muhokama qilishdan mamnun bo'laman!`;
  }

  return `Здравствуйте!

Меня искренне заинтересовала позиция «${title}» в компании ${company}. Я начинающий разработчик с горящими глазами, хорошей базой и желанием приносить реальную пользу продукту.

${testMention}${about_me ? `${about_me}\n\n` : ""}Мой технологический стек: ${stack}. В своих проектах уделяю особое внимание чистоте кода, компонентному подходу и адаптивной верстке.

${github_url ? `💻 GitHub с примерами кода: ${github_url}\n` : ""}${portfolio_url ? `🌐 Портфолио: ${portfolio_url}\n` : ""}
Готов быстро погрузиться в процессы команды ${company}, оперативно решать поставленные задачи и расти под руководством старших коллег.

Буду рад возможности пообщаться на интервью и выполнить тестовое задание!`;
}

/**
 * Валидация и парсинг вопросов технического собеседования от Gemini
 */
function parseAndValidateInterviewQuestions(rawText) {
  if (!rawText || typeof rawText !== "string") {
    throw new Error("Пустой ответ от Gemini");
  }

  const cleaned = rawText
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const data = JSON.parse(cleaned);
  let rawList = [];

  if (Array.isArray(data)) {
    rawList = data;
  } else if (data && Array.isArray(data.questions)) {
    rawList = data.questions;
  } else {
    throw new Error("Ответ модели не является массивом вопросов");
  }

  const validQuestions = [];
  for (const item of rawList) {
    if (
      item &&
      item.question &&
      Array.isArray(item.options) &&
      item.options.length === 4 &&
      typeof item.correctAnswerIndex === "number" &&
      item.correctAnswerIndex >= 0 &&
      item.correctAnswerIndex <= 3
    ) {
      validQuestions.push({
        question: String(item.question).trim(),
        options: item.options.map((opt) => String(opt).trim()),
        correctAnswerIndex: Math.floor(item.correctAnswerIndex),
        skill: String(item.skill || item.technology || "Fullstack").trim(),
      });
    }
  }

  if (validQuestions.length === 0) {
    throw new Error("В ответе Gemini нет валидных вопросов");
  }

  return validQuestions;
}

/**
 * Резервный пул 15 глубоких и сложных вопросов технического собеседования
 * Проверяют: фундаментальную базу, архитектуру, поиск ошибок в коде и ситуативные задачи
 */
function generateFallbackInterviewQuestions(title = "", description = "", isUz = false) {
  if (isUz) {
    return [
      {
        question: "JavaScript Event Loop-da Microtask (Promise, queueMicrotask) va Macrotask (setTimeout) qanday tartibda bajariladi?",
        options: [
          "Barcha macrotasklar bajarilgandan keyin microtasklar ishga tushadi",
          "Har bir macrotask tugagach, microtask navbatidagi barcha vazifalar to'liq bo'shatiladi",
          "Ular parallel ravishda turli oqimlarda (threads) bir vaqtda ishlaydi",
          "Faqat bitta microtask bajariladi, qolgani keyingi renderga qoldiriladi"
        ],
        correctAnswerIndex: 1,
        skill: "JavaScript Fundamentals"
      },
      {
        question: "Quyidagi kod natijasi nima bo'ladi: console.log(typeof null, null instanceof Object, NaN === NaN)?",
        options: [
          "'object', false, false",
          "'null', false, true",
          "'object', true, false",
          "'undefined', false, false"
        ],
        correctAnswerIndex: 0,
        skill: "JavaScript Core"
      },
      {
        question: "React-da to'g'ridan-to'g'ri state-ni o'zgartirish (masalan: state.items.push(newItem)) nima sababdan jiddiy xato hisoblanadi?",
        options: [
          "JavaScript xatolik chiqarib dasturni to'xtatadi",
          "Obyekt havolasi (reference) o'zgarmagani uchun React qayta render qilmaydi va PureComponent/memo buziladi",
          "Barcha boshqa komponentlarning ma'lumotlari o'chib ketadi",
          "Faqat TypeScript-da xato beradi, JavaScript-da to'g'ri ishlaydi"
        ],
        correctAnswerIndex: 1,
        skill: "React Architecture"
      },
      {
        question: "React-da ro'yxatlarni chizishda 'key' sifatida massiv indeksini (index) ishlatish qachon jiddiy muammoga olib keladi?",
        options: [
          "Faqat ro'yxat 100 tadan ortiq bo'lsa",
          "Elementlar filtrlangan, o'chirilgan yoki ularning tartibi o'zgarganda ichki state noto'g'ri elementlarga bog'lanib qoladi",
          "Brauzerda xotira to'lib ketishiga (memory leak) olib keladi",
          "Indeks ishlatish har doim tavsiya etiladi, hech qanday muammo yo'q"
        ],
        correctAnswerIndex: 1,
        skill: "React Reconciliation"
      },
      {
        question: "Quyidagi kodda xatolik nimada: for (var i = 0; i < 3; i++) { setTimeout(() => console.log(i), 100); }?",
        options: [
          "Sintaksis xatosi bor, kod ishlamaydi",
          "var funksiya ko'lamiga (function scope) ega bo'lgani uchun barcha taymerlar 3 chiqarguncha bir xil qiymatni oladi (let ishlatish kerak)",
          "setTimeout ichida console.log chaqirib bo'lmaydi",
          "Kod 0, 1, 2 ni to'g'ri chiqaradi"
        ],
        correctAnswerIndex: 1,
        skill: "Code Debugging"
      },
      {
        question: "React komponentida quyidagi holatda nima sodir bo'ladi: setCount(count + 1); setCount(count + 1);?",
        options: [
          "count qiymati 2 ga oshadi",
          "Ikkala chaqiruv ham joriy renderdagi bir xil count qiymatidan foydalangani uchun count faqat 1 ga oshadi (batching)",
          "Cheksiz render sikli (infinite loop) yuzaga keladi",
          "React xatolik tashlaydi"
        ],
        correctAnswerIndex: 1,
        skill: "State Management"
      },
      {
        question: "useEffect ichida tarmoq so'rovi (fetch) yuborilganda xotira sizib chiqishi (memory leak) va race condition oldini olish uchun nima qilish kerak?",
        options: [
          "useEffect-dan butunlay voz kechish",
          "Cleanup funksiyasida AbortController.abort() orqali so'rovni bekor qilish",
          "Har doim async/await-ni to'g'ridan-to'g'ri useEffect argumentida chaqirish",
          "Brauzer keshini tozalash"
        ],
        correctAnswerIndex: 1,
        skill: "React Lifecycle"
      },
      {
        question: "Next.js App Router-da Server Component-dan Client Component-ga props uzatishda qanday cheklov mavjud?",
        options: [
          "Faqat raqamlarni uzatish mumkin",
          "Props seriyalashtiriladigan (serializable, masalan JSON) bo'lishi kerak, funksiyalar va class nusxalarini to'g'ridan-to'g'ri uzatib bo'lmaydi",
          "Props uzatish umuman mumkin emas",
          "Faqat Redux orqali uzatish kerak"
        ],
        correctAnswerIndex: 1,
        skill: "Next.js Architecture"
      },
      {
        question: "Next.js-da 'Hydration Mismatch' xatosi nima sababdan yuzaga keladi?",
        options: [
          "Faqat CSS fayli yuklanmaganda",
          "Serverda yaratilgan boshlang'ich HTML va mijoz brauzerida dastlabki render qilingan DOM o'rtasida farq bo'lsa (masalan, typeof window)",
          "Faqat ma'lumotlar bazasi o'chib qolganda",
          "Brauzer eskirgan bo'lsa"
        ],
        correctAnswerIndex: 1,
        skill: "SSR & Hydration"
      },
      {
        question: "Sahifada 10 000 ta murakkab elementdan iborat ro'yxatni brauzer qotib qolmasdan (laglarsiz) ko'rsatish uchun qaysi texnika zarur?",
        options: [
          "Barcha elementlarni darhol DOM-ga joylash va display: none qilish",
          "Virtualizatsiya (Virtualization / Windowing): faqat ekranda ko'rinib turgan elementlarni render qilish",
          "Elementlarni base64 formatiga o'tkazish",
          "setInterval orqali sekundiga 1 tadan render qilish"
        ],
        correctAnswerIndex: 1,
        skill: "Performance Optimization"
      },
      {
        question: "CSS-da z-index: 99999 berilgan element nima sababdan z-index: 1 bo'lgan element ostida qolib ketishi mumkin?",
        options: [
          "z-index faqat 100 gacha sonlarni qo'llab-quvvatlaydi",
          "Element opacity < 1, transform yoki filter sababli yangi Stacking Context (qatlamlar konteksti) ichida qolgan",
          "CSS keshlanib qolgan",
          "Faqat display: flex ishlatilganda z-index ishlamaydi"
        ],
        correctAnswerIndex: 1,
        skill: "CSS Stacking Context"
      },
      {
        question: "CORS xatoligida brauzer yuboradigan 'Preflight request' qaysi HTTP metodidan foydalanadi va nima maqsadda yuboriladi?",
        options: [
          "HEAD metodi, fayl hajmini bilish uchun",
          "OPTIONS metodi, server ruxsat bergan metodlar va sarlavhalarni (headers) tekshirish uchun",
          "GET metodi, token olish uchun",
          "POST metodi, ma'lumotlarni tekshirish uchun"
        ],
        correctAnswerIndex: 1,
        skill: "Network & Security"
      },
      {
        question: "XSS (Cross-Site Scripting) hujumlaridan himoyalanish uchun React qanday standart mexanizmdan foydalanadi?",
        options: [
          "Barcha ma'lumotlarni shifrlaydi",
          "JSX ichidagi qiymatlarni avtomatik stringga aylantirib ekranlashtiradi (escaping) va dangerouslySetInnerHTML-siz xavfli scriptlarni bajarmaydi",
          "Tarmoqni uzib qo'yadi",
          "Faqat HTTPS orqali so'rov yuborishga ruxsat beradi"
        ],
        correctAnswerIndex: 1,
        skill: "Web Security"
      },
      {
        question: "Git-da 'git merge' va 'git rebase' o'rtasidagi asosiy farq nima?",
        options: [
          "Farqi yo'q, ikkalasi ham bir xil ishlaydi",
          "Merge alohida merge-commit yaratib tarixni saqlaydi, rebase esa joriy commitlarni maqsadli tarmoq ustiga qayta yozib to'g'ri chiziqli tarix hosil qiladi",
          "Rebase barcha fayllarni o'chirib tashlaydi",
          "Merge faqat lokal ishlaydi, rebase esa faqat serverda"
        ],
        correctAnswerIndex: 1,
        skill: "Git & Collaboration"
      },
      {
        question: "SPA (Single Page Application) da xotira sizib chiqishining (Memory Leak) eng keng tarqalgan sababi nima?",
        options: [
          "CSS fayllarining kattaligi",
          "Komponent unmount bo'lganda window/document-ga qo'shilgan event listenerlar, interval yoki websocketlarni tozalamaslik",
          "O'zgaruvchilarga const ishlatish",
          "JSON.stringify dan ko'p foydalanish"
        ],
        correctAnswerIndex: 1,
        skill: "Architecture & Memory"
      }
    ];
  }

  // Russian fallback: 15 глубоких и сложных вопросов
  return [
    {
      question: "В каком порядке Event Loop в браузере выполняет Microtasks (Promise, queueMicrotask) и Macrotasks (setTimeout, setInterval)?",
      options: [
        "Сначала выполняются все макрозадачи, а микрозадачи — только перед закрытием страницы",
        "После выполнения текущей макрозадачи очередь микрозадач вычищается полностью до перехода к следующей макрозадаче или рендеру",
        "Микрозадачи и макрозадачи выполняются параллельно в разных потоках CPU",
        "Выполняется строго по одной микрозадаче на каждые пять макрозадач"
      ],
      correctAnswerIndex: 1,
      skill: "JavaScript Fundamentals"
    },
    {
      question: "Что выведет код: console.log(typeof null, null instanceof Object, NaN === NaN)?",
      options: [
        "'object', false, false",
        "'null', false, true",
        "'object', true, false",
        "'undefined', false, false"
      ],
      correctAnswerIndex: 0,
      skill: "JavaScript Core"
    },
    {
      question: "Почему прямая мутация состояния в React (например, state.list.push(item)) считается критической ошибкой?",
      options: [
        "JavaScript аварийно завершит выполнение скрипта",
        "Ссылка на объект не изменяется, поэтому поверхностное сравнение (shallow compare) в React и memo не зафиксирует изменений и пропустит рендер",
        "Это приведет к удалению всех соседних компонентов",
        "Это ошибка только в TypeScript, в чистом JavaScript это рекомендуемый паттерн"
      ],
      correctAnswerIndex: 1,
      skill: "React Architecture"
    },
    {
      question: "К какому багу приводит использование индекса массива (index) в качестве свойства key при рендере динамического списка?",
      options: [
        "Падению браузера из-за переполнения стека",
        "При удалении, фильтрации или сортировке элементов внутреннее состояние (uncontrolled inputs, state) будет привязано к неверным DOM-узлам",
        "Ошибке валидации HTML5 в браузере",
        "К замедлению компиляции Next.js"
      ],
      correctAnswerIndex: 1,
      skill: "React Reconciliation"
    },
    {
      question: "Найдите ошибку в коде: for (var i = 0; i < 3; i++) { setTimeout(() => console.log(i), 50); }. Что выведется и почему?",
      options: [
        "Выведется 0, 1, 2, так как setTimeout всегда сохраняет замыкание переменной",
        "Выведется 3, 3, 3, так как var имеет функциональную область видимости, и все коллбэки захватывают одну и ту же мутированную переменную (нужен let)",
        "Код выбросит ReferenceError",
        "Таймеры не сработают без указания третьего аргумента"
      ],
      correctAnswerIndex: 1,
      skill: "Code Debugging"
    },
    {
      question: "В функциональном компоненте React вызвано: setCount(count + 1); setCount(count + 1);. На сколько увеличится count в следующем рендере?",
      options: [
        "На 2, так как функция вызвана дважды",
        "На 1, так как оба вызова используют одно и то же значение count из текущего замыкания рендера (для аккумуляции нужен functional update: prev => prev + 1)",
        "Произойдет бесконечный цикл рендеров",
        "React выбросит исключение в Strict Mode"
      ],
      correctAnswerIndex: 1,
      skill: "State Management"
    },
    {
      question: "Как в хуке useEffect корректно предотвратить race condition и утечку памяти при выполнении асинхронного fetch-запроса?",
      options: [
        "Использовать синхронный XMLHttpRequest",
        "В cleanup-функции хука вызвать abort() у экземпляра AbortController (или использовать флаг отмены)",
        "Сделать сам коллбэк useEffect асинхронной функцией async () => {}",
        "Удалить зависимости из массива dependencies"
      ],
      correctAnswerIndex: 1,
      skill: "React Lifecycle"
    },
    {
      question: "Какое строгое ограничение накладывает передача props от Server Component к Client Component в Next.js (App Router)?",
      options: [
        "Можно передавать только примитивы типа number и boolean",
        "Props должны быть сериализуемыми (например, JSON-совместимыми); нельзя передавать функции, классы и несериализуемые дескрипторы",
        "Передавать props между серверными и клиентскими компонентами запрещено",
        "Передача возможна только через глобальный store Redux"
      ],
      correctAnswerIndex: 1,
      skill: "Next.js Architecture"
    },
    {
      question: "Из-за чего в приложениях на Next.js / SSR возникает ошибка 'Hydration Mismatch' (Text content did not match)?",
      options: [
        "Из-за отсутствия favicon на сервере",
        "Начальный HTML, сгенерированный сервером, не совпадает с первым деревом рендера на клиенте (например, использование window, Date.now() или Math.random() до монтирования)",
        "Из-за сбоя в базе данных PostgreSQL",
        "Из-за отключенного JavaScript в браузере"
      ],
      correctAnswerIndex: 1,
      skill: "SSR & Hydration"
    },
    {
      question: "Какая архитектурная техника позволяет плавно отображать список из 20 000 сложных карточек товаров без зависания DOM?",
      options: [
        "Отрендерить все 20 000 элементов и скрыть их через display: none",
        "Виртуализация списков (Windowing / Virtual List), когда в реальном DOM отрисовываются только элементы, видимые в текущем viewport",
        "Перевод всех карточек в формат SVG",
        "Рендер элементов через setTimeout с задержкой 1 мс"
      ],
      correctAnswerIndex: 1,
      skill: "Performance Optimization"
    },
    {
      question: "Почему элемент с CSS-свойством z-index: 99999 может отображаться ПОД элементом с z-index: 1?",
      options: [
        "z-index ограничен максимальным значением 10 000",
        "Элемент находится внутри родителя, создавшего изолированный Stacking Context (например, через opacity < 1, transform, filter или contain)",
        "В браузере включен темный режим",
        "Свойство z-index работает только в сочетании с display: table"
      ],
      correctAnswerIndex: 1,
      skill: "CSS Stacking Context"
    },
    {
      question: "Какой HTTP-метод браузер отправляет в качестве Preflight-запроса при сложном кросс-доменном CORS-запросе и зачем?",
      options: [
        "HEAD для проверки времени ответа сервера",
        "OPTIONS для проверки разрешенных методов, заголовков и источника (Origin) на стороне сервера перед отправкой основного запроса",
        "GET для предварительного прогрева DNS",
        "POST с пустым телом для авторизации"
      ],
      correctAnswerIndex: 1,
      skill: "Network & Security"
    },
    {
      question: "Как React по умолчанию защищает приложения от классических атак Cross-Site Scripting (XSS)?",
      options: [
        "Автоматически шифрует трафик с помощью RSA-2048",
        "Автоматически экранирует (escapes) любые строки, вставляемые в JSX-выражения, предотвращая инъекцию исполняемых скриптов (если не используется dangerouslySetInnerHTML)",
        "Блокирует доступ ко всем внешним API",
        "Запрещает использовать форму <input>"
      ],
      correctAnswerIndex: 1,
      skill: "Web Security"
    },
    {
      question: "В чем ключевое практическое отличие между git merge и git rebase при интеграции изменений из ветки feature в main?",
      options: [
        "Разницы нет, git rebase — устаревший алиас для merge",
        "Merge создает отдельный коммит слияния и сохраняет точную хронологию веток; rebase переносит коммиты на верхушку целевой ветки, создавая плоскую линейную историю",
        "Rebase навсегда стирает изменения авторов",
        "Merge работает только локально, а rebase только на GitHub"
      ],
      correctAnswerIndex: 1,
      skill: "Git & Collaboration"
    },
    {
      question: "Что является наиболее распространенной причиной утечек памяти (Memory Leaks) в Single Page Applications (React/Next.js)?",
      options: [
        "Большой объем CSS-стилей в проекте",
        "Неудаленные обработчики событий (window.addEventListener), активные setInterval или незакрытые WebSocket-соединения после размонтирования компонента",
        "Использование ключевого слова const вместо let",
        "Применение console.log на этапе сборки"
      ],
      correctAnswerIndex: 1,
      skill: "Architecture & Memory"
    }
  ];
}

/**
 * POST /api/ai/vacancy-interview
 * Генерация 15 глубоких и сложных вопросов технического собеседования по вакансии
 * Защищен middleware telegramAuth
 */
router.post("/vacancy-interview", telegramAuth, async (req, res) => {
  try {
    const {
      vacancyTitle = "Junior Developer",
      vacancyDescription = "",
      company = "IT Компания",
      language,
    } = req.body;

    const telegramId =
      req.telegramId ||
      req.telegramUser?.id ||
      req.body?.telegram_id ||
      "guest_dev";

    let user = null;
    try {
      user = await User.findOne({ telegramId: String(telegramId) });
      if (!user) {
        user = new User({
          telegramId: String(telegramId),
          username: req.telegramUser?.username || "Learner",
          examsTakenToday: 0,
          lastExamDate: new Date(),
        });
      }

      // Защита от пустых или некорректных данных для старых записей в БД
      if (typeof user.examsTakenToday !== "number" || isNaN(user.examsTakenToday)) {
        user.examsTakenToday = 0;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const lastExam = new Date(user.lastExamDate || 0);
      lastExam.setHours(0, 0, 0, 0);

      if (lastExam.getTime() < today.getTime()) {
        user.examsTakenToday = 0;
        user.lastExamDate = new Date();
      }

      if (user.examsTakenToday >= 3) {
        return res.status(403).json({ error: "limit_reached" });
      }
    } catch (dbErr) {
      console.warn("⚠️ [VacancyInterview Limit] Ошибка проверки лимита в БД:", dbErr.message);
    }

    const resolvedLanguage = language || user?.language || "ru";
    const isUz = resolvedLanguage === "uz";

    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.GEMINI_KEY;

    let questions = null;

    if (apiKey) {
      const prompt = isUz
        ? `Siz '${company}' kompaniyasida '${vacancyTitle}' lavozimiga texnik intervyu olayotgan qattiqqo'l Senior dasturchi va texlidsiz.
Quyidagi vakansiya tavsifi va talablarini chuqur tahlil qiling:
${vacancyDescription || vacancyTitle}

Ushbu ish beruvchi ko'rsatgan texnologiyalar bo'yicha AYNAN 15 ta chuqur va murakkab test savolini tuzing.
Savollar quyidagilarni o'z ichiga olishi SHART:
1. Fundamental baza (til va muhitning ishlash tamoyillari).
2. Tizimli arxitektura va komponentlar aloqasi.
3. Koddagi xatolarni topish (bug hunting).
4. Situatsion amaliy keyslar (performance, memory leak, network, xavfsizlik).

Format talablari:
- Har bir savolda AYNAN 4 ta javob varianti va 1 ta to'g'ri javob indeksi (0, 1, 2 yoki 3) bo'lsin.
- Har bir savolda "skill" maydoni bo'lsin.
- Qat'iy toza JSON massiv qaytaring:
[
  {
    "question": "Savol matni",
    "options": ["Variant 1", "Variant 2", "Variant 3", "Variant 4"],
    "correctAnswerIndex": 0,
    "skill": "Texnologiya/Mavzu"
  }
]
Massivda AYNAN 15 ta ob'ekt bo'lishi kerak. Hech qanday markdown (\`\`\`json) va ortiqcha so'z yozmang!`
        : `Ты — строгий Senior разработчик и техлид, проводящий техническое собеседование в компанию '${company}' на позицию '${vacancyTitle}'.
Проанализируй текст вакансии:
${vacancyDescription || vacancyTitle}

Сгенерируй 15 глубоких и сложных вопросов, которые проверяют технологии, указанные работодателем.
Вопросы должны включать:
1. Проверку фундаментальной базы (принципы работы языка и рантайма).
2. Понимание архитектуры и проектирования компонентов.
3. Поиск ошибок в коде (bug hunting).
4. Ситуативные задачи (performance, memory leaks, безопасность, edge cases).

Формат: 4 варианта ответа, 1 правильный.
Верни строгий JSON-массив из 15 объектов:
[
  {
    "question": "Текст сложного вопроса",
    "options": ["Вариант 1", "Вариант 2", "Вариант 3", "Вариант 4"],
    "correctAnswerIndex": 0,
    "skill": "Технология/Тема"
  }
]
Правила:
- В массиве должно быть РОВНО 15 объектов!
- В options ровно 4 варианта.
- correctAnswerIndex: число 0, 1, 2 или 3.
- Верни ТОЛЬКО чистый JSON без markdown (\`\`\`json) и постороннего текста.`;

      // Попытка 1: Через SDK @google/genai
      try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            temperature: 0.7,
          },
        });

        if (response.text) {
          questions = parseAndValidateInterviewQuestions(response.text);
        }
      } catch (sdkErr) {
        console.warn("⚠️ [VacancyInterview SDK] Ошибка Gemini SDK:", sdkErr.message);

        // Попытка 2: Прямой REST-запрос через axios
        try {
          const restUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
          const restRes = await axios.post(
            restUrl,
            {
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.7,
              },
            },
            {
              headers: { "Content-Type": "application/json" },
              timeout: 30000,
            }
          );
          const rawOutput =
            restRes.data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawOutput) {
            questions = parseAndValidateInterviewQuestions(rawOutput);
          }
        } catch (restErr) {
          console.warn("⚠️ [VacancyInterview REST] Ошибка Gemini REST:", restErr.message);
        }
      }
    }

    if (!questions || questions.length < 15) {
      questions = generateFallbackInterviewQuestions(
        vacancyTitle,
        vacancyDescription,
        isUz
      );
    }

    try {
      if (user) {
        user.examsTakenToday = (user.examsTakenToday || 0) + 1;
        user.lastExamDate = new Date();
        await user.save();
      }
    } catch (saveErr) {
      console.warn("⚠️ [VacancyInterview Limit] Ошибка сохранения счетчика попыток:", saveErr.message);
    }

    return res.status(200).json({
      success: true,
      vacancyTitle,
      company,
      totalQuestions: 15,
      passingScore: 12,
      questions: questions.slice(0, 15),
      examsTakenToday: user ? user.examsTakenToday : 1,
      limit: 3,
    });
  } catch (error) {
    if (res.headersSent) return;
    console.error("❌ [VacancyInterview] Ошибка:", error.message);
    const isUz = req.body?.language === "uz";
    const fallback = generateFallbackInterviewQuestions(
      req.body?.vacancyTitle || "",
      req.body?.vacancyDescription || "",
      isUz
    );

    try {
      if (user) {
        user.examsTakenToday = (user.examsTakenToday || 0) + 1;
        user.lastExamDate = new Date();
        await user.save();
      }
    } catch {}

    return res.status(200).json({
      success: true,
      vacancyTitle: req.body?.vacancyTitle || "Junior Developer",
      company: req.body?.company || "IT Компания",
      totalQuestions: 15,
      passingScore: 12,
      questions: fallback.slice(0, 15),
      examsTakenToday: user ? user.examsTakenToday : 1,
      limit: 3,
    });
  }
});

/**
 * POST /api/ai/cover-letter
 * Генерация короткого и цепляющего сопроводительного письма для отклика на вакансию
 * Защищен middleware telegramAuth
 */
router.post("/cover-letter", telegramAuth, async (req, res) => {
  try {
    const {
      title = "Junior Frontend Developer",
      company = "IT Компания",
      description = "",
      language,
      testScore,
      testTotal = 15,
    } = req.body;

    const telegramId =
      req.telegramId ||
      req.telegramUser?.id ||
      req.body?.telegram_id ||
      "guest_dev";

    let user = null;
    try {
      user = await User.findOne({ telegramId: String(telegramId) });
    } catch (dbErr) {
      console.warn("⚠️ [CoverLetter] Ошибка поиска пользователя:", dbErr.message);
    }

    const resolvedLanguage = language || user?.language || "ru";
    const isUz = resolvedLanguage === "uz";

    const {
      github_url = "",
      portfolio_url = "",
      about_me = "",
      skills = [],
    } = user || {};

    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.GEMINI_KEY;

    let generatedLetter = "";

    const testMentionInfo =
      typeof testScore === "number" && testScore >= 12
        ? isUz
          ? `- Nomzod aynan ushbu vakansiya bo'yicha chuqur texnik intervyudan muvaffaqiyatli o'tib, ${testScore}/${testTotal} ball (80%+ dan yuqori) to'pladi. Buni xatda uning yuqori malakasi, mustahkam bazasi va motivatsiyasi isboti sifatida albatta ta'kidlang.`
          : `- Кандидат только что успешно прошел боевое углубленное техническое собеседование под эту вакансию с результатом ${testScore} из ${testTotal} баллов (более 80%). Обязательно органично упомяни в письме, что кандидат доказал владение фундаментальной базой и готовность к сложным задачам на техническом фильтре к этой вакансии.`
        : "";

    if (apiKey) {
      const prompt = isUz
        ? `Siz tajribali IT karyera maslahatchisisiz.
'${company}' kompaniyasidagi '${title}' vakansiyasiga topshirayotgan nomzod uchun kuchli, professional va e'tiborni tortuvchi Cover Letter (kuzatuv xati) yozing.

Nomzod ma'lumotlari:
- O'zi haqida: ${about_me || "Karyerasini endi boshlayotgan iqtidorli va g'ayratli Junior dasturchi"}
- GitHub: ${github_url || "ko'rsatilmagan"}
- Portfolio: ${portfolio_url || "ko'rsatilmagan"}
- Ko'nikmalari: ${skills.length > 0 ? skills.join(", ") : "HTML, CSS, JavaScript, React"}
- Vakansiya tavsifi/talablari: ${description || title}
${testMentionInfo}

Talablar:
1. Xat o'zbek tilida bo'lsin.
2. Qisqa va lo'nda: maksimum 3-4 ta ixcham abzas.
3. Suv va keraksiz maqtovlardan qoching.
4. Aniq, samimiy va ish beruvchini qiziqtiradigan ohangda bo'lsin.
5. Faqat tayyor xat matnini qaytaring, ortiqcha izohlarsiz.`
        : `Ты — опытный IT-рекрутер и карьерный консультант.
Напиши короткое, профессиональное и цепляющее сопроводительное письмо (Cover Letter) для отклика на вакансию '${title}' в компанию '${company}'.

Данные кандидата:
- О себе: ${about_me || "Мотивированный начинающий разработчик с хорошей базой и желанием быстро расти в сильной команде"}
- GitHub: ${github_url || "не указан"}
- Портфолио: ${portfolio_url || "не указано"}
- Стек технологий: ${skills.length > 0 ? skills.join(", ") : "HTML, CSS, JavaScript, React, Tailwind"}
- Контекст вакансии: ${description || title}
${testMentionInfo}

Требования:
1. Текст должен быть на русском языке.
2. Кратко и емко: максимум 3-4 емких абзаца.
3. Без канцеляризмов, лишней воды и шаблонных фраз.
4. Стиль: уверенный, мотивированный, ориентированный на решение задач бизнеса.
5. Верни ТОЛЬКО готовый текст сопроводительного письма, без вводных фраз и пояснений.`;

      // Попытка 1: Через SDK @google/genai
      try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            temperature: 0.7,
          },
        });

        if (response.text) {
          generatedLetter = response.text.trim();
        }
      } catch (sdkErr) {
        console.warn("⚠️ [CoverLetter SDK] Ошибка Gemini SDK:", sdkErr.message);

        // Попытка 2: Прямой REST-запрос через axios
        try {
          const restUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
          const restRes = await axios.post(
            restUrl,
            {
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.7,
              },
            },
            {
              headers: { "Content-Type": "application/json" },
              timeout: 15000,
            }
          );
          generatedLetter =
            restRes.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
        } catch (restErr) {
          console.warn("⚠️ [CoverLetter REST] Ошибка Gemini REST:", restErr.message);
        }
      }
    }

    if (!generatedLetter) {
      generatedLetter = generateFallbackCoverLetter({
        title,
        company,
        about_me,
        github_url,
        portfolio_url,
        skills,
        isUz,
        testScore,
        testTotal,
      });
    }

    return res.status(200).json({
      success: true,
      coverLetter: generatedLetter,
      testScore,
      testTotal,
      passingScore: 12,
    });
  } catch (error) {
    console.error("❌ [CoverLetter] Ошибка:", error.message);
    const isUz = req.body?.language === "uz";
    const fallbackLetter = generateFallbackCoverLetter({
      title: req.body?.title || "Junior Developer",
      company: req.body?.company || "IT Компания",
      about_me: "",
      github_url: "",
      portfolio_url: "",
      skills: [],
      isUz,
      testScore: req.body?.testScore,
      testTotal: req.body?.testTotal || 15,
    });
    return res.status(200).json({
      success: true,
      coverLetter: fallbackLetter,
      testScore: req.body?.testScore,
      testTotal: req.body?.testTotal || 15,
      passingScore: 12,
    });
  }
});

module.exports = router;
