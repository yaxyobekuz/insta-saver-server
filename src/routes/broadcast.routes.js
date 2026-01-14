const express = require("express");
const router = express.Router();
const {
  createBroadcast,
  getBroadcasts,
  getBroadcastById,
  getBroadcastRecipients,
  cancelBroadcast,
} = require("../controllers/broadcast.controller");
const { protect } = require("../middleware/auth.middleware");

// All routes are protected
router.use(protect);

// POST /api/broadcasts - Create new broadcast
router.post("/", createBroadcast);

// GET /api/broadcasts - Get all broadcasts (history)
router.get("/", getBroadcasts);

// GET /api/broadcasts/:id - Get broadcast by ID
router.get("/:id", getBroadcastById);

// GET /api/broadcasts/:id/recipients - Get broadcast recipients
router.get("/:id/recipients", getBroadcastRecipients);

// DELETE /api/broadcasts/:id - Cancel broadcast
router.delete("/:id", cancelBroadcast);

module.exports = router;
