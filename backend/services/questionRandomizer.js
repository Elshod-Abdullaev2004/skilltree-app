/**
 * Перемешивание вариантов ответов для тестовых вопросов по алгоритму Фишера-Йетса (Fisher-Yates shuffle).
 * Гарантирует равномерное распределение правильного ответа по всем позициям (A, B, C, D)
 * и исключает предвзятость нейросети (position bias).
 */

/**
 * Перемешивает варианты ответов одного вопроса с сохранением актуального индекса правильного ответа.
 *
 * @param {Object} questionItem Объект вопроса с полями options и correctAnswerIndex
 * @returns {Object} Новый объект вопроса с перемешанными options и обновленным correctAnswerIndex
 */
function shuffleQuestionOptions(questionItem) {
  if (
    !questionItem ||
    !Array.isArray(questionItem.options) ||
    questionItem.options.length === 0
  ) {
    return questionItem;
  }

  const originalCorrectIndex =
    typeof questionItem.correctAnswerIndex === "number" &&
    questionItem.correctAnswerIndex >= 0 &&
    questionItem.correctAnswerIndex < questionItem.options.length
      ? questionItem.correctAnswerIndex
      : 0;

  // Оборачиваем варианты в объекты с флагом правильного ответа
  const wrapped = questionItem.options.map((optionText, idx) => ({
    text: optionText,
    isCorrect: idx === originalCorrectIndex,
  }));

  // Алгоритм Фишера-Йетса
  for (let i = wrapped.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = wrapped[i];
    wrapped[i] = wrapped[j];
    wrapped[j] = temp;
  }

  const newCorrectIndex = wrapped.findIndex((item) => item.isCorrect);

  return {
    ...questionItem,
    options: wrapped.map((item) => item.text),
    correctAnswerIndex: newCorrectIndex !== -1 ? newCorrectIndex : 0,
  };
}

/**
 * Прогоняет весь массив вопросов через рандомизатор вариантов ответов Фишера-Йетса.
 *
 * @param {Array} questionsList Массив вопросов
 * @returns {Array} Массив вопросов с рандомизированными вариантами
 */
function shuffleAllQuestions(questionsList) {
  if (!Array.isArray(questionsList)) return questionsList;
  return questionsList.map(shuffleQuestionOptions);
}

module.exports = {
  shuffleQuestionOptions,
  shuffleAllQuestions,
};
