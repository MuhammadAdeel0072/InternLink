import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      const newSocket = io(import.meta.env.VITE_API_URL, {
        withCredentials: true,
        transports: ['websocket', 'polling'],
      });

      newSocket.on('connect', () => {
        console.log('Socket client connected:', newSocket.id);
        newSocket.emit('register', user._id);
      });

      newSocket.on('connect_error', (error) => {
        if (import.meta.env.DEV) {
          console.error('Socket connection error:', error.message);
        }
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
        console.log('Socket client disconnected');
      };
    } else {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
    }
  }, [user]);

  const emitMessageAlert = (recipientId, message) => {
    if (socket) {
      socket.emit('send_message_alert', { recipientId, message });
    }
  };

  const emitNotificationAlert = (recipientId, notification) => {
    if (socket) {
      socket.emit('send_notification_alert', { recipientId, notification });
    }
  };

  return (
    <SocketContext.Provider value={{ socket, emitMessageAlert, emitNotificationAlert }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
