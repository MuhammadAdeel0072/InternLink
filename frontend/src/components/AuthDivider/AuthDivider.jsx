import React from 'react';
import styles from './AuthDivider.module.css';

const AuthDivider = ({ text = 'or' }) => {
  return (
    <div 
      className={styles.authDivider}
      role="separator"
      aria-label={text}
    >
      <div className={styles.authDividerLine} />
      <span className={styles.authDividerText}>
        {text}
      </span>
      <div className={styles.authDividerLine} />
    </div>
  );
};

export default AuthDivider;