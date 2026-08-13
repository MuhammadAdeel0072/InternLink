import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';

const OnlineStatusContext = createContext();

export const OnlineStatusProvider = ({ children }) => {
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const { socket, socketConnected } = useSocket() || {};
  const { user } = useAuth();

  useEffect(() => {
    if (!socket) {
      setOnlineUsers(new Set());
      return;
    }

    const handleConnect = () => {
      if (user?._id) {
        socket.emit('register', user._id);
      }
    };

    const handleUserOnline = ({ userId }) => {
      setOnlineUsers((prev) => new Set([...prev, userId]));
    };

    const handleUserOffline = ({ userId }) => {
      setOnlineUsers((prev) => {
        const updated = new Set(prev);
        updated.delete(userId);
        return updated;
      });
    };

    socket.on('connect', handleConnect);
    socket.on('user:online', handleUserOnline);
    socket.on('user:offline', handleUserOffline);

    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('user:online', handleUserOnline);
      socket.off('user:offline', handleUserOffline);
    };
  }, [socket, user]);

  const isOnline = useCallback((userId) => {
    return onlineUsers.has(userId?.toString());
  }, [onlineUsers]);

  const value = {
    onlineUsers,
    isOnline,
    socketConnected
  };

  return (
    <OnlineStatusContext.Provider value={value}>
      {children}
    </OnlineStatusContext.Provider>
  );
};

export const useOnlineStatus = () => {
  const context = useContext(OnlineStatusContext);
  if (!context) {
    return { onlineUsers: new Set(), isOnline: () => false, socketConnected: false };
  }
  return context;
};
