const express = require("express");
const User = require("../models/User");

const router = express.Router();

/**
 * GET /api/users
 * Получение списка всех пользователей или поиск конкретного пользователя по ?telegramId=...
 */
router.get("/", async (req, res) => {
  try {
    const { telegramId } = req.query;
    const filter = telegramId ? { telegramId: String(telegramId) } : {};

    const users = await User.find(filter).sort({ createdAt: -1 });
    return res.status(200).json(users);
  } catch (error) {
    return res.status(500).json({
      message: "Ошибка при получении пользователей",
      error: error.message,
    });
  }
});

/**
 * POST /api/users
 * Создание нового пользователя или обновление существующего по telegramId
 */
router.post("/", async (req, res) => {
  try {
    const {
      telegramId,
      username,
      rank,
      unlockedSkills,
      notificationsEnabled,
    } = req.body;

    if (!telegramId || !username) {
      return res.status(400).json({
        message: "Поля telegramId и username обязательны",
      });
    }

    const existingUser = await User.findOne({ telegramId: String(telegramId) });

    if (existingUser) {
      if (username !== undefined) existingUser.username = username;
      if (rank !== undefined) existingUser.rank = rank;
      if (Array.isArray(unlockedSkills)) {
        existingUser.unlockedSkills = unlockedSkills;
      }
      if (typeof notificationsEnabled === "boolean") {
        existingUser.notificationsEnabled = notificationsEnabled;
      }

      const updatedUser = await existingUser.save();
      return res.status(200).json(updatedUser);
    }

    const newUser = await User.create({
      telegramId: String(telegramId),
      username,
      rank,
      unlockedSkills,
      notificationsEnabled,
    });

    return res.status(201).json(newUser);
  } catch (error) {
    return res.status(500).json({
      message: "Ошибка при сохранении пользователя",
      error: error.message,
    });
  }
});

module.exports = router;
