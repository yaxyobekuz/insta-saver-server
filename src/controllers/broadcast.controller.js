const Broadcast = require("../models/broadcast.model");
const BroadcastRecipient = require("../models/broadcastRecipient.model");
const User = require("../models/user.model");
const { processBroadcast } = require("../utils/telegram.utils");

// Create new broadcast
const createBroadcast = async (req, res) => {
  try {
    const { message, targetLanguage, rateLimit = 20 } = req.body;

    // Validation
    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Xabar matni talab qilinadi",
      });
    }

    // Validate rate limit
    const validRateLimit = Math.min(Math.max(parseInt(rateLimit) || 20, 1), 25);

    // Build user query
    const userQuery = {};
    if (targetLanguage && targetLanguage !== "all") {
      userQuery.lang = targetLanguage;
    }

    // Get target users
    const users = await User.find(userQuery).select("_id chatId").lean();

    if (users.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Maqsadli foydalanuvchilar topilmadi",
      });
    }

    // Create broadcast
    const broadcast = await Broadcast.create({
      message: message.trim(),
      targetLanguage: targetLanguage === "all" ? null : targetLanguage,
      rateLimit: validRateLimit,
      status: "pending",
      stats: {
        total: users.length,
        sent: 0,
        failed: 0,
        pending: users.length,
      },
    });

    // Create recipients
    const recipients = users.map((user) => ({
      broadcastId: broadcast._id,
      userId: user._id,
      chatId: user.chatId,
      status: "pending",
    }));

    await BroadcastRecipient.insertMany(recipients);

    // Start broadcast processing in background
    setImmediate(() => processBroadcast(broadcast._id));

    res.status(201).json({
      success: true,
      message: "Xabar yuborish boshlandi",
      data: broadcast,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server xatosi",
      error: error.message,
    });
  }
};

// Get all broadcasts (history)
const getBroadcasts = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    const query = {};
    if (status && status !== "all") {
      query.status = status;
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [total, broadcasts] = await Promise.all([
      Broadcast.countDocuments(query),
      Broadcast.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: broadcasts,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server xatosi",
      error: error.message,
    });
  }
};

// Get broadcast by ID
const getBroadcastById = async (req, res) => {
  try {
    const broadcast = await Broadcast.findById(req.params.id).lean();

    if (!broadcast) {
      return res.status(404).json({
        success: false,
        message: "Broadcast topilmadi",
      });
    }

    res.json({
      success: true,
      data: broadcast,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server xatosi",
      error: error.message,
    });
  }
};

// Get broadcast recipients
const getBroadcastRecipients = async (req, res) => {
  try {
    const { page = 1, limit = 50, status } = req.query;
    const { id } = req.params;

    const query = { broadcastId: id };
    if (status && status !== "all") {
      query.status = status;
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [total, recipients] = await Promise.all([
      BroadcastRecipient.countDocuments(query),
      BroadcastRecipient.find(query)
        .populate("userId", "firstName lastName username chatId lang")
        .sort({ sentAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: recipients,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server xatosi",
      error: error.message,
    });
  }
};

// Cancel broadcast
const cancelBroadcast = async (req, res) => {
  try {
    const broadcast = await Broadcast.findById(req.params.id);

    if (!broadcast) {
      return res.status(404).json({
        success: false,
        message: "Broadcast topilmadi",
      });
    }

    if (broadcast.status === "completed" || broadcast.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Bu broadcast allaqachon tugagan yoki bekor qilingan",
      });
    }

    broadcast.status = "cancelled";
    broadcast.completedAt = new Date();
    await broadcast.save();

    res.json({
      success: true,
      message: "Broadcast bekor qilindi",
      data: broadcast,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server xatosi",
      error: error.message,
    });
  }
};

module.exports = {
  createBroadcast,
  getBroadcasts,
  getBroadcastById,
  getBroadcastRecipients,
  cancelBroadcast,
};
