import React from 'react';
import styles from './NotificationFilters.module.css';

const NotificationFilters = ({ filters, onChange }) => {
  const categories = [
    { value: 'all', label: 'All' },
    { value: 'unread', label: 'Unread' },
    { value: 'read', label: 'Read' },
    { value: 'system', label: 'System' },
    { value: 'network', label: 'Network' },
    { value: 'message', label: 'Messages' },
    { value: 'job', label: 'Jobs' },
    { value: 'application', label: 'Applications' },
    { value: 'interview', label: 'Interviews' },
    { value: 'offer', label: 'Offers' },
    { value: 'hiring', label: 'Hiring' },
    { value: 'post', label: 'Posts' },
    { value: 'security', label: 'Security' }
  ];

  return (
    <div className={styles.filters}>
      <div className={styles.tabs}>
        {categories.map((cat) => (
          <button
            key={cat.value}
            className={`${styles.tab} ${filters.category === cat.value ? styles.tabActive : ''}`}
            onClick={() => onChange({ ...filters, category: cat.value, page: 1 })}
          >
            {cat.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default NotificationFilters;
