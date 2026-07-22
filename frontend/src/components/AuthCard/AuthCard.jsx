import React from 'react';
import styles from './AuthCard.module.css';

const AuthCard = ({ children, title, subtitle }) => {
  return (
    <div className={styles.authCardContainer}>
      <div className={`card glass ${styles.authCard}`}>
        {title && (
          <h2 className={styles.authCardTitle}>
            {title}
          </h2>
        )}
        {subtitle && (
          <p className={styles.authCardSubtitle}>
            {subtitle}
          </p>
        )}
        {children}
      </div>
    </div>
  );
};

export default AuthCard;