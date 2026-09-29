const { Server } = require("socket.io");
const http = require("http");
const express = require("express");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

// Map userId -> Set of socketIds for robust multi-tab and online tracking
const userSocketMap = {};

const emitToUser = (userId, event, data) => {
  if (userId) {
    io.to(userId.toString()).emit(event, data);
  }
};

const getReceiverSocketId = (userId) => {
  if (!userId || !userSocketMap[userId]) return null;
  const ids = Array.from(userSocketMap[userId]);
  return ids.length > 0 ? ids[0] : null;
};

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;

  if (userId) {
    // Join personal user room so io.to(userId).emit(...) works instantly
    socket.join(userId.toString());

    if (!userSocketMap[userId]) {
      userSocketMap[userId] = new Set();
    }
    userSocketMap[userId].add(socket.id);
  }

  // Broadcast online user IDs
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    if (userId && userSocketMap[userId]) {
      userSocketMap[userId].delete(socket.id);
      if (userSocketMap[userId].size === 0) {
        delete userSocketMap[userId];
      }
    }
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

module.exports = { app, server, io, emitToUser, getReceiverSocketId };
