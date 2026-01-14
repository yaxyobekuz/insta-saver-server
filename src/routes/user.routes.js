const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  getUserStats,
  getUserById,
} = require("../controllers/user.controller");
const { protect } = require("../middleware/auth.middleware");

// All routes are protected
router.use(protect);

// GET /api/users - Get all users with filtering
router.get("/", getAllUsers);

// GET /api/users/stats - Get user statistics
router.get("/stats", getUserStats);

// GET /api/users/:id - Get user by ID
router.get("/:id", getUserById);

module.exports = router;
