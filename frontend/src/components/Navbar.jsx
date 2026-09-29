import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";
import axios from "../utils/axios";

const Navbar = () => {
  const { authUser, setAuthUser } = useAuthContext();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post("/auth/logout");
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      localStorage.removeItem("split-auth-user");
      setAuthUser(null);
      navigate("/login");
    }
  };

  const initial = authUser?.username ? authUser.username[0].toUpperCase() : "U";

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white text-xl shadow-md group-hover:scale-105 transition-transform">
            💸
          </div>
          <div>
            <span className="font-extrabold text-lg text-gray-900 tracking-tight block">
              Split Expenses
            </span>
            <span className="text-xs text-gray-500 hidden sm:block">
              Chat & Expense Tracking
            </span>
          </div>
        </Link>

        {/* Navigation & User Menu */}
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition px-3 py-1.5 rounded-lg hover:bg-gray-100 hidden sm:inline-block"
          >
            💬 Chats
          </Link>

          {/* User Profile Circular Logo & Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((prev) => !prev)}
              aria-label="User profile menu"
              className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-indigo-500 focus:outline-none transition cursor-pointer"
            >
              <div className="relative">
                {authUser?.profilePic ? (
                  <img
                    src={authUser.profilePic}
                    alt={authUser.username}
                    className="w-10 h-10 rounded-full object-cover border-2 border-indigo-600 shadow-sm"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center border-2 border-white shadow-sm text-sm">
                    {initial}
                  </div>
                )}
                {/* Active status indicator */}
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
              </div>
              <span className="hidden md:block text-sm font-semibold text-gray-700 max-w-[120px] truncate">
                @{authUser?.username}
              </span>
              <svg
                className={`w-4 h-4 text-gray-500 transition-transform ${
                  dropdownOpen ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 py-2 animate-in fade-in slide-in-from-top-2 duration-150 z-50">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider">
                    Signed in as
                  </p>
                  <p className="text-sm font-bold text-gray-900 truncate">
                    @{authUser?.username}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {authUser?.email}
                  </p>
                </div>

                <div className="py-1">
                  <Link
                    to="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    Profile & Settings
                  </Link>
                </div>

                <div className="border-t border-gray-100 pt-1">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition cursor-pointer"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    Log Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
