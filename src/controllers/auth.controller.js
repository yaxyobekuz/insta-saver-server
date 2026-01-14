const Owner = require("../models/owner.model");
const { generateToken } = require("../utils/jwt.utils");

// Login
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username va password talab qilinadi",
      });
    }

    // Find owner
    const owner = await Owner.findOne({ username: username.toLowerCase() });

    if (!owner || !(await owner.matchPassword(password))) {
      return res.status(400).json({
        success: false,
        message: "Noto'g'ri username yoki password",
      });
    }

    // Generate token
    const token = generateToken(owner._id);

    // Return response
    res.json({
      success: true,
      data: {
        user: {
          id: owner._id,
          username: owner.username,
          firstName: owner.firstName,
          lastName: owner.lastName,
          fullName: owner.fullName,
        },
        token,
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

// Get current owner data
const getMe = async (req, res) => {
  try {
    const owner = await Owner.findById(req.user.id).select("-password");

    res.json({
      success: true,
      data: owner,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server xatosi",
      error: error.message,
    });
  }
};

// Initialize default owner (called on server start)
const initDefaultOwner = async () => {
  try {
    const existingOwner = await Owner.findOne();
    if (!existingOwner) {
      await Owner.create({
        username: process.env.DEFAULT_OWNER_USERNAME || "admin",
        password: process.env.DEFAULT_OWNER_PASSWORD || "admin123",
        firstName: process.env.DEFAULT_OWNER_FIRSTNAME || "Administrator",
        lastName: process.env.DEFAULT_OWNER_LASTNAME || "",
      });
      console.log("Default owner created successfully");
    }
  } catch (error) {
    console.error("Error creating default owner:", error.message);
  }
};

module.exports = { login, getMe, initDefaultOwner };
