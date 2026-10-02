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
 * GET /api/users/profile
 * Получение профиля пользователя по ?telegramId=...
 */
router.get("/profile", async (req, res) => {
  try {
    const telegramId = req.query.telegramId || "guest_dev";
    let user = await User.findOne({ telegramId: String(telegramId) });
    if (!user) {
      return res.status(200).json({
        telegramId: String(telegramId),
        username: "Frontend Samurai",
        github_url: "",
        portfolio_url: "",
        about_me: "",
        rank: "Junior Web Developer",
        skills: [],
        level: 1,
      });
    }
    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({
      message: "Ошибка при получении профиля пользователя",
      error: error.message,
    });
  }
});

/**
 * PUT /api/users/profile
 * Обновление данных профиля: github_url, portfolio_url, about_me у конкретного пользователя
 */
router.put("/profile", async (req, res) => {
  try {
    const {
      telegramId,
      username,
      github_url,
      portfolio_url,
      about_me,
      rank,
      role,
      skills,
      level,
    } = req.body;

    const resolvedTelegramId = String(
      telegramId || req.query.telegramId || "guest_dev"
    );

    let user = await User.findOne({ telegramId: resolvedTelegramId });

    if (!user) {
      user = new User({
        telegramId: resolvedTelegramId,
        username: username || "Frontend Samurai",
        github_url: typeof github_url === "string" ? github_url.trim() : "",
        portfolio_url:
          typeof portfolio_url === "string" ? portfolio_url.trim() : "",
        about_me: typeof about_me === "string" ? about_me.trim() : "",
        rank:
          typeof (rank || role) === "string"
            ? (rank || role).trim()
            : "Junior Web Developer",
        skills: Array.isArray(skills) ? skills : [],
        level: typeof level === "number" ? level : 1,
      });
    } else {
      if (github_url !== undefined) {
        user.github_url = typeof github_url === "string" ? github_url.trim() : "";
      }
      if (portfolio_url !== undefined) {
        user.portfolio_url =
          typeof portfolio_url === "string" ? portfolio_url.trim() : "";
      }
      if (about_me !== undefined) {
        user.about_me = typeof about_me === "string" ? about_me.trim() : "";
      }
      if (username !== undefined && username) {
        user.username = username;
      }
      if (rank !== undefined) {
        user.rank = rank;
      } else if (role !== undefined) {
        user.rank = role;
      }
      if (Array.isArray(skills)) {
        user.skills = skills;
      }
      if (typeof level === "number") {
        user.level = level;
      }
    }

    const updatedUser = await user.save();

    return res.status(200).json({
      success: true,
      message: "Данные сохранены!",
      user: updatedUser,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Ошибка при обновлении профиля",
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
      github_url,
      portfolio_url,
      about_me,
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
      if (github_url !== undefined) {
        existingUser.github_url =
          typeof github_url === "string" ? github_url.trim() : "";
      }
      if (portfolio_url !== undefined) {
        existingUser.portfolio_url =
          typeof portfolio_url === "string" ? portfolio_url.trim() : "";
      }
      if (about_me !== undefined) {
        existingUser.about_me =
          typeof about_me === "string" ? about_me.trim() : "";
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
      github_url: typeof github_url === "string" ? github_url.trim() : "",
      portfolio_url:
        typeof portfolio_url === "string" ? portfolio_url.trim() : "",
      about_me: typeof about_me === "string" ? about_me.trim() : "",
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
