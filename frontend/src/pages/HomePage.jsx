import { useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import ChatContainer from "../components/ChatContainer";
import { useFriends } from "../hooks/useFriends";

const HomePage = () => {
  const [selectedUser, setSelectedUser] = useState(null);
  const friendsState = useFriends();

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      {/* Top Navbar with Profile Logo */}
      <Navbar />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar: full width on mobile when no user selected; fixed width on desktop */}
        <div
          className={`${
            selectedUser ? "hidden md:flex" : "flex"
          } w-full md:w-96 shrink-0 h-full`}
        >
          <Sidebar
            selectedUser={selectedUser}
            onSelectUser={(user) => setSelectedUser(user)}
            friendsState={friendsState}
          />
        </div>

        {/* Main Chat Area */}
        <div
          className={`${
            selectedUser ? "flex" : "hidden md:flex"
          } flex-1 h-full`}
        >
          {selectedUser ? (
            <ChatContainer
              selectedUser={selectedUser}
              onBack={() => setSelectedUser(null)}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gray-50/50 text-center">
              <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center text-4xl mb-4 shadow-xs">
                💬
              </div>
              <h2 className="text-xl font-bold text-gray-800">
                Welcome to Split Expenses Chat
              </h2>
              <p className="text-sm text-gray-500 max-w-sm mt-2">
                Discover registered users, search by username or User ID, send friend requests, and start 1-on-1 conversations!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
