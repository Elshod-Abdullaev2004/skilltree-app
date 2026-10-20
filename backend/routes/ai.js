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
}) {
  const stack =
    skills && skills.length > 0
      ? skills.join(", ")
      : "HTML5, CSS3, JavaScript, React, Next.js";

  if (isUz) {
    return `Assalomu alaykum!

Meni ${company} jamoasidagi «${title}» vakansiyasi juda qiziqtirdi. Men IT sohasida faol rivojlanayotgan va jamoaga maksimal foyda keltirishga intilayotgan Junior dasturchiman.

${about_me ? `${about_me}\n\n` : ""}Mening amaliy bilimlarim va texnologiyalarim: ${stack}. O'z loyihalarimda toza kod yozish, zamonaviy standartlar va qulay foydalanuvchi interfeysiga (UI/UX) alohida e'tibor qarataman.

${github_url ? `💻 GitHub profilim: ${github_url}\n` : ""}${portfolio_url ? `🌐 Portfolio: ${portfolio_url}\n` : ""}
${company} talablariga tez moslashib, amaliy topshiriqlarni mas'uliyat bilan bajarishga tayyorman.

Texnik suhbatda ko'nikmalarimni batafsil muhokama qilishdan mamnun bo'laman!`;
  }

  return `Здравствуйте!

Меня искренне заинтересовала позиция «${title}» в компании ${company}. Я начинающий разработчик с горящими глазами, хорошей базой и желанием приносить реальную пользу продукту.

${about_me ? `${about_me}\n\n` : ""}Мой технологический стек: ${stack}. В своих проектах уделяю особое внимание чистоте кода, компонентному подходу и адаптивной верстке.

${github_url ? `💻 GitHub с примерами кода: ${github_url}\n` : ""}${portfolio_url ? `🌐 Портфолио: ${portfolio_url}\n` : ""}
Готов быстро погрузиться в процессы команды ${company}, оперативно решать поставленные задачи и расти под руководством старших коллег.

Буду рад возможности пообщаться на интервью и выполнить тестовое задание!`;
}

/**
 * POST /api/ai/cover-letter
 * Генерация короткого и цепляющего сопроводительного письма для отклика на вакансию
 * Защищен middleware telegramAuth
 */
router.post("/cover-letter", telegramAuth, async (req, res) => {
  try {
    const { title = "Junior Frontend Developer", company = "IT Компания", description = "", language } =
      req.body;

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
