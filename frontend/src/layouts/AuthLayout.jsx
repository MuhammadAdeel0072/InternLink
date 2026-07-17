import React from 'react';

const AuthLayout = ({ children }) => {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)'
      }}
    >
      {children}
    </div>
  );
};

export default AuthLayout;
