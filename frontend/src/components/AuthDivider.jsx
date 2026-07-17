import React from 'react';

const AuthDivider = ({ text = 'or' }) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        margin: '24px 0',
      }}
      role="separator"
      aria-label={text}
    >
      <div
        style={{
          flex: 1,
          height: '1px',
          background: 'linear-gradient(to right, transparent, var(--border-color), transparent)',
        }}
      />
      <span
        style={{
          fontSize: '0.75rem',
          color: 'var(--text-secondary)',
          textTransform: 'uppercase',
          fontWeight: 600,
          letterSpacing: '0.5px',
          whiteSpace: 'nowrap',
        }}
      >
        {text}
      </span>
      <div
        style={{
          flex: 1,
          height: '1px',
          background: 'linear-gradient(to right, transparent, var(--border-color), transparent)',
        }}
      />
    </div>
  );
};

export default AuthDivider;