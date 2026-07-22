import React, { useState, useRef, useEffect } from 'react';
import styles from './CollapsibleText.module.css';

const CollapsibleText = ({ 
  text = '', 
  maxHeight = 80, 
  placeholder = '',
  children = null
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [needsButton, setNeedsButton] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    if (contentRef.current) {
      setNeedsButton(contentRef.current.scrollHeight > maxHeight);
    }
  }, [text, maxHeight, children]);

  return (
    <div className={styles.collapsibleContainer}>
      <div
        ref={contentRef}
        className={`${styles.collapsibleContent} ${!isExpanded ? styles.collapsibleContentCollapsed : ''}`}
        style={!isExpanded ? { maxHeight: `${maxHeight}px` } : {}}
      >
        {children ? (
          children
        ) : (
          <p className={styles.collapsibleText}>
            {text || placeholder}
          </p>
        )}
        {!isExpanded && needsButton && (
          <div className={styles.collapsibleGradient} />
        )}
      </div>
      {needsButton && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={styles.collapsibleToggle}
        >
          {isExpanded ? 'See Less ↑' : 'See More ↓'}
        </button>
      )}
    </div>
  );
};

export default CollapsibleText;