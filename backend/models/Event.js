const mongoose = require("mongoose");

/**
 * Схема события продуктовой аналитики (воронка пользователей)
 */
const eventSchema = new mongoose.Schema(
  {
    telegram_id: {
      type: String,
      required: [true, "Поле telegram_id обязательно"],
      index: true,
      trim: true,
    },
    eventType: {
      type: String,
      required: [true, "Поле eventType обязательно"],
      index: true,
      trim: true,
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

// Составные индексы для быстрого построения аналитических воронок и выборок по пользователю
eventSchema.index({ eventType: 1, createdAt: -1 });
eventSchema.index({ telegram_id: 1, createdAt: -1 });
eventSchema.index({ eventType: 1, telegram_id: 1 });

const Event = mongoose.models.Event || mongoose.model("Event", eventSchema);

module.exports = Event;
