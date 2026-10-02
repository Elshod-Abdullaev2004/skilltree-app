const mongoose = require("mongoose");

const vacancySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Поле title (должность) обязательно"],
      trim: true,
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
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Виртуальные геттеры для обратной совместимости
vacancySchema.virtual("url").get(function () {
  return this.sourceUrl;
});

vacancySchema.virtual("alternate_url").get(function () {
  return this.sourceUrl;
});

module.exports = mongoose.model("Vacancy", vacancySchema);

