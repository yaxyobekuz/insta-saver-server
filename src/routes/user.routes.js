const express = require("express");
const router = express.Router();
const { getAllUsers, updateUser } = require("../controllers/user.controller");
const { protect, authorize } = require("../middleware/auth.middleware");

// All routes are protected and for owner only
router.use(protect);
router.use(authorize("owner"));

router.route("/").get(getAllUsers);

router.route("/:id").put(updateUser);

module.exports = router;
