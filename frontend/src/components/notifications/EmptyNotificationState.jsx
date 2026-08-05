import React from 'react';
import { Bell, RefreshCw } from 'lucide-react';
import PrimaryButton from '../../components/primaryButton/primaryButton';
import styles from './EmptyNotificationState.module.css';

const EmptyNotificationState = ({ onRefresh }) => {
  return (
    <div className={styles.empty}>
      <div className={styles.iconWrapper}>
        <Bell size={32} />
      </div>
      <h3>No notification</h3>
      <p>You're all caught up! New notifications will appear here.</p>
      {onRefresh && (
        <button className={styles.refreshBtn} onClick={onRefresh}>
          <RefreshCw size={16} /> Refresh
        </button>
      )}
    </div>
  );
};

export default EmptyNotificationState;
