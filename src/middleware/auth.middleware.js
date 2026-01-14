// Models
const Owner = require("../models/owner.model");

// Utils
const { verifyToken } = require("../utils/jwt.utils");

// Auth middleware for Owner
const protect = async (req, res, next) => {
  try {
    let token;

    // Get token from header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Tizimga kirish uchun autentifikatsiya talab qilinadi",
      });
    }

    // Verify token
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: "Noto'g'ri yoki muddati o'tgan token",
      });
    }

    // Find owner by ID from token
    const owner = await Owner.findById(decoded.id).select("-password");

    if (!owner) {
      return res.status(401).json({
        success: false,
        message: "Foydalanuvchi topilmadi",
      });
    }

    // Add owner to request object
    req.user = owner;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: error.message,
      message: "Autentifikatsiya xatosi",
    });
  }
};

module.exports = { protect };
