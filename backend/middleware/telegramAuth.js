const crypto = require("crypto");

/**
 * Middleware криптографической валидации данных Telegram Web App (initData)
 * 
 * Алгоритм проверки в соответствии с официальной документацией Telegram:
 * 1. Извлекается строка initData из заголовка Authorization (Bearer <initData>),
 *    x-telegram-init-data или тела/параметров запроса.
 * 2. Вычисляется секретный ключ: HMAC-SHA256("WebAppData", BOT_TOKEN).
 * 3. Из initData удаляется параметр hash (и signature при наличии).
 * 4. Все остальные параметры сортируются по алфавиту в формате key=value, разделенные \n.
 * 5. Генерируется HMAC-SHA256 хеш от полученной строки с секретным ключом.
 * 6. Сравнивается сгенерированный хеш с переданным hash.
 */
function telegramAuth(req, res, next) {
  // 1. Извлечение initData из заголовков запроса
  let initData = "";
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (authHeader) {
    if (authHeader.startsWith("Bearer ") || authHeader.startsWith("bearer ")) {
      initData = authHeader.slice(7).trim();
    } else if (authHeader.startsWith("tma ") || authHeader.startsWith("Tma ")) {
      initData = authHeader.slice(4).trim();
    } else {
      initData = authHeader.trim();
    }
  }

  if (!initData && req.headers["x-telegram-init-data"]) {
    initData = req.headers["x-telegram-init-data"].trim();
  }

  if (!initData && req.body && req.body.initData) {
    initData = String(req.body.initData).trim();
  }

  if (!initData && req.query && req.query.initData) {
    initData = String(req.query.initData).trim();
  }

  const botToken = process.env.BOT_TOKEN;

  // Режим разработки или гостевой доступ (если токен еще не задан или запущен локальный тест вне Telegram)
  const isDevOrTest =
    process.env.NODE_ENV !== "production" ||
    !botToken ||
    botToken === "ЗДЕСЬ_БУДЕТ_ТОКЕН_БОТА" ||
    req.headers["x-guest-mode"] === "true";

  if (!initData) {
    if (isDevOrTest) {
      req.telegramUser = {
        id: req.body?.telegramId || req.query?.telegramId || "guest_dev",
        username: req.body?.username || "Frontend Samurai",
      };
      req.telegramId = String(req.telegramUser.id);
      return next();
    }

    return res.status(401).json({
      error: "Unauthorized",
      message: "Отсутствуют данные авторизации Telegram (Authorization: Bearer <initData>)",
    });
  }

  try {
    const urlParams = new URLSearchParams(initData);
    const receivedHash = urlParams.get("hash");

    if (!receivedHash) {
      if (isDevOrTest) {
        req.telegramUser = { id: req.body?.telegramId || "guest_dev" };
        req.telegramId = String(req.telegramUser.id);
        return next();
      }
      return res.status(401).json({
        error: "Unauthorized",
        message: "В переданных данных initData отсутствует поле hash",
      });
    }

    // Удаляем hash и signature для формирования строки проверки
    urlParams.delete("hash");
    urlParams.delete("signature");

    // Сортировка параметров по алфавиту в формате key=value
    const checkPairs = [];
    for (const [key, value] of urlParams.entries()) {
      checkPairs.push(`${key}=${value}`);
    }
    checkPairs.sort();
    const dataCheckString = checkPairs.join("\n");

    // 2. Генерация секретного ключа: HMAC_SHA256("WebAppData", botToken)
    const secretKey = crypto
      .createHmac("sha256", "WebAppData")
      .update(botToken || "")
      .digest();

    // 3. Вычисление контрольного хеша
    const calculatedHash = crypto
      .createHmac("sha256", secretKey)
      .update(dataCheckString)
      .digest("hex");

    // 4. Безопасное сравнение хешей с защитой от атак по времени (timing attack)
    let isMatch = false;
    try {
      if (calculatedHash.length === receivedHash.length) {
        isMatch = crypto.timingSafeEqual(
          Buffer.from(calculatedHash, "hex"),
          Buffer.from(receivedHash, "hex")
        );
      }
    } catch {
      isMatch = false;
    }

    if (!isMatch) {
      if (isDevOrTest) {
        console.warn("⚠️ [telegramAuth] Несовпадение хеша initData, но запрос пропущен в dev/test режиме.");
        req.telegramUser = { id: req.body?.telegramId || "guest_dev" };
        req.telegramId = String(req.telegramUser.id);
        return next();
      }

      return res.status(403).json({
        error: "Forbidden",
        message: "Криптографическая проверка подписи Telegram Web App не пройдена",
      });
    }

    // 5. Успешная валидация: парсим пользователя из user=<JSON>
    const userRaw = urlParams.get("user");
    if (userRaw) {
      try {
        req.telegramUser = JSON.parse(userRaw);
        if (req.telegramUser?.id) {
          req.telegramId = String(req.telegramUser.id);
        }
      } catch {
        // ignore json parse error
      }
    }

    return next();
  } catch (error) {
    if (isDevOrTest) {
      req.telegramUser = { id: req.body?.telegramId || "guest_dev" };
      req.telegramId = String(req.telegramUser.id);
      return next();
    }

    return res.status(403).json({
      error: "Forbidden",
      message: "Ошибка при валидации данных Telegram: " + error.message,
    });
  }
}

module.exports = telegramAuth;
