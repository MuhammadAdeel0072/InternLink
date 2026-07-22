import React, { useState, useRef, useEffect } from 'react';

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
    <div>
      <div
        ref={contentRef}
        style={{
          maxHeight: isExpanded ? 'none' : `${maxHeight}px`,
          overflow: 'hidden',
          transition: 'max-height 0.3s ease',
          position: 'relative'
        }}
      >
        {children ? (
          children
        ) : (
          <p style={{ 
            margin: 0, 
            lineHeight: '1.6', 
            color: 'var(--text-secondary)',
            whiteSpace: 'pre-wrap',
            fontSize: '0.95rem'
          }}>
            {text || placeholder}
          </p>
        )}
        {!isExpanded && needsButton && (
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '40px',
            background: 'linear-gradient(transparent, white)',
            pointerEvents: 'none'
          }} />
        )}
      </div>
      {needsButton && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            background: 'none',
            border: 'none',
            color: '#667eea',
            fontWeight: 600,
            cursor: 'pointer',
            padding: '8px 0 0 0',
            fontSize: '0.9rem'
          }}
        >
          {isExpanded ? 'See Less ↑' : 'See More ↓'}
        </button>
      )}
    </div>
  );
};

export default CollapsibleText;