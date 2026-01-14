const axios = require("axios");

// Telegram Bot API base URL
const TELEGRAM_API_BASE = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

/**
 * Send a message to a Telegram chat
 * @param {number} chatId - Telegram chat ID
 * @param {string} text - Message text
 * @param {object} options - Additional options
 * @returns {Promise<{success: boolean, error?: string}>}
 */
const sendMessage = async (chatId, text, options = {}) => {
  try {
    const response = await axios.post(`${TELEGRAM_API_BASE}/sendMessage`, {
      chat_id: chatId,
      text: text,
      parse_mode: options.parseMode || "Markdown",
      disable_web_page_preview: options.disablePreview || false,
      ...options,
    });

    return { success: true, data: response.data };
  } catch (error) {
    const errorMessage = error.response?.data?.description || error.message;
    return { success: false, error: errorMessage };
  }
};

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Process broadcast with rate limiting
 * @param {string} broadcastId - Broadcast document ID
 */
const processBroadcast = async (broadcastId) => {
  const Broadcast = require("../models/broadcast.model");
  const BroadcastRecipient = require("../models/broadcastRecipient.model");
  const Settings = require("../models/settings.model");

  try {
    // Get broadcast
    const broadcast = await Broadcast.findById(broadcastId);
    if (!broadcast || broadcast.status === "cancelled") {
      return;
    }

    // Update status to in_progress
    broadcast.status = "in_progress";
    broadcast.startedAt = new Date();
    await broadcast.save();

    // Get rate limit from settings
    const rateLimit = await Settings.getSetting("broadcast_rate_limit", 20);
    const delayMs = Math.ceil(1000 / Math.min(rateLimit, broadcast.rateLimit));

    // Process pending recipients in batches
    const BATCH_SIZE = 30;
    let hasMore = true;

    while (hasMore) {
      // Check if broadcast was cancelled
      const currentBroadcast = await Broadcast.findById(broadcastId);
      if (currentBroadcast.status === "cancelled") {
        break;
      }

      // Get batch of pending recipients
      const recipients = await BroadcastRecipient.find({
        broadcastId,
        status: "pending",
      })
        .limit(BATCH_SIZE)
        .lean();

      if (recipients.length === 0) {
        hasMore = false;
        break;
      }

      // Process each recipient
      for (const recipient of recipients) {
        // Check for cancellation
        const checkBroadcast = await Broadcast.findById(broadcastId);
        if (checkBroadcast.status === "cancelled") {
          hasMore = false;
          break;
        }

        // Send message
        const result = await sendMessage(recipient.chatId, broadcast.message);

        // Update recipient status
        await BroadcastRecipient.findByIdAndUpdate(recipient._id, {
          status: result.success ? "sent" : "failed",
          error: result.error || null,
          sentAt: result.success ? new Date() : null,
        });

        // Update broadcast stats
        if (result.success) {
          await Broadcast.findByIdAndUpdate(broadcastId, {
            $inc: { "stats.sent": 1, "stats.pending": -1 },
          });
        } else {
          await Broadcast.findByIdAndUpdate(broadcastId, {
            $inc: { "stats.failed": 1, "stats.pending": -1 },
          });
        }

        // Rate limit delay
        await sleep(delayMs);
      }
    }

    // Mark as completed
    const finalBroadcast = await Broadcast.findById(broadcastId);
    if (finalBroadcast.status !== "cancelled") {
      finalBroadcast.status = "completed";
      finalBroadcast.completedAt = new Date();
      await finalBroadcast.save();
    }
  } catch (error) {
    // Mark as failed
    await Broadcast.findByIdAndUpdate(broadcastId, {
      status: "failed",
      error: error.message,
      completedAt: new Date(),
    });
  }
};

module.exports = { sendMessage, processBroadcast, sleep };
