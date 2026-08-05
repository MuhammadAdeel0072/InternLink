import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import NotificationCard from './NotificationCard';
import NotificationSkeleton from './NotificationSkeleton';
import { Bell, Settings, ChevronRight, Loader } from 'lucide-react';
import styles from './NotificationDropdown.module.css';

const NotificationDropdown = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    deleteNotification
  } = useNotifications();

  const [statusFilter, setStatusFilter] = useState('unread');

  useEffect(() => {
    if (isOpen) {
      fetchNotifications({ status: statusFilter, limit: 5 });
    }
  }, [isOpen, statusFilter]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        onClose?.();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }
    if (notification.entityId && notification.entityType) {
      navigate(`/${notification.entityType}/${notification.entityId}`);
      onClose?.();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.dropdown} ref={dropdownRef}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Bell size={18} />
          <h3>Notifications</h3>
          {unreadCount > 0 && <span className={styles.unreadCount}>{unreadCount}</span>}
        </div>
        <button className={styles.settingsBtn} onClick={() => navigate('/settings')}>
          <Settings size={14} />
        </button>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${statusFilter === 'unread' ? styles.tabActive : ''}`}
          onClick={() => setStatusFilter('unread')}
        >
          Unread
        </button>
        <button
          className={`${styles.tab} ${statusFilter === 'all' ? styles.tabActive : ''}`}
          onClick={() => setStatusFilter('all')}
        >
          All
        </button>
      </div>

      <div className={styles.list}>
        {loading ? (
          <div className={styles.loading}>
            <Loader size={20} className={styles.spinner} />
          </div>
        ) : notifications.length === 0 ? (
          <div className={styles.empty}>
            <Bell size={32} />
            <p>No notification</p>
          </div>
        ) : (
          notifications.slice(0, 5).map((notification) => (
            <NotificationCard
              key={notification._id}
              notification={notification}
              onRead={markAsRead}
              onDelete={deleteNotification}
              onOpen={handleNotificationClick}
            />
          ))
        )}
      </div>

      <button className={styles.viewAll} onClick={() => { navigate('/notifications'); onClose?.(); }}>
        View All Notifications <ChevronRight size={16} />
      </button>
    </div>
  );
};

export default NotificationDropdown;
