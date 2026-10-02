const path = require("path");
const dotenv = require("dotenv");

// Загружаем .env из папки backend и из корня проекта (для локальной разработки)
const rootEnv = dotenv.config({ path: path.resolve(__dirname, "../.env") });
const backendEnv = dotenv.config({ path: path.resolve(__dirname, ".env") });

// Подхватываем актуальные переменные MONGO_URI и BOT_TOKEN из любого из .env файлов или окружения облака
const MONGO_PLACEHOLDER = "ЗДЕСЬ_БУДЕТ_МОЯ_СТРОКА_ПОДКЛЮЧЕНИЯ";
if (
  backendEnv.parsed?.MONGO_URI &&
  backendEnv.parsed.MONGO_URI !== MONGO_PLACEHOLDER
) {
  process.env.MONGO_URI = backendEnv.parsed.MONGO_URI;
} else if (
  rootEnv.parsed?.MONGO_URI &&
  rootEnv.parsed.MONGO_URI !== MONGO_PLACEHOLDER
) {
  process.env.MONGO_URI = rootEnv.parsed.MONGO_URI;
}

const BOT_PLACEHOLDER = "ЗДЕСЬ_БУДЕТ_ТОКЕН_БОТА";
if (
  backendEnv.parsed?.BOT_TOKEN &&
  backendEnv.parsed.BOT_TOKEN !== BOT_PLACEHOLDER
) {
  process.env.BOT_TOKEN = backendEnv.parsed.BOT_TOKEN;
} else if (
  rootEnv.parsed?.BOT_TOKEN &&
  rootEnv.parsed.BOT_TOKEN !== BOT_PLACEHOLDER
) {
  process.env.BOT_TOKEN = rootEnv.parsed.BOT_TOKEN;
}

if (backendEnv.parsed?.GEMINI_API_KEY) {
  process.env.GEMINI_API_KEY = backendEnv.parsed.GEMINI_API_KEY;
} else if (rootEnv.parsed?.GEMINI_API_KEY) {
  process.env.GEMINI_API_KEY = rootEnv.parsed.GEMINI_API_KEY;
}

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const usersRouter = require("./routes/users");
const vacanciesRouter = require("./routes/vacancies");
const questionsRouter = require("./routes/questions");
const { initHhCronJob } = require("./services/hhParser");
const { startBot } = require("./bot");

const app = express();
const PORT = process.env.PORT || 5000;

// Настройка CORS для разрешения запросов с фронтенда (Vercel, Telegram WebApp, localhost)
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Парсинг JSON
app.use(express.json());

// Проверка состояния сервера
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "SkillTree Backend API",
    dbState: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

// Основные REST API маршруты
app.use("/api/users", usersRouter);
app.use("/api/vacancies", vacanciesRouter);
app.use("/api/questions", questionsRouter);

// Подключение к MongoDB через Mongoose с использованием process.env.MONGO_URI
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ Успешное подключение к MongoDB");
    // Инициализируем cron-задачу парсинга HH раз в 6 часов после подключения к БД
    initHhCronJob();
  })
  .catch((error) => {
    console.error("❌ Ошибка подключения к MongoDB:", error.message);
  });

// Запуск Telegram-бота SkillTree
startBot();

app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на порту ${PORT} (http://localhost:${PORT})`);
});
