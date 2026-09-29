import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import axios from "../utils/axios";

const PRESET_AVATARS = [
  "https://api.dicebear.com/7.x/bottts/svg?seed=Felix",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Aneka",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Milo",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Oliver",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Jasper",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Luna",
];

const ProfilePage = () => {
  const { authUser, setAuthUser } = useAuthContext();
  const navigate = useNavigate();

  // Username form state
  const [newUsername, setNewUsername] = useState(authUser?.username || "");
  const [usernameLoading, setUsernameLoading] = useState(false);
  const [usernameMsg, setUsernameMsg] = useState({ type: "", text: "" });

  // Profile picture state
  const [selectedImage, setSelectedImage] = useState(authUser?.profilePic || "");
  const [imagePreview, setImagePreview] = useState(authUser?.profilePic || "");
  const [picLoading, setPicLoading] = useState(false);
  const [picMsg, setPicMsg] = useState({ type: "", text: "" });

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState({ type: "", text: "" });

  // Handle Image File selection
  const handleImageFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setPicMsg({ type: "error", text: "Please select a valid image file" });
      return;
    }

    // Limit to 5MB
    if (file.size > 5 * 1024 * 1024) {
      setPicMsg({ type: "error", text: "Image size must be less than 5MB" });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result);
      setImagePreview(reader.result);
      setPicMsg({ type: "", text: "" });
    };
    reader.readAsDataURL(file);
  };

  // Save Profile Picture
  const handleSaveProfilePic = async () => {
    setPicLoading(true);
    setPicMsg({ type: "", text: "" });
    try {
      const { data } = await axios.put("/auth/profile", {
        profilePic: selectedImage,
      });

      const updatedUser = { ...authUser, profilePic: data.profilePic };
      localStorage.setItem("split-auth-user", JSON.stringify(updatedUser));
      setAuthUser(updatedUser);
      setPicMsg({ type: "success", text: "Profile picture updated successfully!" });
    } catch (err) {
      setPicMsg({
        type: "error",
        text: err.response?.data?.message || "Failed to update profile picture",
      });
    } finally {
      setPicLoading(false);
    }
  };

  // Save Username
  const handleSaveUsername = async (e) => {
    e.preventDefault();
    setUsernameLoading(true);
    setUsernameMsg({ type: "", text: "" });

    if (newUsername.trim() === authUser?.username) {
      setUsernameMsg({ type: "info", text: "This is already your username." });
      setUsernameLoading(false);
      return;
    }

    try {
      const { data } = await axios.put("/auth/profile", {
        username: newUsername.trim(),
      });

      const updatedUser = { ...authUser, username: data.username };
      localStorage.setItem("split-auth-user", JSON.stringify(updatedUser));
      setAuthUser(updatedUser);
      setUsernameMsg({ type: "success", text: "Username updated successfully!" });
    } catch (err) {
      setUsernameMsg({
        type: "error",
        text: err.response?.data?.message || "Failed to update username",
      });
    } finally {
      setUsernameLoading(false);
    }
  };

  // Change Password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMsg({ type: "", text: "" });

    if (passwordData.newPassword.length < 6) {
      setPasswordMsg({
        type: "error",
        text: "New password must be at least 6 characters.",
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMsg({
        type: "error",
        text: "New passwords do not match.",
      });
      return;
    }

    setPasswordLoading(true);
    try {
      const { data } = await axios.put("/auth/change-password", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      setPasswordMsg({ type: "success", text: data.message });
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      setPasswordMsg({
        type: "error",
        text: err.response?.data?.message || "Failed to change password",
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  // Logout handler
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
        {/* Header Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Profile Settings
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage your personal info, account settings, and security.
            </p>
          </div>
          <Link
            to="/"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-4 py-2 rounded-lg transition"
          >
            ← Back to Chats
          </Link>
        </div>

        {/* Profile Card Header with Circular Logo */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8 flex flex-col sm:flex-row items-center gap-6">
          <div className="relative group">
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Profile Preview"
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-indigo-100 shadow-md"
              />
            ) : (
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-extrabold flex items-center justify-center text-4xl border-4 border-indigo-100 shadow-md">
                {initial}
              </div>
            )}
            <label
              htmlFor="avatar-upload"
              className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white text-xs font-semibold"
            >
              Change
            </label>
          </div>

          <div className="text-center sm:text-left flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-2xl font-bold text-gray-900">
                @{authUser?.username}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                Active
              </span>
            </div>
            <p className="text-gray-500 text-sm mt-1">{authUser?.email}</p>
            <p className="text-xs text-gray-400 mt-2">
              Member since {new Date(authUser?.createdAt || Date.now()).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Settings Sections Grid */}
        <div className="grid grid-cols-1 gap-8">
          {/* 1. CHANGE PROFILE PICTURE */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
              <span>🖼️</span> Change Profile Picture
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Upload a new photo or choose a ready-to-use avatar.
            </p>

            {picMsg.text && (
              <div
                className={`p-3 rounded-lg text-sm mb-4 ${
                  picMsg.type === "success"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-red-50 text-red-600 border border-red-200"
                }`}
              >
                {picMsg.text}
              </div>
            )}

            {/* Custom file upload */}
            <div className="mb-5">
              <label
                htmlFor="avatar-upload"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Upload from device
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleImageFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
              />
            </div>

            {/* Preset Avatars */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Or select an avatar
              </label>
              <div className="flex flex-wrap gap-3">
                {PRESET_AVATARS.map((avatar, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSelectedImage(avatar);
                      setImagePreview(avatar);
                      setPicMsg({ type: "", text: "" });
                    }}
                    className={`p-1 rounded-full border-2 transition cursor-pointer ${
                      selectedImage === avatar
                        ? "border-indigo-600 ring-2 ring-indigo-400"
                        : "border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    <img
                      src={avatar}
                      alt={`Avatar ${idx + 1}`}
                      className="w-12 h-12 rounded-full"
                    />
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleSaveProfilePic}
              disabled={picLoading || selectedImage === authUser?.profilePic}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-5 rounded-lg transition disabled:opacity-50 cursor-pointer"
            >
              {picLoading ? "Saving..." : "Save Profile Picture"}
            </button>
          </section>

          {/* 2. CHANGE USERNAME */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
              <span>👤</span> Change Unique Username
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Your username is how friends find and chat with you in Split Expenses.
            </p>

            {usernameMsg.text && (
              <div
                className={`p-3 rounded-lg text-sm mb-4 ${
                  usernameMsg.type === "success"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : usernameMsg.type === "info"
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "bg-red-50 text-red-600 border border-red-200"
                }`}
              >
                {usernameMsg.text}
              </div>
            )}

            <form onSubmit={handleSaveUsername} className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <div className="relative rounded-lg shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 font-semibold">
                    @
                  </div>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    minLength={3}
                    maxLength={20}
                    required
                    placeholder="new_username"
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Must be between 3 and 20 characters and globally unique.
                </p>
              </div>

              <button
                type="submit"
                disabled={usernameLoading || newUsername.trim() === authUser?.username}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-5 rounded-lg transition disabled:opacity-50 cursor-pointer"
              >
                {usernameLoading ? "Updating..." : "Update Username"}
              </button>
            </form>
          </section>

          {/* 3. CHANGE PASSWORD */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
              <span>🔒</span> Change Password
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Ensure your account is secure using a strong, unique password.
            </p>

            {passwordMsg.text && (
              <div
                className={`p-3 rounded-lg text-sm mb-4 ${
                  passwordMsg.type === "success"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-red-50 text-red-600 border border-red-200"
                }`}
              >
                {passwordMsg.text}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      currentPassword: e.target.value,
                    })
                  }
                  required
                  placeholder="Enter current password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      newPassword: e.target.value,
                    })
                  }
                  minLength={6}
                  required
                  placeholder="Min 6 characters"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      confirmPassword: e.target.value,
                    })
                  }
                  minLength={6}
                  required
                  placeholder="Re-type new password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={passwordLoading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-5 rounded-lg transition disabled:opacity-50 cursor-pointer"
              >
                {passwordLoading ? "Saving..." : "Change Password"}
              </button>
            </form>
          </section>

          {/* 4. LOG OUT SECTION */}
          <section className="bg-red-50/50 rounded-2xl border border-red-100 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-red-900 flex items-center gap-2">
                <span>🚪</span> Log Out
              </h3>
              <p className="text-sm text-red-700 mt-1">
                Log out of your current session on this device.
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 px-6 rounded-lg transition shadow-sm cursor-pointer whitespace-nowrap"
            >
              Log Out
            </button>
          </section>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;
