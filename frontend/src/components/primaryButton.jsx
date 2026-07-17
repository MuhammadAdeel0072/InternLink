import React from 'react';

const PrimaryButton = ({
  children,
  onClick,
  type = 'button',
  disabled = false,
  loading = false,
  fullWidth = true,
  style = {},
  className = '',
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`btn btn-primary ${className}`}
      style={{
        width: fullWidth ? '100%' : 'auto',
        height: '48px',
        fontSize: '1rem',
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled || loading ? 0.7 : 1,
        ...style,
      }}
    >
      {loading ? (
        <>
          <span
            style={{
              width: '18px',
              height: '18px',
              border: '2.5px solid rgba(255, 255, 255, 0.3)',
              borderTop: '2.5px solid white',
              borderRadius: '50%',
              animation: 'spin 0.6s linear infinite',
              display: 'inline-block',
            }}
          />
          <span>Please wait...</span>
        </>
      ) : (
        children
      )}
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </button>
  );
};

export default PrimaryButton;