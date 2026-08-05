import React from 'react';
import styles from './NotificationSkeleton.module.css';

const NotificationSkeleton = ({ count = 5 }) => {
  return (
    <div className={styles.list}>
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className={styles.skeletonCard}>
          <div className={styles.skeletonIcon} />
          <div className={styles.skeletonContent}>
            <div className={styles.skeletonLine} />
            <div className={styles.skeletonLineShort} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationSkeleton;
