/**
 * Модуль рандомизации вариантов ответов для тестов и экзаменов SkillTree.
 *
 * Новая архитектура генерации:
 * 1. ИИ генерирует объект: { question, correct_answer, incorrect_answers: [...] }
 * 2. Сервер объединяет ответы: let options = [q.correct_answer, ...q.incorrect_answers]
 * 3. Перемешивает массив options: options.sort(() => Math.random() - 0.5)
 * 4. Находит индекс правильного ответа: let correctIndex = options.indexOf(q.correct_answer)
 * 5. Формирует финальный объект: { question: q.question, options, correctIndex, correctAnswerIndex }
 */

/**
 * Обрабатывает и перемешивает варианты одного вопроса
 *
 * @param {Object} q Исходный объект вопроса от Gemini или из локального пула
 * @returns {Object} Объект с перемешанными options и актуальным индексом правильного ответа
 */
function buildAndShuffleQuestion(q) {
  if (!q) return null;

  // Формат 1: Новый строгий формат от Gemini { question, correct_answer, incorrect_answers }
  if (q.correct_answer && Array.isArray(q.incorrect_answers)) {
    const correctAnswer = String(q.correct_answer).trim();
    const incorrects = q.incorrect_answers
      .filter((a) => a !== undefined && a !== null)
      .map((a) => String(a).trim());

    // 1. Склейка ответов
    let options = [correctAnswer, ...incorrects.slice(0, 3)];

    // 2. Перемешивание массива вариантов
    options.sort(() => Math.random() - 0.5);

    // 3. Поиск правильного индекса
    let correctIndex = options.indexOf(correctAnswer);
    if (correctIndex === -1) correctIndex = 0;

    return {
      question: String(q.question || "").trim(),
      options: options,
      correctIndex: correctIndex,
      correctAnswerIndex: correctIndex, // обратная совместимость
      skill: q.skill || q.technology || "Fullstack",
    };
  }

  // Формат 2: Формат с готовым массивом options
  if (Array.isArray(q.options) && q.options.length > 0) {
    const origIndex =
      typeof q.correctIndex === "number"
        ? q.correctIndex
        : typeof q.correctAnswerIndex === "number"
        ? q.correctAnswerIndex
        : 0;

    const correctAnswer =
      q.options[origIndex] !== undefined ? q.options[origIndex] : q.options[0];

    let options = [...q.options.map((opt) => String(opt).trim())];
    options.sort(() => Math.random() - 0.5);

    let correctIndex = options.indexOf(correctAnswer);
    if (correctIndex === -1) correctIndex = 0;

    return {
      question: String(q.question || "").trim(),
      options: options,
      correctIndex: correctIndex,
      correctAnswerIndex: correctIndex,
      skill: q.skill || q.technology || "Fullstack",
    };
  }

  return q;
}

/**
 * Прогоняет весь массив вопросов через рандомизатор вариантов ответов.
 *
 * @param {Array} list Массив вопросов
 * @returns {Array} Массив вопросов с перемешанными options и обновленным correctIndex
 */
function processAndShuffleQuestions(list) {
  if (!Array.isArray(list)) return [];
  return list.map(buildAndShuffleQuestion).filter(Boolean);
}

module.exports = {
  buildAndShuffleQuestion,
  processAndShuffleQuestions,
  shuffleQuestionOptions: buildAndShuffleQuestion,
  shuffleAllQuestions: processAndShuffleQuestions,
};
