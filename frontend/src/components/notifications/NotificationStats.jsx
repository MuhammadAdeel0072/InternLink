import React from 'react';
import styles from './NotificationStats.module.css';

const NotificationStats = ({ stats }) => {
  if (!stats) return null;

  const items = [
    { label: 'Total Notifications', value: stats.total || 0, color: 'var(--primary)' },
    { label: 'Unread', value: stats.unread || 0, color: 'var(--warning)' },
    { label: 'Read Today', value: stats.readToday || 0, color: 'var(--success)' },
    { label: 'This Week', value: stats.thisWeek || 0, color: 'var(--info)' }
  ];

  return (
    <div className={styles.statsGrid}>
      {items.map((item, idx) => (
        <div key={idx} className={styles.statCard}>
          <span className={styles.statValue} style={{ color: item.color }}>{item.value}</span>
          <span className={styles.statLabel}>{item.label}</span>
        </div>
      ))}
    </div>
  );
};

export default NotificationStats;
