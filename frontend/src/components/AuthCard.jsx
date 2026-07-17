import React from 'react';

const AuthCard = ({ children, title, subtitle }) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '20px',
        background: 'radial-gradient(circle at 10% 20%, rgba(99, 102, 241, 0.15) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(6, 182, 212, 0.1) 0%, transparent 50%)'
      }}
    >
      <div
        className="card glass"
        style={{
          width: '100%',
          maxWidth: '450px',
          padding: '40px 32px',
          animation: 'fadeIn 0.5s ease forwards'
        }}
      >
        {title && (
          <h2
            style={{
              fontSize: '2rem',
              textAlign: 'center',
              marginBottom: '8px',
              fontFamily: 'var(--font-display)',
              letterSpacing: '-0.5px'
            }}
          >
            {title}
          </h2>
        )}
        {subtitle && (
          <p
            style={{
              color: 'var(--text-secondary)',
              textAlign: 'center',
              fontSize: '0.9rem',
              marginBottom: '32px'
            }}
          >
            {subtitle}
          </p>
        )}
        {children}
      </div>
    </div>
  );
};

export default AuthCard;
