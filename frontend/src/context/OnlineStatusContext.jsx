import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useSocket } from './SocketContext';

const OnlineStatusContext = createContext();

export const OnlineStatusProvider = ({ children }) => {
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  // NOTE: socket registration ('register' event) is handled exclusively by SocketContext.
  // OnlineStatusContext only listens for presence updates.
  const { socket, socketConnected } = useSocket() || {};

  useEffect(() => {
    if (!socket) {
      setOnlineUsers(new Set());
      return;
    }

    const handleOnlineList = ({ onlineUserIds }) => {
      if (Array.isArray(onlineUserIds)) {
        setOnlineUsers(new Set(onlineUserIds.map((id) => id?.toString())));
      }
    };

    const handleUserOnline = ({ userId }) => {
      if (!userId) return;
      setOnlineUsers((prev) => new Set([...prev, userId.toString()]));
    };

    const handleUserOffline = ({ userId }) => {
      if (!userId) return;
      setOnlineUsers((prev) => {
        const updated = new Set(prev);
        updated.delete(userId.toString());
        return updated;
      });
    };

    socket.on('users:online_list', handleOnlineList);
    socket.on('user:online', handleUserOnline);
    socket.on('user:offline', handleUserOffline);

    return () => {
      socket.off('users:online_list', handleOnlineList);
      socket.off('user:online', handleUserOnline);
      socket.off('user:offline', handleUserOffline);
    };
  }, [socket]);

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
