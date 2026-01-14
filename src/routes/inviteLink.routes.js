const express = require("express");
const router = express.Router();
const {
  getInviteLinks,
  getInvitedUsers,
  updateInviteLink,
  deleteInviteLink,
  createInviteLink,
  getInviteLinkById,
  getInviteLinkStats,
} = require("../controllers/inviteLink.controller");
const { protect } = require("../middleware/auth.middleware");

// All routes are protected
router.use(protect);

// POST /api/invite-links - Create new invite link
router.post("/", createInviteLink);

// GET /api/invite-links - Get all invite links
router.get("/", getInviteLinks);

// GET /api/invite-links/stats - Get invite links statistics
router.get("/stats", getInviteLinkStats);

// GET /api/invite-links/:id - Get invite link by ID
router.get("/:id", getInviteLinkById);

// GET /api/invite-links/:id/users - Get invited users for a link
router.get("/:id/users", getInvitedUsers);

// PUT /api/invite-links/:id - Update invite link
router.put("/:id", updateInviteLink);

// DELETE /api/invite-links/:id - Delete invite link
router.delete("/:id", deleteInviteLink);

module.exports = router;
