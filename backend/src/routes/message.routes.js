const express = require("express");
const protectRoute = require("../middleware/auth.middleware");
const {
  getUsersForSidebar,
  getMessages,
  sendMessage,
} = require("../controllers/message.controller");

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);
router.get("/:username", protectRoute, getMessages);
router.post("/send/:username", protectRoute, sendMessage);

module.exports = router;
