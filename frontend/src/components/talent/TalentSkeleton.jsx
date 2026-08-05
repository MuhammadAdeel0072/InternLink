import React from 'react';
import styles from './TalentSkeleton.module.css';

const TalentSkeleton = ({ count = 6 }) => {
  return (
    <div className={styles.grid}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`card ${styles.card}`}>
          <div className={styles.header}>
            <div className={styles.avatar} />
            <div className={styles.headerText}>
              <div className={styles.titleLine} />
              <div className={styles.subtitleLine} />
            </div>
          </div>
          <div className={styles.body}>
            <div className={styles.line} />
            <div className={styles.line} />
            <div className={styles.lineShort} />
            <div className={styles.tags}>
              <div className={styles.tag} />
              <div className={styles.tag} />
              <div className={styles.tagShort} />
            </div>
          </div>
          <div className={styles.footer}>
            <div className={styles.actions}>
              <div className={styles.actionBtn} />
              <div className={styles.actionBtn} />
              <div className={styles.actionBtn} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TalentSkeleton;
