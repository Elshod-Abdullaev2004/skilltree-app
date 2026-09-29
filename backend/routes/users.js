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
    if (telegramId) {
      const user = await User.findOne({ telegramId: String(telegramId) });
      return res.status(200).json(user ? [user] : []);
    }

    const users = await User.find({}).sort({ createdAt: -1 });
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
      language,
      rank,
      skills,
      level,
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
      if (language === "ru" || language === "uz") {
        existingUser.language = language;
      }
      if (rank !== undefined) existingUser.rank = rank;
      if (Array.isArray(skills)) existingUser.skills = skills;
      if (typeof level === "number") existingUser.level = level;
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
      language: language === "uz" ? "uz" : "ru",
      rank,
      skills: Array.isArray(skills) ? skills : [],
      level: typeof level === "number" ? level : 1,
      unlockedSkills: Array.isArray(unlockedSkills) ? unlockedSkills : [],
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

/**
 * POST /api/users/skills
 * Добавление навыка в профиль пользователя и обновление его уровня (level)
 */
router.post("/skills", async (req, res) => {
  try {
    const { telegramId, username, skill } = req.body;

    if (!skill) {
      return res.status(400).json({
        message: "Поле skill обязательно для добавления навыка",
      });
    }

    const resolvedTelegramId = String(telegramId || "guest_dev");
    const resolvedUsername = username || "Frontend Samurai";

    let user = await User.findOne({ telegramId: resolvedTelegramId });

    if (!user) {
      user = new User({
        telegramId: resolvedTelegramId,
        username: resolvedUsername,
        skills: [skill],
        level: 2,
      });
    } else {
      if (!Array.isArray(user.skills)) {
        user.skills = [];
      }

      if (!user.skills.includes(skill)) {
        user.skills.push(skill);
      }

      user.level = 1 + user.skills.length;
    }

    await user.save();

    return res.status(200).json({
      message: `Навык ${skill} успешно сохранен`,
      user,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Ошибка при добавлении навыка пользователю",
      error: error.message,
    });
  }
});

module.exports = router;
