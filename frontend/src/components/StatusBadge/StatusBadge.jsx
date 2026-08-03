import React from 'react';
import styles from './StatusBadge.module.css';

const STATUS_CONFIG = {
  scheduled: { label: 'Scheduled', className: styles.scheduled },
  'pending-confirmation': { label: 'Pending Confirmation', className: styles.pending },
  confirmed: { label: 'Confirmed', className: styles.confirmed },
  rescheduled: { label: 'Rescheduled', className: styles.rescheduled },
  completed: { label: 'Completed', className: styles.completed },
  cancelled: { label: 'Cancelled', className: styles.cancelled },
  'no-show': { label: 'No Show', className: styles.noShow }
};

const StatusBadge = ({ status, size = 'md' }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.scheduled;
  const sizeClass = size === 'sm' ? styles.small : size === 'lg' ? styles.large : '';

  return (
    <span className={`${styles.badge} ${config.className} ${sizeClass}`}>
      {config.label}
    </span>
  );
};

export default StatusBadge;
