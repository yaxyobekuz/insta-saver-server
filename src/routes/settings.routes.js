const express = require("express");
const router = express.Router();
const { getSettings, updateSetting } = require("../controllers/settings.controller");
const { protect } = require("../middleware/auth.middleware");

// All routes are protected
router.use(protect);

// GET /api/settings - Get all settings
router.get("/", getSettings);

// PUT /api/settings/:key - Update setting
router.put("/:key", updateSetting);

module.exports = router;
