import React from 'react';
import styles from './MessageSkeleton.module.css';

const MessageSkeleton = () => {
  return (
    <div className={styles.skeletonContainer}>
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className={`${styles.skeletonRow} ${i % 2 === 0 ? styles.skeletonRowMine : styles.skeletonRowOther}`}
        >
          <div className={styles.skeletonBubble} />
        </div>
      ))}
    </div>
  );
};

export default MessageSkeleton;
