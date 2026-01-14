// Express
const express = require("express");
const router = express.Router();

// Routes imports
const authRoutes = require("./auth.routes");
const userRoutes = require("./user.routes");
const broadcastRoutes = require("./broadcast.routes");
const settingsRoutes = require("./settings.routes");

// Routes
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/broadcasts", broadcastRoutes);
router.use("/settings", settingsRoutes);

// Health check
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
