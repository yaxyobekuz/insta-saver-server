const User = require("../models/user.model");

// Supported languages list
const SUPPORTED_LANGUAGES = [
  "uz", "en", "ru", "kk", "ky", "tr", "tg", "tk", "az", "fa", "ar",
  "pt-pt", "pt-br", "es", "fr", "de", "it", "id", "hi", "uk", "pl",
  "vi", "th", "ko", "ja", "nl", "ro", "cs", "hu", "el", "sv", "da", "fi", "zh"
];

// Get all users with advanced filtering
const getAllUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 24,
      lang,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
      recentDays,
      statsFilter,
    } = req.query;

    // Build query
    let query = {};

    // Language filter
    if (lang && lang !== "all") {
      query.lang = lang;
    }

    // Search filter (username, firstName, lastName)
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { username: searchRegex },
        { firstName: searchRegex },
        { lastName: searchRegex },
      ];
    }

    // Recent days filter
    if (recentDays && !isNaN(parseInt(recentDays))) {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(recentDays));
      query.createdAt = { $gte: daysAgo };
    }

    // Stats filter
    if (statsFilter) {
      switch (statsFilter) {
        case "high_success":
          query["stats.success"] = { $gte: 10 };
          break;
        case "high_failed":
          query["stats.failed"] = { $gte: 5 };
          break;
        case "low_activity":
          query["stats.total"] = { $lte: 5 };
          break;
        case "high_activity":
          query["stats.total"] = { $gte: 20 };
          break;
      }
    }

    // Build sort
    const sortOptions = {};
    const validSortFields = ["createdAt", "stats.success", "stats.failed", "stats.total"];
    if (validSortFields.includes(sortBy)) {
      sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;
    } else {
      sortOptions.createdAt = -1;
    }

    // Convert to numbers
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Execute query with count
    const [total, users] = await Promise.all([
      User.countDocuments(query),
      User.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.json({
      success: true,
      data: users,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
        hasNextPage,
        hasPrevPage,
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

// Get user statistics summary
const getUserStats = async (req, res) => {
  try {
    const [totalUsers, languageStats] = await Promise.all([
      User.countDocuments(),
      User.aggregate([
        { $group: { _id: "$lang", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        languageStats,
        supportedLanguages: SUPPORTED_LANGUAGES,
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

// Get single user by ID
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Foydalanuvchi topilmadi",
      });
    }

    res.json({
      success: true,
      data: user,
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
  getAllUsers,
  getUserStats,
  getUserById,
  SUPPORTED_LANGUAGES,
};
