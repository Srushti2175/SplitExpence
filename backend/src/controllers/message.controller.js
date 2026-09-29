const User = require("../models/user.model");
const Message = require("../models/message.model");
const { emitToUser } = require("../socket/socket");

// GET /api/messages/users — get all friends for sidebar
const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const currentUser = await User.findById(loggedInUserId)
      .populate("friends", "-password")
      .select("friends");

    res.status(200).json(currentUser?.friends || []);
  } catch (error) {
    console.error("getUsersForSidebar error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/messages/:username — get chat history with a specific user by username
const getMessages = async (req, res) => {
  try {
    const { username } = req.params;
    const myId = req.user._id;

    const otherUser = await User.findOne({ username });
    if (!otherUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if they are friends
    const currentUser = await User.findById(myId);
    const isFriend =
      currentUser.friends &&
      currentUser.friends.some((id) => id.toString() === otherUser._id.toString());

    if (!isFriend) {
      return res.status(403).json({
        message:
          "You must be connected as friends to view or send messages. Send a friend request first!",
      });
    }

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: otherUser._id },
        { senderId: otherUser._id, receiverId: myId },
      ],
    }).sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error("getMessages error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// POST /api/messages/send/:username — send a message to a user by username
const sendMessage = async (req, res) => {
  try {
    const { username } = req.params;
    const { text } = req.body;
    const senderId = req.user._id;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Message text cannot be empty" });
    }

    const receiver = await User.findOne({ username });
    if (!receiver) {
      return res.status(404).json({ message: "User not found" });
    }

    // Strict validation: Users CANNOT message each other without an accepted friend request!
    const sender = await User.findById(senderId);
    const isFriend =
      sender.friends &&
      sender.friends.some((id) => id.toString() === receiver._id.toString());

    if (!isFriend) {
      return res.status(403).json({
        message:
          "Friend request required! You can only message users after sending and having an accepted friend request.",
      });
    }

    const newMessage = await Message.create({
      senderId,
      receiverId: receiver._id,
      text: text.trim(),
    });

    // Real-time instantaneous delivery via user room in Socket.IO
    emitToUser(receiver._id.toString(), "newMessage", newMessage);

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("sendMessage error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { getUsersForSidebar, getMessages, sendMessage };
