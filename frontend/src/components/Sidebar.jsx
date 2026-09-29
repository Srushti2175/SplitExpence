import { useState } from "react";
import { useSocketContext } from "../context/SocketContext";

const Sidebar = ({ selectedUser, onSelectUser, friendsState }) => {
  const [activeTab, setActiveTab] = useState("chats"); // "chats" | "discover" | "requests"
  const { onlineUsers } = useSocketContext();

  const {
    allUsers,
    friends,
    pendingRequests,
    searchQuery,
    setSearchQuery,
    loadingUsers,
    actionLoadingId,
    sendRequest,
    acceptRequest,
    rejectRequest,
  } = friendsState;

  const [copiedId, setCopiedId] = useState(null);

  const handleCopyId = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <aside className="w-full md:w-96 bg-white border-r border-gray-200 flex flex-col h-full shadow-xs">
      {/* ─── Search Bar ────────────────────────────────────────── */}
      <div className="p-4 border-b border-gray-100">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by username or User ID..."
            className="w-full pl-9 pr-8 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ─── Tab Switcher ──────────────────────────────────────── */}
      <div className="flex border-b border-gray-100 px-3 pt-2 gap-1 bg-gray-50/50">
        <button
          onClick={() => setActiveTab("chats")}
          className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-t-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === "chats"
              ? "bg-white text-indigo-600 border-b-2 border-indigo-600 shadow-2xs"
              : "text-gray-500 hover:text-gray-800"
          }`}
        >
          <span>💬 Chats</span>
          {friends.length > 0 && (
            <span className="px-1.5 py-0.2 bg-gray-100 text-gray-600 rounded-full text-xs">
              {friends.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("discover")}
          className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-t-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === "discover"
              ? "bg-white text-indigo-600 border-b-2 border-indigo-600 shadow-2xs"
              : "text-gray-500 hover:text-gray-800"
          }`}
        >
          <span>🔍 Discover</span>
          <span className="px-1.5 py-0.2 bg-gray-100 text-gray-600 rounded-full text-xs">
            {allUsers.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("requests")}
          className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-t-lg transition flex items-center justify-center gap-1.5 relative cursor-pointer ${
            activeTab === "requests"
              ? "bg-white text-indigo-600 border-b-2 border-indigo-600 shadow-2xs"
              : "text-gray-500 hover:text-gray-800"
          }`}
        >
          <span>📬 Requests</span>
          {pendingRequests.length > 0 && (
            <span className="px-1.5 py-0.2 bg-red-500 text-white rounded-full text-xs animate-pulse font-bold">
              {pendingRequests.length}
            </span>
          )}
        </button>
      </div>

      {/* ─── Tab Content ───────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
        {/* TAB 1: CHATS (FRIENDS) */}
        {activeTab === "chats" && (
          <div>
            {friends.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-2xl mx-auto mb-3">
                  👥
                </div>
                <p className="font-semibold text-gray-800 text-sm">No chats yet</p>
                <p className="text-xs text-gray-400 mt-1 max-w-[200px] mx-auto">
                  Switch to the Discover tab to search and connect with people!
                </p>
                <button
                  onClick={() => setActiveTab("discover")}
                  className="mt-3 text-xs bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-semibold px-3 py-1.5 rounded-lg transition cursor-pointer"
                >
                  Explore People →
                </button>
              </div>
            ) : (
              friends.map((friend) => {
                const isOnline = onlineUsers.includes(friend._id);
                const isSelected = selectedUser?._id === friend._id;
                const initial = friend.username ? friend.username[0].toUpperCase() : "U";

                return (
                  <div
                    key={friend._id}
                    onClick={() => onSelectUser(friend)}
                    className={`flex items-center gap-3 p-3.5 hover:bg-gray-50 transition cursor-pointer ${
                      isSelected ? "bg-indigo-50/70 border-l-4 border-indigo-600" : ""
                    }`}
                  >
                    <div className="relative shrink-0">
                      {friend.profilePic ? (
                        <img
                          src={friend.profilePic}
                          alt={friend.username}
                          className="w-11 h-11 rounded-full object-cover border border-gray-200"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-sm shadow-2xs">
                          {initial}
                        </div>
                      )}
                      {isOnline && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-gray-900 truncate">
                          @{friend.username}
                        </p>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                          isOnline ? "bg-emerald-50 text-emerald-600" : "text-gray-400"
                        }`}>
                          {isOnline ? "Online" : "Offline"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 truncate mt-0.5">
                        Click to open conversation
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 2: DISCOVER PEOPLE */}
        {activeTab === "discover" && (
          <div>
            <div className="px-4 py-2.5 bg-gray-50/50 flex items-center justify-between text-xs text-gray-500">
              <span>All Registered Accounts</span>
              <span>{allUsers.length} found</span>
            </div>

            {loadingUsers ? (
              <div className="p-8 text-center text-sm text-gray-400">Loading users...</div>
            ) : allUsers.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">
                No users found matching &quot;{searchQuery}&quot;
              </div>
            ) : (
              allUsers.map((user) => {
                const isOnline = onlineUsers.includes(user._id);
                const initial = user.username ? user.username[0].toUpperCase() : "U";
                const isActionLoading =
                  Boolean(actionLoadingId) &&
                  (actionLoadingId === user._id ||
                    (user.requestId && actionLoadingId === user.requestId));

                return (
                  <div
                    key={user._id}
                    className="p-3.5 hover:bg-gray-50/70 transition flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        {user.profilePic ? (
                          <img
                            src={user.profilePic}
                            alt={user.username}
                            className="w-10 h-10 rounded-full object-cover border border-gray-200"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-sm shadow-2xs">
                            {initial}
                          </div>
                        )}
                        {isOnline && (
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">
                          @{user.username}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[11px] text-gray-400 font-mono">
                            ID: {user._id.slice(-6)}
                          </span>
                          <button
                            onClick={() => handleCopyId(user._id)}
                            title="Copy full User ID"
                            className="text-[10px] text-indigo-500 hover:text-indigo-700 cursor-pointer"
                          >
                            {copiedId === user._id ? "✓ Copied" : "📋"}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons depending on friendship status */}
                    <div className="shrink-0">
                      {user.status === "friends" ? (
                        <button
                          onClick={() => {
                            onSelectUser(user);
                            setActiveTab("chats");
                          }}
                          className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-xs font-semibold px-3 py-1.5 rounded-lg transition cursor-pointer"
                        >
                          💬 Chat
                        </button>
                      ) : user.status === "request_sent" ? (
                        <button
                          onClick={() => rejectRequest(user.requestId, user._id)}
                          disabled={isActionLoading}
                          className="bg-amber-50 text-amber-700 hover:bg-amber-100 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition cursor-pointer"
                          title="Click to cancel request"
                        >
                          {isActionLoading ? "..." : "⏳ Request Sent (Cancel)"}
                        </button>
                      ) : user.status === "request_received" ? (
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => acceptRequest(user.requestId, user._id)}
                            disabled={isActionLoading}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg transition cursor-pointer"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => rejectRequest(user.requestId, user._id)}
                            disabled={isActionLoading}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-semibold px-2 py-1.5 rounded-lg transition cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => sendRequest(user._id)}
                          disabled={isActionLoading}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition disabled:opacity-50 cursor-pointer"
                        >
                          {isActionLoading ? "Sending..." : "Send Request"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 3: PENDING REQUESTS */}
        {activeTab === "requests" && (
          <div>
            <div className="px-4 py-2.5 bg-gray-50/50 flex items-center justify-between text-xs text-gray-500">
              <span>Incoming Friend Requests</span>
              <span>{pendingRequests.length} pending</span>
            </div>

            {pendingRequests.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-xl mx-auto mb-2">
                  📭
                </div>
                No pending friend requests
              </div>
            ) : (
              pendingRequests.map((reqItem) => {
                const sender = reqItem.sender;
                const initial = sender?.username ? sender.username[0].toUpperCase() : "U";
                const isActionLoading =
                  Boolean(actionLoadingId) && actionLoadingId === reqItem._id;

                return (
                  <div
                    key={reqItem._id}
                    className="p-3.5 hover:bg-gray-50 transition flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        {sender?.profilePic ? (
                          <img
                            src={sender.profilePic}
                            alt={sender.username}
                            className="w-10 h-10 rounded-full object-cover border border-gray-200"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-sm">
                            {initial}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">
                          @{sender?.username}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          Wants to start a conversation
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => acceptRequest(reqItem._id, sender?._id)}
                        disabled={isActionLoading}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition disabled:opacity-50 cursor-pointer"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => rejectRequest(reqItem._id, sender?._id)}
                        disabled={isActionLoading}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition disabled:opacity-50 cursor-pointer"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
