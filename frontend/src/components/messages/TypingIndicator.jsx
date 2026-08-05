import React from 'react';
import styles from './TypingIndicator.module.css';

const TypingIndicator = ({ name }) => {
  return (
    <div className={styles.typingIndicator}>
      <div className={styles.typingDots}>
        <span className={styles.dot} />
        <span className={styles.dot} />
        <span className={styles.dot} />
      </div>
      <span className={styles.typingText}>{name} is typing...</span>
    </div>
  );
};

export default TypingIndicator;
