const express = require("express");
const protectRoute = require("../middleware/auth.middleware");
const {
  getAllUsers,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  getPendingRequests,
  getFriends,
} = require("../controllers/friend.controller");

const router = express.Router();

router.get("/all", protectRoute, getAllUsers);
router.get("/requests", protectRoute, getPendingRequests);
router.get("/list", protectRoute, getFriends);
router.post("/request/:targetUserId", protectRoute, sendFriendRequest);
router.post("/accept/:requestId", protectRoute, acceptFriendRequest);
router.post("/reject/:requestId", protectRoute, rejectFriendRequest);

module.exports = router;
