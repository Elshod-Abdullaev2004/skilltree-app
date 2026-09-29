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
  }
);

module.exports = mongoose.model("Vacancy", vacancySchema);
