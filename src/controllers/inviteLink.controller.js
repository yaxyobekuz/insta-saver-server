const InviteLink = require("../models/inviteLink.model");
const InvitedUser = require("../models/invitedUser.model");

// Create new invite link
const createInviteLink = async (req, res) => {
  try {
    const { name, description } = req.body;

    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Havola nomi talab qilinadi",
      });
    }

    // Check name format
    const linkName = name.trim().toLowerCase();
    if (!/^[a-z0-9_-]+$/.test(linkName)) {
      return res.status(400).json({
        success: false,
        message:
          "Havola nomi faqat kichik harflar, raqamlar, - va _ dan iborat bo'lishi kerak",
      });
    }

    // Check if name exists
    const existingLink = await InviteLink.findOne({ name: linkName });
    if (existingLink) {
      return res.status(400).json({
        success: false,
        message: "Bu nomdagi havola allaqachon mavjud",
      });
    }

    // Create invite link
    const inviteLink = await InviteLink.create({
      name: linkName,
      description: description?.trim() || "",
      createdBy: req.user?._id,
    });

    res.status(201).json({
      success: true,
      message: "Havola muvaffaqiyatli yaratildi",
      data: inviteLink,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server xatosi",
      error: error.message,
    });
  }
};

// Get all invite links
const getInviteLinks = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      isActive,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Build query
    const query = {};

    // Search filter
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [{ name: searchRegex }, { description: searchRegex }];
    }

    // Active filter
    if (isActive !== undefined && isActive !== "all") {
      query.isActive = isActive === "true";
    }

    // Build sort
    const sortOptions = {};
    const validSortFields = ["createdAt", "stats.totalJoins", "name"];
    if (validSortFields.includes(sortBy)) {
      sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;
    } else {
      sortOptions.createdAt = -1;
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [total, inviteLinks] = await Promise.all([
      InviteLink.countDocuments(query),
      InviteLink.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: inviteLinks,
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

// Get invite link stats overview
const getInviteLinkStats = async (req, res) => {
  try {
    const [
      totalLinks,
      activeLinks,
      totalJoinsResult,
      todayJoinsResult,
      thisWeekJoinsResult,
      thisMonthJoinsResult,
    ] = await Promise.all([
      InviteLink.countDocuments(),
      InviteLink.countDocuments({ isActive: true }),
      InviteLink.aggregate([
        { $group: { _id: null, total: { $sum: "$stats.totalJoins" } } },
      ]),
      InvitedUser.countDocuments({
        createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      }),
      InvitedUser.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      }),
      InvitedUser.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      }),
    ]);

    res.json({
      success: true,
      data: {
        totalLinks,
        activeLinks,
        inactiveLinks: totalLinks - activeLinks,
        totalJoins: totalJoinsResult[0]?.total || 0,
        todayJoins: todayJoinsResult,
        thisWeekJoins: thisWeekJoinsResult,
        thisMonthJoins: thisMonthJoinsResult,
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

// Get single invite link by ID
const getInviteLinkById = async (req, res) => {
  try {
    const { id } = req.params;

    const inviteLink = await InviteLink.findById(id).lean();

    if (!inviteLink) {
      return res.status(404).json({
        success: false,
        message: "Havola topilmadi",
      });
    }

    res.json({
      success: true,
      data: inviteLink,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server xatosi",
      error: error.message,
    });
  }
};

// Get invited users for a specific link
const getInvitedUsers = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const inviteLink = await InviteLink.findById(id);
    if (!inviteLink) {
      return res.status(404).json({
        success: false,
        message: "Havola topilmadi",
      });
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [total, invitedUsers] = await Promise.all([
      InvitedUser.countDocuments({ inviteLinkId: id }),
      InvitedUser.find({ inviteLinkId: id })
        .populate("userId", "firstName lastName username chatId lang createdAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: invitedUsers,
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

// Update invite link
const updateInviteLink = async (req, res) => {
  try {
    const { id } = req.params;
    const { description, isActive } = req.body;

    const inviteLink = await InviteLink.findById(id);
    if (!inviteLink) {
      return res.status(404).json({
        success: false,
        message: "Havola topilmadi",
      });
    }

    // Update fields
    if (description !== undefined) {
      inviteLink.description = description.trim();
    }
    if (isActive !== undefined) {
      inviteLink.isActive = isActive;
    }

    await inviteLink.save();

    res.json({
      success: true,
      message: "Havola muvaffaqiyatli yangilandi",
      data: inviteLink,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server xatosi",
      error: error.message,
    });
  }
};

// Delete invite link
const deleteInviteLink = async (req, res) => {
  try {
    const { id } = req.params;

    const inviteLink = await InviteLink.findById(id);
    if (!inviteLink) {
      return res.status(404).json({
        success: false,
        message: "Havola topilmadi",
      });
    }

    // Delete invited users records
    await InvitedUser.deleteMany({ inviteLinkId: id });

    // Delete invite link
    await InviteLink.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Havola muvaffaqiyatli o'chirildi",
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
  createInviteLink,
  getInviteLinks,
  getInviteLinkStats,
  getInviteLinkById,
  getInvitedUsers,
  updateInviteLink,
  deleteInviteLink,
};
