import React from 'react';
import styles from './Loader.module.css';

const Loader = ({ fullPage = false, size = 40 }) => {
  const containerClass = fullPage ? styles.loaderFullPage : styles.loaderInline;

  return (
    <div className={containerClass}>
      <div 
        className={styles.spinner} 
        style={{ width: `${size}px`, height: `${size}px` }}
      />
    </div>
  );
};

export const CardSkeleton = () => {
  return (
    <div className={`card ${styles.skeletonCard}`}>
      <div className={styles.skeletonHeader}>
        <div className={`skeleton ${styles.skeletonAvatar}`} />
        <div className={styles.skeletonHeaderText}>
          <div className={`skeleton ${styles.skeletonTitle}`} />
          <div className={`skeleton ${styles.skeletonSubtitle}`} />
        </div>
      </div>
      <div className={`skeleton ${styles.skeletonLine}`} />
      <div className={`skeleton ${styles.skeletonLine}`} />
      <div className={`skeleton ${styles.skeletonLineShort}`} />
    </div>
  );
};

export default Loader;