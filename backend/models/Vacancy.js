const mongoose = require("mongoose");

const vacancySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Поле title (должность) обязательно"],
      trim: true,
      index: true,
    },
    company: {
      type: String,
      required: [true, "Поле company (компания) обязательно"],
      trim: true,
    },
    salary: {
      type: String,
      required: [true, "Поле salary (зарплата) обязательно"],
      trim: true,
    },
    sourceUrl: {
      type: String,
      required: [true, "Поле sourceUrl (ссылка на вакансию) обязательно"],
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
      alias: "skills",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Составные и одиночные индексы для масштабируемости (10 000+ вакансий):
// 1. Быстрая сортировка по дате добавления без in-memory sort
vacancySchema.index({ createdAt: -1 });

// 2. Составной индекс для мгновенной фильтрации по навыкам/тегам с сортировкой по дате
vacancySchema.index({ tags: 1, createdAt: -1 });

// 3. Составной индекс для поиска по названию должности с сортировкой по дате
vacancySchema.index({ title: 1, createdAt: -1 });

// 4. Индексы для быстрой дедупликации и точечного поиска парсером
vacancySchema.index({ sourceUrl: 1 });
vacancySchema.index({ title: 1, company: 1 });

// Виртуальные геттеры для обратной совместимости
vacancySchema.virtual("url").get(function () {
  return this.sourceUrl;
});

vacancySchema.virtual("alternate_url").get(function () {
  return this.sourceUrl;
});

module.exports = mongoose.model("Vacancy", vacancySchema);
