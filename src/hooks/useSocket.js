import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';

// Remove /api from base URL to get socket server root
const SOCKET_URL = (import.meta.env.VITE_API_URL || '').replace('/api', '');

let socketInstance = null;

export const useSocket = () => {
  const socketRef = useRef(null);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!user) return;

    if (!socketInstance) {
      socketInstance = io(SOCKET_URL, { withCredentials: true });
    }
    socketRef.current = socketInstance;

    // Join the correct room based on role
    socketInstance.emit('join', {
      role:    user.role,
      staffId: user.staffId, // staffId must be stored in auth state (see authSlice note)
    });
  }, [user]);

  return socketRef.current;
};

/*
  NOTE: To make staffId available in auth state, update loginUser in authController.js
  to return staffId alongside name/role:

  // In authController.js loginUser:
  const staffDoc = user.role === 'staff' ? await Staff.findOne({ userId: user._id }) : null;
  res.status(200).json({
    accessToken,
    user: {
      name:    user.firstName,
      role:    user.role,
      staffId: staffDoc?._id?.toString() ?? null,
    }
  });
*/