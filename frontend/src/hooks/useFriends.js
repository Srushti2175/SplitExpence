import { useState, useEffect, useCallback } from "react";
import axios from "../utils/axios";
import { useSocketContext } from "../context/SocketContext";

export const useFriends = () => {
  const [allUsers, setAllUsers] = useState([]);
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const { socket } = useSocketContext();

  // Fetch all users with optional search
  const fetchAllUsers = useCallback(async (query = "") => {
    setLoadingUsers(true);
    try {
      const url = query.trim()
        ? `/friends/all?search=${encodeURIComponent(query.trim())}`
        : "/friends/all";
      const { data } = await axios.get(url);
      setAllUsers(data);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  // Fetch confirmed friends
  const fetchFriends = useCallback(async () => {
    try {
      const { data } = await axios.get("/friends/list");
      setFriends(data);
    } catch (err) {
      console.error("Failed to fetch friends:", err);
    }
  }, []);

  // Fetch pending incoming requests
  const fetchPendingRequests = useCallback(async () => {
    try {
      const { data } = await axios.get("/friends/requests");
      setPendingRequests(data);
    } catch (err) {
      console.error("Failed to fetch pending requests:", err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchAllUsers(searchQuery);
    fetchFriends();
    fetchPendingRequests();
  }, [fetchAllUsers, fetchFriends, fetchPendingRequests]);

  // Debounced search when searchQuery changes
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAllUsers(searchQuery);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, fetchAllUsers]);

  // ─── Real-time Socket.IO Listeners (Interactive & Sub-second speed) ───
  useEffect(() => {
    if (!socket) return;

    // 1. When another user clicks request, this fires instantly on the recipient
    const handleNewRequest = (newReq) => {
      setPendingRequests((prev) => {
        // Prevent duplicates
        if (prev.some((r) => r._id === newReq._id)) return prev;
        return [newReq, ...prev];
      });

      // Instantly change button to Accept/Reject for that user
      setAllUsers((prev) =>
        prev.map((u) =>
          u._id === newReq.sender._id
            ? { ...u, status: "request_received", requestId: newReq._id }
            : u
        )
      );
    };

    // 2. When a friend request is accepted, both users instantly update
    const handleRequestAccepted = ({ user, requestId }) => {
      setPendingRequests((prev) => prev.filter((r) => r._id !== requestId));
      fetchFriends();
      setAllUsers((prev) =>
        prev.map((u) =>
          u._id === user._id ? { ...u, status: "friends", requestId: null } : u
        )
      );
    };

    // 3. When a request is cancelled or rejected, instantly update UI
    const handleRequestCancelled = ({ requestId, byUserId }) => {
      setPendingRequests((prev) => prev.filter((r) => r._id !== requestId));
      setAllUsers((prev) =>
        prev.map((u) =>
          u._id === byUserId || u.requestId === requestId
            ? { ...u, status: "none", requestId: null }
            : u
        )
      );
    };

    socket.on("newFriendRequest", handleNewRequest);
    socket.on("friendRequestAccepted", handleRequestAccepted);
    socket.on("friendRequestCancelled", handleRequestCancelled);

    return () => {
      socket.off("newFriendRequest", handleNewRequest);
      socket.off("friendRequestAccepted", handleRequestAccepted);
      socket.off("friendRequestCancelled", handleRequestCancelled);
    };
  }, [socket, fetchFriends]);

  // ─── Action: Send Friend Request ────────────────────────────────────
  const sendRequest = async (targetUserId) => {
    setActionLoadingId(targetUserId);

    try {
      const { data } = await axios.post(`/friends/request/${targetUserId}`);
      setAllUsers((prev) =>
        prev.map((u) =>
          u._id === targetUserId
            ? { ...u, status: "request_sent", requestId: data.requestId }
            : u
        )
      );
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || "Failed to send request",
      };
    } finally {
      setActionLoadingId(null);
    }
  };

  // ─── Action: Accept Friend Request (Instant UI update) ──────────────
  const acceptRequest = async (requestId, senderId) => {
    setActionLoadingId(requestId);
    // Optimistically remove from pending
    setPendingRequests((prev) => prev.filter((r) => r._id !== requestId));
    if (senderId) {
      setAllUsers((prev) =>
        prev.map((u) =>
          u._id === senderId ? { ...u, status: "friends", requestId: null } : u
        )
      );
    }

    try {
      await axios.post(`/friends/accept/${requestId}`);
      fetchFriends();
      return { success: true };
    } catch (err) {
      fetchPendingRequests();
      fetchAllUsers(searchQuery);
      return {
        success: false,
        error: err.response?.data?.message || "Failed to accept request",
      };
    } finally {
      setActionLoadingId(null);
    }
  };

  // ─── Action: Reject or Cancel Friend Request ───────────────────────
  const rejectRequest = async (requestId, userId) => {
    setActionLoadingId(requestId);
    setPendingRequests((prev) => prev.filter((r) => r._id !== requestId));
    if (userId) {
      setAllUsers((prev) =>
        prev.map((u) =>
          u._id === userId ? { ...u, status: "none", requestId: null } : u
        )
      );
    }

    try {
      await axios.post(`/friends/reject/${requestId}`);
      return { success: true };
    } catch (err) {
      fetchPendingRequests();
      fetchAllUsers(searchQuery);
      return {
        success: false,
        error: err.response?.data?.message || "Failed to remove request",
      };
    } finally {
      setActionLoadingId(null);
    }
  };

  return {
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
    fetchAllUsers,
    fetchFriends,
  };
};
