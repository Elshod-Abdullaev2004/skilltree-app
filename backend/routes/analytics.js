const express = require("express");
const router = express.Router();
const Event = require("../models/Event");
const telegramAuth = require("../middleware/telegramAuth");

/**
 * POST /api/analytics/track
 * Запись продуктового аналитического события воронки
 * Защищен middleware telegramAuth (принимает запросы только от авторизованных TMA-пользователей)
 */
router.post("/track", telegramAuth, async (req, res) => {
  try {
    const { eventType, payload } = req.body;

    if (!eventType || typeof eventType !== "string") {
      return res.status(400).json({
        error: "Bad Request",
        message: "Поле eventType обязательно и должно быть строкой",
      });
    }

    // Извлекаем подтвержденный telegram_id из авторизации telegramAuth
    const telegram_id =
      req.telegramId ||
      req.telegramUser?.id ||
      req.body.telegram_id ||
      "guest_dev";

    const event = new Event({
      telegram_id: String(telegram_id),
      eventType: eventType.trim(),
      payload: payload && typeof payload === "object" ? payload : {},
      createdAt: new Date(),
    });

    await event.save();

    return res.status(201).json({
      success: true,
      event: {
        id: event._id,
        telegram_id: event.telegram_id,
        eventType: event.eventType,
        payload: event.payload,
        createdAt: event.createdAt,
      },
    });
  } catch (error) {
    console.error("❌ [Analytics] Ошибка сохранения события:", error.message);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Не удалось сохранить аналитическое событие: " + error.message,
    });
  }
});

/**
 * GET /api/analytics/funnel
 * Сводка продуктовой воронки по этапам (общее число и уникальные пользователи)
 */
router.get("/funnel", async (_req, res) => {
  try {
    const funnelSteps = [
      "app_opened",
      "skill_clicked",
      "vacancy_viewed",
      "quiz_completed",
      "vacancy_apply_clicked",
    ];

    const counts = await Event.aggregate([
      {
        $match: {
          eventType: { $in: funnelSteps },
        },
      },
      {
        $group: {
          _id: "$eventType",
          totalEvents: { $sum: 1 },
          uniqueUsers: { $addToSet: "$telegram_id" },
        },
      },
    ]);

    const formatted = {};
    for (const step of funnelSteps) {
      const found = counts.find((c) => c._id === step);
      formatted[step] = {
        total: found ? found.totalEvents : 0,
        uniqueUsers: found ? found.uniqueUsers.length : 0,
      };
    }

    return res.status(200).json({
      success: true,
      funnel: formatted,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
    });
  }
});

module.exports = router;
