import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      // Connect to the socket server
      const newSocket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
        transports: ['websocket'],
      });

      newSocket.on('connect', () => {
        console.log('Socket client connected:', newSocket.id);
        // Register user ID on socket connection
        newSocket.emit('register', user._id);
      });

      setSocket(newSocket);

      // Clean up on unmount or user change
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
