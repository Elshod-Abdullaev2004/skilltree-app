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
  testTotal = 5,
}) {
  const stack =
    skills && skills.length > 0
      ? skills.join(", ")
      : "HTML5, CSS3, JavaScript, React, Next.js";

  const testMention =
    typeof testScore === "number" && testScore >= 3
      ? isUz
        ? `Men ushbu vakansiya bo'yicha kirish ekspress-intervyusidan muvaffaqiyatli o'tib, ${testScore}/${testTotal} ball to'pladim va amaliy bilimlarimni tasdiqladim.\n\n`
        : `Я успешно прошел входное экспресс-интервью под требования этой вакансии с результатом ${testScore} из ${testTotal} баллов, подтвердив знание профильного стека.\n\n`
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
 * Валидация и парсинг 5 вопросов мини-интервью от Gemini
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
        skill: String(item.skill || item.technology || "Frontend").trim(),
      });
    }
  }

  if (validQuestions.length === 0) {
    throw new Error("В ответе Gemini нет валидных вопросов");
  }

  return validQuestions;
}

/**
 * Резервный генератор 5 тестовых вопросов под стек вакансии
 */
function generateFallbackInterviewQuestions(title = "", description = "", isUz = false) {
  const text = `${title} ${description}`.toLowerCase();
  const isReact = /react|next|redux|hooks/i.test(text);

  if (isUz) {
    if (isReact) {
      return [
        {
          question: "React-da komponent qayta renderlanganda qimmat hisob-kitoblarni keshlashtirish uchun qaysi hook ishlatiladi?",
          options: ["useMemo", "useCallback", "useEffect", "useRef"],
          correctAnswerIndex: 0,
          skill: "React",
        },
        {
          question: "React-da Virtual DOM nima maqsadda qo'llaniladi?",
          options: [
            "Faqat server bilan ulanish uchun",
            "Haqiqiy DOM-ga o'zgarishlarni minimal qilib, unumdorlikni oshirish uchun",
            "Ma'lumotlar bazasini boshqarish uchun",
            "CSS uslublarini kompilyatsiya qilish uchun",
          ],
          correctAnswerIndex: 1,
          skill: "React",
        },
        {
          question: "Next.js App Router-da standart holatda barcha komponentlar qanday bo'ladi?",
          options: ["Client Components", "Server Components", "Static HTML", "Pure Functions"],
          correctAnswerIndex: 1,
          skill: "Next.js",
        },
        {
          question: "JavaScript-da Promise.all() qanday vaziyatda reject bo'ladi?",
          options: [
            "Agar barcha promiselar reject bo'lsa",
            "Agar kamida bitta promise reject bo'lsa",
            "U hech qachon reject bo'lmaydi",
            "Faqat tarmoq uzilsa",
          ],
          correctAnswerIndex: 1,
          skill: "JavaScript",
        },
        {
          question: "Git-da mavjud o'zgarishlarni bekor qilmasdan vaqtincha saqlab turish uchun qaysi buyruq ishlatiladi?",
          options: ["git reset", "git stash", "git checkout", "git clean"],
          correctAnswerIndex: 1,
          skill: "Git",
        },
      ];
    }

    return [
      {
        question: "JavaScript-da '==' va '===' operatorlari o'rtasidagi asosiy farq nima?",
        options: [
          "'===' tiplarni keltirmasdan qat'iy tekshiradi",
          "'==' faqat sonlarni tekshiradi",
          "'===' faqat obyektlar uchun ishlatiladi",
          "Hech qanday farqi yo'q",
        ],
        correctAnswerIndex: 0,
        skill: "JavaScript",
      },
      {
        question: "CSS Flexbox-da elementlarni asosiy o'q bo'ylab markazlashtirish uchun nima yoziladi?",
        options: ["align-items: center", "justify-content: center", "align-content: center", "text-align: center"],
        correctAnswerIndex: 1,
        skill: "CSS",
      },
      {
        question: "HTML5-da asosiy noyob kontent uchun qaysi semantik teg mo'ljallangan?",
        options: ["<article>", "<section>", "<main>", "<content>"],
        correctAnswerIndex: 2,
        skill: "HTML",
      },
      {
        question: "JavaScript Event Loop-da Microtask navbatiga nima qo'shiladi?",
        options: ["setTimeout", "Promise callbacks (.then)", "setInterval", "DOM Events"],
        correctAnswerIndex: 1,
        skill: "JavaScript",
      },
      {
        question: "REST API-da mavjud resurs ma'lumotlarini qisman yangilash uchun qaysi HTTP metod qo'llaniladi?",
        options: ["PUT", "PATCH", "POST", "UPDATE"],
        correctAnswerIndex: 1,
        skill: "REST API",
      },
    ];
  }

  // Russian
  if (isReact) {
    return [
      {
        question: "Какой хук в React используется для мемоизации результата сложных вычислений между рендерами?",
        options: ["useMemo", "useCallback", "useRef", "useEffect"],
        correctAnswerIndex: 0,
        skill: "React",
      },
      {
        question: "В чем главное преимущество Virtual DOM в современных веб-приложениях?",
        options: [
          "Позволяет запускать код без JavaScript",
          "Минимизирует дорогостоящие прямые операции перерисовки в реальном DOM",
          "Автоматически шифрует данные пользователя",
          "Заменяет HTTP-запросы к серверу",
        ],
        correctAnswerIndex: 1,
        skill: "React",
      },
      {
        question: "Какими по умолчанию являются компоненты внутри папки app в Next.js (App Router)?",
        options: ["Client Components", "React Server Components", "Static Microtasks", "Pure Reducers"],
        correctAnswerIndex: 1,
        skill: "Next.js",
      },
      {
        question: "Когда промис, возвращенный Promise.all(), переходит в состояние rejected?",
        options: [
          "Только если все переданные промисы отклонены",
          "Как только хотя бы один из переданных промисов завершился с ошибкой",
          "Только по истечении таймаута",
          "Он никогда не переходит в rejected",
        ],
        correctAnswerIndex: 1,
        skill: "JavaScript",
      },
      {
        question: "Какая команда Git временно сохраняет незакоммиченные локальные изменения в стек?",
        options: ["git reset --soft", "git stash", "git checkout -b", "git revert"],
        correctAnswerIndex: 1,
        skill: "Git",
      },
    ];
  }

  return [
    {
      question: "В чем ключевое отличие оператора строгого равенства (===) от нестрогого (==) в JavaScript?",
      options: [
        "=== сравнивает значения без неявного приведения типов",
        "== работает только с числами",
        "=== работает только с объектами",
        "Разницы нет, это синонимы",
      ],
      correctAnswerIndex: 0,
      skill: "JavaScript",
    },
    {
      question: "Какое свойство CSS выравнивает flex-элементы вдоль главной оси контейнера?",
      options: ["align-items", "justify-content", "align-content", "place-items"],
      correctAnswerIndex: 1,
      skill: "CSS",
    },
    {
      question: "Какой семантический тег HTML5 предназначен для основного уникального содержимого страницы?",
      options: ["<section>", "<article>", "<main>", "<div>"],
      correctAnswerIndex: 2,
      skill: "HTML",
    },
    {
      question: "Что из перечисленного попадает в очередь микрозадач (Microtask Queue) в Event Loop браузера?",
      options: ["Коллбэки setTimeout", "Коллбэки Promise (.then/.catch)", "Коллбэки setInterval", "События клика мыши"],
      correctAnswerIndex: 1,
      skill: "JavaScript",
    },
    {
      question: "Какой HTTP-метод по стандарту REST предназначен для частичного обновления полей ресурса?",
      options: ["PUT", "PATCH", "POST", "UPDATE"],
      correctAnswerIndex: 1,
      skill: "REST API",
    },
  ];
}

/**
 * POST /api/ai/vacancy-interview
 * Генерация 5 проверочных вопросов экспресс-собеседования по конкретной вакансии
 * Защищен middleware telegramAuth
 */
router.post("/vacancy-interview", telegramAuth, async (req, res) => {
  try {
    const {
      vacancyTitle = "Junior Frontend Developer",
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
    } catch (dbErr) {
      console.warn("⚠️ [VacancyInterview] Ошибка поиска пользователя:", dbErr.message);
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
        ? `Siz '${company}' kompaniyasida '${vacancyTitle}' lavozimiga texnik intervyu olayotgan qattiqqo'l Senior dasturchisiz.
Quyidagi vakansiya tavsifi va talablarini chuqur tahlil qiling:
${vacancyDescription || vacancyTitle}

Ushbu ish beruvchi talab qilayotgan aynan o'sha texnologiyalar va amaliy ko'nikmalarni tekshiruvchi AYNAN 5 ta murakkab, amaliy test savolini tuzing.
Har bir savolda AYNAN 4 ta javob varianti va 1 ta to'g'ri javob indeksi (0, 1, 2 yoki 3) bo'lsin.
Har bir savol uchun "skill" maydonida aynan qaysi texnologiya tekshirilayotganini ko'rsating.

Javobni FAQAT va QAT'IY ravishda quyidagi JSON-massiv formatida qaytaring:
[
  {
    "question": "Savol matni",
    "options": ["Variant 1", "Variant 2", "Variant 3", "Variant 4"],
    "correctAnswerIndex": 0,
    "skill": "Texnologiya nomi (masalan: React, JavaScript, CSS, SQL va h.k.)"
  }
]
Qoidalar:
- Massivda AYNAN 5 ta ob'ekt bo'lsin!
- FAQAT toza JSON qaytaring, hech qanday markdown (\`\`\`json) va tushuntirish yozmang.`
        : `Ты — строгий Senior разработчик, проводящий собеседование в компанию '${company}' на позицию '${vacancyTitle}'.
Внимательно проанализируй текст и требования вакансии:
${vacancyDescription || vacancyTitle}

Сгенерируй РОВНО 5 сложных, практических тестовых вопросов (с 4 вариантами ответов, где ровно 1 правильный), которые проверяют именно те технологии и навыки, которые требует этот работодатель.
Для каждого вопроса обязательно укажи проверяемую технологию/навык в поле "skill".

Верни ответ СТРОГО в виде валидного JSON-массива из 5 объектов:
[
  {
    "question": "Текст практического вопроса",
    "options": ["Вариант 1", "Вариант 2", "Вариант 3", "Вариант 4"],
    "correctAnswerIndex": 0,
    "skill": "Название технологии (например, React, TypeScript, Git, REST API)"
  }
]
Правила:
- В массиве должно быть РОВНО 5 объектов!
- В options должно быть ровно 4 варианта.
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
              timeout: 12000,
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

    if (!questions || questions.length < 5) {
      questions = generateFallbackInterviewQuestions(
        vacancyTitle,
        vacancyDescription,
        isUz
      );
    }

    return res.status(200).json({
      success: true,
      vacancyTitle,
      company,
      totalQuestions: 5,
      passingScore: 3,
      questions: questions.slice(0, 5),
    });
  } catch (error) {
    console.error("❌ [VacancyInterview] Ошибка:", error.message);
    const isUz = req.body?.language === "uz";
    const fallback = generateFallbackInterviewQuestions(
      req.body?.vacancyTitle || "",
      req.body?.vacancyDescription || "",
      isUz
    );
    return res.status(200).json({
      success: true,
      vacancyTitle: req.body?.vacancyTitle || "Junior Developer",
      company: req.body?.company || "IT Компания",
      totalQuestions: 5,
      passingScore: 3,
      questions: fallback.slice(0, 5),
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
      testTotal = 5,
    } = req.body;

    const telegramId =
      req.telegramId ||
      req.telegramUser?.id ||
      req.body?.telegram_id ||
      "guest_dev";

    // Извлекаем профиль пользователя из MongoDB
    let user = null;
    try {
      user = await User.findOne({ telegramId: String(telegramId) });
    } catch (dbErr) {
      console.warn("⚠️ [CoverLetter] Ошибка поиска пользователя:", dbErr.message);
    }

    const github_url = user?.github_url || "";
    const portfolio_url = user?.portfolio_url || "";
    const about_me = user?.about_me || "";
    const skills = Array.isArray(user?.skills) ? user.skills : [];
    const resolvedLanguage = language || user?.language || "ru";
    const isUz = resolvedLanguage === "uz";

    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.GEMINI_KEY;

    let generatedLetter = "";

    const testMentionInfo =
      typeof testScore === "number" && testScore >= 3
        ? isUz
          ? `- Nomzod aynan ushbu vakansiya bo'yicha kirish texnik ekspress-intervyusidan muvaffaqiyatli o'tib, ${testScore}/${testTotal} ball to'pladi. Buni xatda uning amaliy bilimlari va motivatsiyasi isboti sifatida albatta qisqa ta'kidlang.`
          : `- Кандидат только что успешно прошел входное экспресс-интервью под эту вакансию с результатом ${testScore} из ${testTotal} баллов. Обязательно органично упомяни в письме, что кандидат уже подтвердил владение требуемыми навыками на экспресс-тестировании к этой позиции.`
        : "";

    if (apiKey) {
      const prompt = isUz
        ? `Siz tajribali IT karyera maslahatchisisiz.
Junior dasturchi uchun '${company}' kompaniyasidagi '${title}' vakansiyasiga qisqa (2-3 ta ixcham xatboshi), professional, o'ziga ishongan va rekruterni jalb qiluvchi ajoyib kuzatuv xati (сопроводительное письмо) yozing.

Nomzod ma'lumotlari:
- O'zi haqida: ${about_me || "Veb-dasturlash asoslarini puxta o'rgangan Junior dasturchi"}
- GitHub: ${github_url || "ko'rsatilmagan"}
- Portfolio: ${portfolio_url || "ko'rsatilmagan"}
- Ko'nikmalari: ${skills.length > 0 ? skills.join(", ") : "HTML, CSS, JavaScript, React"}
- Vakansiya tavsifi/talablari: ${description || title}
${testMentionInfo}

Talablar:
1. Xat o'zbek tilida bo'lsin.
2. Qat'iy, ishonchli, samimiy va ortiqcha klishe/suvsiz bo'lsin.
3. Yo'q tajribani to'qimang.
4. Xat salomlashishdan boshlansin va suhbatga taklif bilan yakunlansin.
5. FAQAT tayyor xat matnini qaytaring, hech qanday qo'shimcha tushuntirish va sarlavhalarsiz.`
        : `Ты опытный IT-карьерный консультант и технический рекрутер.
Напиши короткое (2-3 емких абзаца), профессиональное, уверенное и цепляющее сопроводительное письмо для джуниор-разработчика на вакансию «${title}» в компанию «${company}».

Данные кандидата:
- О себе: ${about_me || "Junior веб-разработчик с хорошей базой и практическими проектами"}
- GitHub: ${github_url || "не указан"}
- Портфолио: ${portfolio_url || "не указано"}
- Стек технологий: ${skills.length > 0 ? skills.join(", ") : "HTML, CSS, JavaScript, React, Tailwind"}
- Контекст вакансии: ${description || title}
${testMentionInfo}

Требования:
1. Текст должен быть на русском языке.
2. Уверенный, без воды, без шаблонных пустых фраз вроде "я ответственный и стрессоустойчивый".
3. Не придумывай опыт, которого нет. Сделай упор на мотивацию, практические навыки и готовность решать реальные задачи ${company}.
4. Верни ТОЛЬКО готовый текст сопроводительного письма без мета-комментариев и оформления markdown.`;

      // Попытка 1: Через SDK @google/genai
      try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            temperature: 0.7,
            maxOutputTokens: 800,
          },
        });

        if (response.text && response.text.trim().length > 40) {
          generatedLetter = response.text
            .replace(/^```[a-z]*\s*/i, "")
            .replace(/\s*```$/i, "")
            .trim();
        }
      } catch (sdkErr) {
        console.warn("⚠️ [CoverLetter SDK] Ошибка SDK Gemini:", sdkErr.message);

        // Попытка 2: Прямой REST-запрос через axios
        try {
          const restUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
          const restRes = await axios.post(
            restUrl,
            {
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 800,
              },
            },
            {
              headers: { "Content-Type": "application/json" },
              timeout: 12000,
            }
          );

          const candidateText =
            restRes.data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidateText && candidateText.trim().length > 40) {
            generatedLetter = candidateText
              .replace(/^```[a-z]*\s*/i, "")
              .replace(/\s*```$/i, "")
              .trim();
          }
        } catch (restErr) {
          console.warn("⚠️ [CoverLetter REST] Ошибка REST Gemini:", restErr.message);
        }
      }
    }

    // Если нейросеть вернула пустоту или ключ не настроен, используем качественный шаблон
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
      title,
      company,
      coverLetter: generatedLetter,
    });
  } catch (error) {
    console.error("❌ [CoverLetter] Критическая ошибка генерации:", error.message);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Не удалось сгенерировать сопроводительное письмо: " + error.message,
    });
  }
});

module.exports = router;
