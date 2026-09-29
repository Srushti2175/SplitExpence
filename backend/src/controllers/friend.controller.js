const mongoose = require("mongoose");
const User = require("../models/user.model");
const FriendRequest = require("../models/friendRequest.model");
const { emitToUser } = require("../socket/socket");

// GET /api/friends/all — get all users with search query and relationship status
const getAllUsers = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { search } = req.query;

    const queryFilter = { _id: { $ne: currentUserId } };

    if (search && search.trim()) {
      const trimmed = search.trim();
      if (mongoose.Types.ObjectId.isValid(trimmed) && trimmed.length === 24) {
        queryFilter.$or = [
          { _id: trimmed },
          { username: { $regex: trimmed, $options: "i" } },
        ];
      } else {
        queryFilter.username = { $regex: trimmed, $options: "i" };
      }
    }

    const users = await User.find(queryFilter).select("-password");

    // Current user's confirmed friends
    const currentUser = await User.findById(currentUserId).select("friends");
    const friendIds = (currentUser.friends || []).map((id) => id.toString());

    // Pending requests involving current user
    const pendingRequests = await FriendRequest.find({
      $or: [{ sender: currentUserId }, { receiver: currentUserId }],
      status: "pending",
    });

    const sentMap = new Map();
    const receivedMap = new Map();

    pendingRequests.forEach((reqItem) => {
      if (reqItem.sender.toString() === currentUserId.toString()) {
        sentMap.set(reqItem.receiver.toString(), reqItem._id);
      } else {
        receivedMap.set(reqItem.sender.toString(), reqItem._id);
      }
    });

    const result = users.map((user) => {
      const idStr = user._id.toString();
      let status = "none";
      let requestId = null;

      if (friendIds.includes(idStr)) {
        status = "friends";
      } else if (sentMap.has(idStr)) {
        status = "request_sent";
        requestId = sentMap.get(idStr);
      } else if (receivedMap.has(idStr)) {
        status = "request_received";
        requestId = receivedMap.get(idStr);
      }

      return {
        _id: user._id,
        username: user.username,
        email: user.email,
        profilePic: user.profilePic,
        isOnline: user.isOnline,
        status,
        requestId,
      };
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("getAllUsers error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// POST /api/friends/request/:targetUserId — send friend request
const sendFriendRequest = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { targetUserId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    if (currentUserId.toString() === targetUserId.toString()) {
      return res
        .status(400)
        .json({ message: "You cannot send a friend request to yourself" });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if already friends
    const currentUser = await User.findById(currentUserId);
    if (
      currentUser.friends &&
      currentUser.friends.some((id) => id.toString() === targetUserId.toString())
    ) {
      return res
        .status(400)
        .json({ message: "You are already friends with this user" });
    }

    // Check existing request
    const existing = await FriendRequest.findOne({
      $or: [
        { sender: currentUserId, receiver: targetUserId },
        { sender: targetUserId, receiver: currentUserId },
      ],
    });

    if (existing) {
      if (existing.status === "pending") {
        if (existing.sender.toString() === currentUserId.toString()) {
          return res.status(400).json({ message: "Friend request already sent" });
        } else {
          return res.status(400).json({
            message: "This user already sent you a request. Please accept it.",
          });
        }
      }
      await FriendRequest.findByIdAndDelete(existing._id);
    }

    const newRequest = await FriendRequest.create({
      sender: currentUserId,
      receiver: targetUserId,
      status: "pending",
    });

    // Real-time instantaneous notification to receiver in fraction of a second
    emitToUser(targetUserId.toString(), "newFriendRequest", {
      _id: newRequest._id,
      sender: {
        _id: req.user._id,
        username: req.user.username,
        profilePic: req.user.profilePic,
        email: req.user.email,
      },
      createdAt: newRequest.createdAt,
    });

    res.status(201).json({
      message: "Friend request sent",
      requestId: newRequest._id,
    });
  } catch (error) {
    console.error("sendFriendRequest error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// POST /api/friends/accept/:requestId — accept friend request
const acceptFriendRequest = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { requestId } = req.params;

    const request = await FriendRequest.findOne({
      _id: requestId,
      receiver: currentUserId,
      status: "pending",
    });

    if (!request) {
      return res
        .status(404)
        .json({ message: "Pending friend request not found" });
    }

    request.status = "accepted";
    await request.save();

    // Add each user to the other's friends array
    await User.findByIdAndUpdate(currentUserId, {
      $addToSet: { friends: request.sender },
    });
    await User.findByIdAndUpdate(request.sender, {
      $addToSet: { friends: currentUserId },
    });

    const senderUser = await User.findById(request.sender).select("-password");

    // Instantly notify sender that request was accepted
    emitToUser(request.sender.toString(), "friendRequestAccepted", {
      user: {
        _id: req.user._id,
        username: req.user.username,
        profilePic: req.user.profilePic,
        email: req.user.email,
      },
      requestId: request._id,
    });

    // Also notify current user's other tabs
    emitToUser(currentUserId.toString(), "friendRequestAccepted", {
      user: senderUser,
      requestId: request._id,
    });

    res.status(200).json({ message: "Friend request accepted" });
  } catch (error) {
    console.error("acceptFriendRequest error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// POST /api/friends/reject/:requestId — reject or cancel friend request
const rejectFriendRequest = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { requestId } = req.params;

    const request = await FriendRequest.findOne({
      _id: requestId,
      $or: [{ receiver: currentUserId }, { sender: currentUserId }],
    });

    if (!request) {
      return res.status(404).json({ message: "Friend request not found" });
    }

    const otherUserId =
      request.sender.toString() === currentUserId.toString()
        ? request.receiver.toString()
        : request.sender.toString();

    await FriendRequest.findByIdAndDelete(requestId);

    // Instantly notify the other party in fraction of a second
    emitToUser(otherUserId, "friendRequestCancelled", {
      requestId: request._id,
      byUserId: currentUserId.toString(),
    });

    res.status(200).json({ message: "Friend request removed" });
  } catch (error) {
    console.error("rejectFriendRequest error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/friends/requests — get incoming pending friend requests
const getPendingRequests = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const requests = await FriendRequest.find({
      receiver: currentUserId,
      status: "pending",
    })
      .populate("sender", "username profilePic email")
      .sort({ createdAt: -1 });

    res.status(200).json(requests);
  } catch (error) {
    console.error("getPendingRequests error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/friends/list — get confirmed friends
const getFriends = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const user = await User.findById(currentUserId)
      .populate("friends", "username profilePic email isOnline")
      .select("friends");

    res.status(200).json(user?.friends || []);
  } catch (error) {
    console.error("getFriends error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  getAllUsers,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  getPendingRequests,
  getFriends,
};
