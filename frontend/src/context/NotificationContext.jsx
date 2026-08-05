import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { notificationService } from '../services/notificationService';
import { useSocket } from './SocketContext';

const NotificationContext = createContext();

const initialState = {
  notifications: [],
  unreadCount: 0,
  stats: { total: 0, unread: 0, readToday: 0, thisWeek: 0 },
  preferences: null,
  loading: false,
  refreshing: false,
  error: null
};

function notificationReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_REFRESHING':
      return { ...state, refreshing: action.payload };
    case 'SET_NOTIFICATIONS':
      return {
        ...state,
        notifications: action.payload,
        unreadCount: action.payload.filter(n => !n.isRead).length
      };
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
        unreadCount: state.unreadCount + (action.payload.isRead ? 0 : 1)
      };
    case 'UPDATE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.map(n =>
          n._id === action.payload._id ? { ...n, ...action.payload } : n
        ),
        unreadCount: state.notifications.filter(n => {
          if (n._id === action.payload._id) return !action.payload.isRead;
          return !n.isRead;
        }).length
      };
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(n => n._id !== action.payload),
        unreadCount: state.notifications.filter(n => n._id !== action.payload && !n.isRead).length
      };
    case 'SET_STATS':
      return { ...state, stats: action.payload };
    case 'SET_PREFERENCES':
      return { ...state, preferences: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
}

export const NotificationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);
  const { socket, emitNotificationAlert } = useSocket();

  const fetchNotifications = useCallback(async (options = {}) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      const data = await notificationService.getNotifications(options);
      dispatch({ type: 'SET_NOTIFICATIONS', payload: data.data || data });
      return data;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const fetchUnreadNotifications = useCallback(async () => {
    try {
      const data = await notificationService.getUnreadNotifications();
      return data;
    } catch (error) {
      console.error('Failed to fetch unread notifications:', error);
      return [];
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const stats = await notificationService.getStats();
      dispatch({ type: 'SET_STATS', payload: stats });
      return stats;
    } catch (error) {
      console.error('Failed to fetch notification stats:', error);
      return initialState.stats;
    }
  }, []);

  const fetchPreferences = useCallback(async () => {
    try {
      const preferences = await notificationService.getPreferences();
      dispatch({ type: 'SET_PREFERENCES', payload: preferences });
      return preferences;
    } catch (error) {
      console.error('Failed to fetch notification preferences:', error);
      return null;
    }
  }, []);

  const markAsRead = useCallback(async (id) => {
    try {
      await notificationService.markAsRead(id);
      dispatch({ type: 'UPDATE_NOTIFICATION', payload: { _id: id, isRead: true } });
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      throw error;
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      dispatch({ type: 'SET_REFRESHING', payload: true });
      await notificationService.markAllAsRead();
      dispatch({
        type: 'SET_NOTIFICATIONS',
        payload: state.notifications.map(n => ({ ...n, isRead: true }))
      });
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      throw error;
    } finally {
      dispatch({ type: 'SET_REFRESHING', payload: false });
    }
  }, [state.notifications]);

  const markBulkAsRead = useCallback(async (ids) => {
    try {
      await notificationService.markBulkAsRead(ids);
      dispatch({
        type: 'SET_NOTIFICATIONS',
        payload: state.notifications.map(n =>
          ids.includes(n._id) ? { ...n, isRead: true } : n
        )
      });
    } catch (error) {
      console.error('Failed to bulk mark as read:', error);
      throw error;
    }
  }, [state.notifications]);

  const deleteNotification = useCallback(async (id) => {
    try {
      await notificationService.deleteNotification(id);
      dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
    } catch (error) {
      console.error('Failed to delete notification:', error);
      throw error;
    }
  }, []);

  const deleteReadNotifications = useCallback(async () => {
    try {
      dispatch({ type: 'SET_REFRESHING', payload: true });
      await notificationService.deleteReadNotifications();
      dispatch({
        type: 'SET_NOTIFICATIONS',
        payload: state.notifications.filter(n => !n.isRead)
      });
    } catch (error) {
      console.error('Failed to delete read notifications:', error);
      throw error;
    } finally {
      dispatch({ type: 'SET_REFRESHING', payload: false });
    }
  }, [state.notifications]);

  const bulkDeleteNotifications = useCallback(async (ids) => {
    try {
      await notificationService.bulkDeleteNotifications(ids);
      dispatch({
        type: 'SET_NOTIFICATIONS',
        payload: state.notifications.filter(n => !ids.includes(n._id))
      });
    } catch (error) {
      console.error('Failed to bulk delete notifications:', error);
      throw error;
    }
  }, [state.notifications]);

  const updatePreferences = useCallback(async (preferences) => {
    try {
      const updated = await notificationService.updatePreferences(preferences);
      dispatch({ type: 'SET_PREFERENCES', payload: updated });
      return updated;
    } catch (error) {
      console.error('Failed to update preferences:', error);
      throw error;
    }
  }, []);

  const refreshAll = useCallback(async () => {
    try {
      dispatch({ type: 'SET_REFRESHING', payload: true });
      await Promise.all([fetchNotifications(), fetchStats()]);
    } catch (error) {
      console.error('Failed to refresh notifications:', error);
    } finally {
      dispatch({ type: 'SET_REFRESHING', payload: false });
    }
  }, [fetchNotifications, fetchStats]);

  useEffect(() => {
    if (socket) {
      const handleNewNotification = (notification) => {
        dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
      };

      const handleNotificationUpdated = (update) => {
        dispatch({ type: 'UPDATE_NOTIFICATION', payload: update });
      };

      socket.on('notification:new', handleNewNotification);
      socket.on('notification:updated', handleNotificationUpdated);

      return () => {
        socket.off('notification:new', handleNewNotification);
        socket.off('notification:updated', handleNotificationUpdated);
      };
    }
  }, [socket]);

  const value = {
    ...state,
    fetchNotifications,
    fetchUnreadNotifications,
    fetchStats,
    fetchPreferences,
    markAsRead,
    markAllAsRead,
    markBulkAsRead,
    deleteNotification,
    deleteReadNotifications,
    bulkDeleteNotifications,
    updatePreferences,
    refreshAll
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
