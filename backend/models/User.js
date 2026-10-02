const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    telegramId: {
      type: String,
      required: [true, "Поле telegramId обязательно"],
      unique: true,
      index: true,
      trim: true,
    },
    username: {
      type: String,
      required: [true, "Поле username обязательно"],
      trim: true,
    },
    language: {
      type: String,
      enum: ["ru", "uz"],
      default: "ru",
    },
    rank: {
      type: String,
      default: "Junior Web Developer",
      trim: true,
    },
    skills: {
      type: [String],
      default: [],
    },
    level: {
      type: Number,
      default: 1,
    },
    unlockedSkills: {
      type: [String],
      default: [],
    },
    notificationsEnabled: {
      type: Boolean,
      default: true,
    },
    github_url: {
      type: String,
      default: "",
      trim: true,
    },
    portfolio_url: {
      type: String,
      default: "",
      trim: true,
    },
    about_me: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
