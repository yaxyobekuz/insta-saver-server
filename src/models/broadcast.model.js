const mongoose = require("mongoose");

const BroadcastSchema = new mongoose.Schema(
  {
    message: {
      type: String,
      required: true,
    },
    targetLanguage: {
      type: String,
      default: null, // null = all users
    },
    status: {
      type: String,
      enum: ["pending", "in_progress", "completed", "cancelled", "failed"],
      default: "pending",
    },
    stats: {
      total: { type: Number, default: 0 },
      sent: { type: Number, default: 0 },
      failed: { type: Number, default: 0 },
      pending: { type: Number, default: 0 },
    },
    rateLimit: {
      type: Number,
      default: 20,
      min: 1,
      max: 25,
    },
    startedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    error: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// Index for efficient queries
BroadcastSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("Broadcast", BroadcastSchema);
