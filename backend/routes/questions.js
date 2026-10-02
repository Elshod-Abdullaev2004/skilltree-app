const express = require("express");
const axios = require("axios");
const { GoogleGenAI } = require("@google/genai");

const router = express.Router();

// Резервный словарь вопросов по ключевым навыкам (на случай отсутствия ключа или ошибки сети)
const FALLBACK_QUESTIONS = {
  ru: {
    HTML: {
      question: "Какой семантический тег используется для основного уникального содержимого веб-страницы?",
      options: ["<section>", "<main>", "<article>", "<div>"],
      correctAnswerIndex: 1,
    },
    CSS: {
      question: "Какое свойство Flexbox выравнивает дочерние элементы вдоль главной оси контейнера?",
      options: ["align-items", "justify-content", "flex-direction", "align-content"],
      correctAnswerIndex: 1,
    },
    JavaScript: {
      question: "Какой результат вернет выражение typeof null в стандарте JavaScript?",
      options: ["\"null\"", "\"undefined\"", "\"object\"", "\"number\""],
      correctAnswerIndex: 2,
    },
    React: {
      question: "Какой хук в React используется для сохранения состояния между рендерами функционального компонента?",
      options: ["useEffect", "useMemo", "useState", "useRef"],
      correctAnswerIndex: 2,
    },
    "Next.js": {
      question: "В какой директории в Next.js 13+ (App Router) создаются страницы и маршруты приложения?",
      options: ["pages/", "app/", "routes/", "src/components/"],
      correctAnswerIndex: 1,
    },
    Tailwind: {
      question: "Какой класс Tailwind CSS задает полужирное начертание шрифта (font-weight: 700)?",
      options: ["font-medium", "font-bold", "text-bold", "font-black"],
      correctAnswerIndex: 1,
    },
  },
  uz: {
    HTML: {
      question: "Veb-sahifaning asosiy noyob mazmunini ifodalash uchun qaysi semantik teg ishlatiladi?",
      options: ["<section>", "<main>", "<article>", "<div>"],
      correctAnswerIndex: 1,
    },
    CSS: {
      question: "Flexbox-da elementlarni asosiy o'q bo'ylab tekislash uchun qaysi xususiyat ishlatiladi?",
      options: ["align-items", "justify-content", "flex-direction", "align-content"],
      correctAnswerIndex: 1,
    },
    JavaScript: {
      question: "JavaScript standartida typeof null ifodasi qanday natija qaytaradi?",
      options: ["\"null\"", "\"undefined\"", "\"object\"", "\"number\""],
      correctAnswerIndex: 2,
    },
    React: {
      question: "React funksional komponentlarida holatni (state) saqlash uchun qaysi hook ishlatiladi?",
      options: ["useEffect", "useMemo", "useState", "useRef"],
      correctAnswerIndex: 2,
    },
    "Next.js": {
      question: "Next.js 13+ (App Router) da sahifalar va marshrutlar qaysi papkada yaratiladi?",
      options: ["pages/", "app/", "routes/", "src/components/"],
      correctAnswerIndex: 1,
    },
    Tailwind: {
      question: "Tailwind CSS-da qalin shriftni (font-weight: 700) o'rnatish uchun qaysi klass ishlatiladi?",
      options: ["font-medium", "font-bold", "text-bold", "font-black"],
      correctAnswerIndex: 1,
    },
  },
};

/**
 * Очищает ответ модели от возможных markdown-оберток и парсит JSON
 */
function parseAndValidateGeminiResponse(rawText) {
  if (!rawText || typeof rawText !== "string") {
    throw new Error("Пустой ответ от Gemini");
  }

  const cleaned = rawText
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const data = JSON.parse(cleaned);

  if (
    !data.question ||
    !Array.isArray(data.options) ||
    data.options.length !== 4 ||
    typeof data.correctAnswerIndex !== "number" ||
    data.correctAnswerIndex < 0 ||
    data.correctAnswerIndex > 3
  ) {
    throw new Error("Неверная структура JSON от Gemini");
  }

  return {
    question: String(data.question).trim(),
    options: data.options.map((opt) => String(opt).trim()),
    correctAnswerIndex: Math.floor(data.correctAnswerIndex),
  };
}

/**
 * GET /api/questions/generate
 * Генерация тестового вопроса по навыку с помощью Gemini 2.5 Flash
 * Query параметры:
 * - skill: название навыка (HTML, CSS, JavaScript, React, Next.js, Tailwind, etc.)
 * - language: язык вопроса (ru или uz)
 */
async function generateHandler(req, res) {
  const skill = (req.query.skill || "JavaScript").toString().trim();
  const language = (req.query.language || "ru").toString().toLowerCase().trim();
  const isUz = language === "uz";

  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GEMINI_KEY;

  const prompt = isUz
    ? `Siz IT sohasidagi texnik intervyuer va mentor siz.
Junior darajasidagi dasturchi uchun '${skill}' texnologiyasi bo'yicha AYNAN 1 ta amaliy va qiziqarli test savolini tuzing.

Javobni FAQAT va QAT'IY ravishda quyidagi JSON formatida qaytaring:
{
  "question": "Savol matni",
  "options": ["1-variant", "2-variant", "3-variant", "4-variant"],
  "correctAnswerIndex": 0
}

Qoidalar:
- options massivida AYNAN 4 ta variant bo'lishi shart.
- correctAnswerIndex to'g'ri javobning indeksi (0, 1, 2 yoki 3) bo'lishi shart.
- Variantlarning bittasi to'g'ri, qolgan 3 tasi ishonarli noto'g'ri variantlar bo'lsin.
- FAQAT toza JSON qaytaring, hech qanday markdown (\`\`\`json) yoki qo'shimcha so'z qo'shmang.`
    : `Ты опытный технический IT-интервьюер и ментор разработчиков.
Составь РОВНО 1 качественный практический тестовый вопрос по технологии '${skill}' для Junior-разработчика.

Верни ответ СТРОГО в следующем формате JSON:
{
  "question": "Текст вопроса",
  "options": ["Вариант 1", "Вариант 2", "Вариант 3", "Вариант 4"],
  "correctAnswerIndex": 0
}

Правила:
- В массиве options должно быть РОВНО 4 варианта ответа.
- correctAnswerIndex — числовой индекс правильного ответа (0, 1, 2 или 3).
- Один вариант верный, остальные три — правдоподобные дистракторы.
- Верни ТОЛЬКО валидный чистый JSON без markdown (\`\`\`json) и без пояснений.`;

  // Попытка 1: Использование официального SDK @google/genai
  if (apiKey) {
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

      const parsed = parseAndValidateGeminiResponse(response.text);
      return res.status(200).json({
        ...parsed,
        skill,
        language: isUz ? "uz" : "ru",
        model: "gemini-2.5-flash",
      });
    } catch (sdkError) {
      console.warn("⚠️ [@google/genai] Ошибка вызова SDK:", sdkError.message);

      // Попытка 2: Прямой REST-запрос через axios к Google Gemini API
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
            timeout: 10000,
          }
        );

        const textOutput =
          restRes.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        const parsed = parseAndValidateGeminiResponse(textOutput);
        return res.status(200).json({
          ...parsed,
          skill,
          language: isUz ? "uz" : "ru",
          model: "gemini-2.5-flash (REST)",
        });
      } catch (restError) {
        console.warn(
          "⚠️ [Gemini REST] Ошибка прямого запроса:",
          restError.response?.data || restError.message
        );
      }
    }
  } else {
    console.warn(
      "⚠️ [Gemini] Переменная GEMINI_API_KEY не задана. Используется резервный вопрос."
    );
  }

  // Резервный вопрос (Fallback)
  const langKey = isUz ? "uz" : "ru";
  const fallbackDict = FALLBACK_QUESTIONS[langKey] || FALLBACK_QUESTIONS.ru;
  const fallback =
    fallbackDict[skill] ||
    fallbackDict[skill.toLowerCase()] || {
      question: isUz
        ? `'${skill}' bo'yicha asosiy tushunchalarni bilasizmi? Qaysi javob to'g'ri?`
        : `Что из перечисленного является ключевой концепцией в ${skill}?`,
      options: isUz
        ? [
            `${skill} asosiy arxitekturasi va standartlari`,
            "Faqat CSS uslublari",
            "Faqat HTML belgilash",
            "Bunday texnologiya mavjud emas",
          ]
        : [
            `Базовая архитектура и принципы работы ${skill}`,
            "Исключительно стили оформления",
            "Такой технологии не существует",
            "Используется только для печати",
          ],
      correctAnswerIndex: 0,
    };

  return res.status(200).json({
    ...fallback,
    skill,
    language: langKey,
    model: "fallback",
  });
}

router.get("/generate", generateHandler);
router.get("/", generateHandler);

module.exports = router;
