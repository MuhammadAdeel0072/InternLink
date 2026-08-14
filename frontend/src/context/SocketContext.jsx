import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { API_URL } from '../services/api';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const { user } = useAuth();

  // Keep a ref to the latest socket so the error handler can read it
  // without needing to add `socket` to the dependency array (which
  // would cause the effect to re-run on every socket change).
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setSocket(null);
      setSocketConnected(false);
      return;
    }

    const newSocket = io(API_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      // Exponential backoff: start at 1s, max 30s, jitter to avoid thundering herd
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
      reconnectionAttempts: 10,
      timeout: 10000,
      forceNew: true,
    });

    newSocket.on('connect', () => {
      setSocketConnected(true);
      newSocket.emit('register', user._id);
    });

    newSocket.on('disconnect', (reason) => {
      setSocketConnected(false);
      // Only log once per disconnect event; socket.io handles reconnection
      if (import.meta.env.DEV) {
        console.warn('[Socket] Disconnected:', reason);
      }
    });

    newSocket.on('connect_error', (error) => {
      setSocketConnected(false);
      // Log only once per error batch to avoid console spam.
      // The socket.io client will retry with backoff automatically.
      if (import.meta.env.DEV) {
        console.error('[Socket] Connection error:', error.message);
      }
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
      socketRef.current = null;
      setSocketConnected(false);
    };
    // We intentionally depend only on `user` — the socket is recreated
    // whenever the authenticated user changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const emitMessageAlert = (recipientId, message) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('send_message_alert', { recipientId, message });
    }
  };

  const emitNotificationAlert = (recipientId, notification) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('send_notification_alert', { recipientId, notification });
    }
  };

  return (
    <SocketContext.Provider value={{ socket, socketConnected, emitMessageAlert, emitNotificationAlert }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
