import { useState, useEffect, useRef } from "react";
import axios from "../utils/axios";
import { useAuthContext } from "../context/AuthContext";
import { useSocketContext } from "../context/SocketContext";

const ChatContainer = ({ selectedUser, onBack }) => {
  const { authUser } = useAuthContext();
  const { socket, onlineUsers } = useSocketContext();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const messagesEndRef = useRef(null);

  const isOnline = onlineUsers.includes(selectedUser?._id);
  const initial = selectedUser?.username ? selectedUser.username[0].toUpperCase() : "U";

  // Scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fetch messages history
  useEffect(() => {
    if (!selectedUser?.username) return;

    const fetchMessages = async () => {
      setLoading(true);
      setErrorMessage("");
      try {
        const { data } = await axios.get(`/messages/${selectedUser.username}`);
        setMessages(data);
      } catch (err) {
        console.error("Failed to load messages:", err);
        setErrorMessage(
          err.response?.data?.message || "Failed to load messages"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [selectedUser?.username]);

  // Scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Real-time incoming message listener
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMessage) => {
      // Only append if message is between current user and selected user
      const isRelevant =
        (newMessage.senderId === selectedUser._id && newMessage.receiverId === authUser._id) ||
        (newMessage.senderId === authUser._id && newMessage.receiverId === selectedUser._id);

      if (isRelevant) {
        setMessages((prev) => {
          // Avoid duplicate if optimistic message was already processed
          if (prev.some((m) => m._id === newMessage._id)) return prev;
          return [...prev, newMessage];
        });
      }
    };

    socket.on("newMessage", handleNewMessage);
    return () => socket.off("newMessage", handleNewMessage);
  }, [socket, selectedUser._id, authUser._id]);

  // Send message with instant optimistic delivery
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!inputText.trim() || sending) return;

    const textToSend = inputText.trim();
    const tempId = "temp-" + Date.now();
    const optimisticMessage = {
      _id: tempId,
      senderId: authUser._id,
      receiverId: selectedUser._id,
      text: textToSend,
      createdAt: new Date().toISOString(),
    };

    // Instant local rendering (fraction of a second)
    setMessages((prev) => [...prev, optimisticMessage]);
    setInputText("");
    setErrorMessage("");
    setSending(true);

    try {
      const { data } = await axios.post(`/messages/send/${selectedUser.username}`, {
        text: textToSend,
      });
      // Replace optimistic message with server message
      setMessages((prev) =>
        prev.map((m) => (m._id === tempId ? data : m))
      );
    } catch (err) {
      console.error("Failed to send message:", err);
      // Revert optimistic bubble if friend request is missing or error
      setMessages((prev) => prev.filter((m) => m._id !== tempId));
      setInputText(textToSend);
      setErrorMessage(
        err.response?.data?.message ||
          "Cannot send message. Please send and accept a friend request first!"
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50/50">
      {/* ─── Chat Header ───────────────────────────────────────── */}
      <div className="h-16 px-4 border-b border-gray-200 bg-white flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          {/* Back button for mobile screens */}
          <button
            onClick={onBack}
            className="md:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 mr-1"
          >
            ←
          </button>

          <div className="relative">
            {selectedUser.profilePic ? (
              <img
                src={selectedUser.profilePic}
                alt={selectedUser.username}
                className="w-10 h-10 rounded-full object-cover border border-gray-200"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-sm">
                {initial}
              </div>
            )}
            {isOnline && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
            )}
          </div>

          <div>
            <h3 className="text-sm font-bold text-gray-900 leading-tight">
              @{selectedUser.username}
            </h3>
            <span
              className={`text-xs ${
                isOnline ? "text-emerald-600 font-semibold" : "text-gray-400"
              }`}
            >
              {isOnline ? "Active now" : "Offline"}
            </span>
          </div>
        </div>

        <div className="text-xs text-gray-400 font-mono hidden sm:block">
          ID: {selectedUser._id}
        </div>
      </div>

      {/* ─── Error Notification Banner ──────────────────────────── */}
      {errorMessage && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-800 text-xs px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage("")}
            className="text-amber-600 hover:text-amber-800 font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* ─── Message History ────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-full text-sm text-gray-400">
            Loading conversation...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 p-8">
            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl mb-3">
              👋
            </div>
            <p className="font-semibold text-gray-700 text-sm">No messages yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Say hello to @{selectedUser.username} to start the conversation!
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === authUser._id;
            const time = new Date(msg.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={msg._id}
                className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[75%] sm:max-w-md px-4 py-2.5 rounded-2xl text-sm shadow-2xs break-words ${
                    isMe
                      ? "bg-indigo-600 text-white rounded-br-xs"
                      : "bg-white text-gray-900 border border-gray-100 rounded-bl-xs"
                  }`}
                >
                  <p>{msg.text}</p>
                </div>
                <span className="text-[10px] text-gray-400 mt-1 px-1">{time}</span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ─── Message Input Bar ──────────────────────────────────── */}
      <form
        onSubmit={handleSendMessage}
        className="p-3 border-t border-gray-200 bg-white flex items-center gap-2"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Message @${selectedUser.username}...`}
          className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || sending}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-40 cursor-pointer shrink-0"
        >
          {sending ? "..." : "Send"}
        </button>
      </form>
    </div>
  );
};

export default ChatContainer;
