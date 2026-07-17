import React from 'react';

const Loader = ({ fullPage = false, size = 40 }) => {
  const spinnerStyle = {
    width: `${size}px`,
    height: `${size}px`,
    border: '3px solid var(--border-color)',
    borderTop: '3px solid var(--primary)',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  };

  const containerStyle = fullPage
    ? {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'var(--bg-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }
    : {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px'
      };

  return (
    <div style={containerStyle}>
      <div style={spinnerStyle} />
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export const CardSkeleton = () => {
  return (
    <div className="card" style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px' }}>
        <div className="skeleton" style={{ width: '48px', height: '48px', borderRadius: '50%' }} />
        <div style={{ flex: 1 }}>
          <div className="skeleton" style={{ width: '120px', height: '16px', marginBottom: '8px' }} />
          <div className="skeleton" style={{ width: '80px', height: '12px' }} />
        </div>
      </div>
      <div className="skeleton" style={{ width: '100%', height: '14px', marginBottom: '8px' }} />
      <div className="skeleton" style={{ width: '90%', height: '14px', marginBottom: '8px' }} />
      <div className="skeleton" style={{ width: '60%', height: '14px' }} />
    </div>
  );
};

export default Loader;
