import React from 'react';
import styles from './TypingIndicator.module.css';

const TypingIndicator = ({ name }) => {
  const displayName = name || 'Someone';

  return (
    <div className={styles.typingIndicator} role="status" aria-label={`${displayName} is typing`}>
      <span className={styles.typingText} aria-hidden="true">
        {displayName} is typing
      </span>
      <div className={styles.typingDots}>
        <span className={styles.dot} aria-hidden="true" />
        <span className={styles.dot} aria-hidden="true" />
        <span className={styles.dot} aria-hidden="true" />
      </div>
    </div>
  );
};

export default TypingIndicator;
