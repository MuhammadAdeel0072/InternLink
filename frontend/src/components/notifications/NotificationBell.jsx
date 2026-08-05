import React from 'react';
import { Bell } from 'lucide-react';
import styles from './NotificationBell.module.css';

const NotificationBell = ({ onClick, unreadCount = 0 }) => {
  return (
    <button className={styles.bellBtn} onClick={onClick} aria-label="Notifications">
      <Bell size={20} />
      {unreadCount > 0 && (
        <span className={styles.badge}>
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
};

export default NotificationBell;
