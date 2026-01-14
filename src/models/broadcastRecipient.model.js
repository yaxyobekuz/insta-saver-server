const mongoose = require("mongoose");

const BroadcastRecipientSchema = new mongoose.Schema(
  {
    broadcastId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Broadcast",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    chatId: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "sent", "failed"],
      default: "pending",
    },
    error: {
      type: String,
      default: null,
    },
    sentAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Compound index for efficient queries
BroadcastRecipientSchema.index({ broadcastId: 1, status: 1 });
BroadcastRecipientSchema.index({ broadcastId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model("BroadcastRecipient", BroadcastRecipientSchema);
