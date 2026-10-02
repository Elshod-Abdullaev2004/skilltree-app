const express = require("express");
const Vacancy = require("../models/Vacancy");
const { syncHhVacancies } = require("../services/hhParser");

const router = express.Router();

/**
 * GET /api/vacancies/reset
 * Очистка коллекции вакансий и полный перезапуск парсера с нуля с сохранением прямых ссылок
 */
router.get("/reset", async (_req, res) => {
  try {
    const deleteResult = await Vacancy.deleteMany({});
    const result = await syncHhVacancies({ forceReset: true });
    return res.status(200).json({
      message: "Коллекция вакансий успешно очищена и перезаполнена с нуля",
      deletedCount: deleteResult.deletedCount,
      ...result,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Ошибка при сбросе и перезапуске синхронизации вакансий",
      error: error.message,
    });
  }
});

/**
 * GET /api/vacancies/sync
 * Ручной запуск парсера вакансий HeadHunter (Ташкент, IT, noExperience + between1And3)
 */
router.get("/sync", async (_req, res) => {
  try {
    const result = await syncHhVacancies();
    return res.status(200).json({
      message: "Синхронизация вакансий с HeadHunter успешно выполнена",
      ...result,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Ошибка при синхронизации вакансий с HeadHunter",
      error: error.message,
    });
  }
});

/**
 * GET /api/vacancies
 * Получение списка всех вакансий с опциональной фильтрацией по тегу (?tag=React)
 */
router.get("/", async (req, res) => {
  try {
    const { tag } = req.query;
    const filter =
      tag && tag !== "Все" ? { tags: { $in: [String(tag)] } } : {};

    const vacancies = await Vacancy.find(filter).sort({ createdAt: -1 });
    return res.status(200).json(vacancies);
  } catch (error) {
    return res.status(500).json({
      message: "Ошибка при получении списка вакансий",
      error: error.message,
    });
  }
});

/**
 * POST /api/vacancies
 * Добавление новой вакансии в базу данных
 */
router.post("/", async (req, res) => {
  try {
    const { title, company, salary, sourceUrl, tags } = req.body;

    if (!title || !company || !salary || !sourceUrl) {
      return res.status(400).json({
        message:
          "Поля title, company, salary и sourceUrl обязательны для создания вакансии",
      });
    }

    const newVacancy = await Vacancy.create({
      title,
      company,
      salary,
      sourceUrl,
      tags: Array.isArray(tags) ? tags : [],
    });

    return res.status(201).json(newVacancy);
  } catch (error) {
    return res.status(500).json({
      message: "Ошибка при создании вакансии",
      error: error.message,
    });
  }
});

module.exports = router;
