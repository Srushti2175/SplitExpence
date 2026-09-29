const express = require("express");
const {
  signup,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,
} = require("../controllers/auth.controller");
const protectRoute = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", protectRoute, getMe);
router.put("/profile", protectRoute, updateProfile);
router.put("/change-password", protectRoute, changePassword);

module.exports = router;

