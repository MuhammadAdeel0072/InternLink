import React, { useState } from 'react';

const OAuthButtons = ({ mode = 'login' }) => {
  const [loading, setLoading] = useState(null);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  const handleOAuth = (provider) => {
    setLoading(provider);
    window.location.href = `${API_BASE_URL}/auth/${provider}`;
  };

  const buttons = [
    {
      provider: 'google',
      label: `Continue with Google`,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
      ),
      bgColor: '#ffffff',
      textColor: '#1f2937',
      border: '1px solid #d1d5db',
      hoverBg: '#f9fafb',
    },
    {
      provider: 'github',
      label: `Continue with GitHub`,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.605-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z"/>
        </svg>
      ),
      bgColor: '#24292e',
      textColor: '#ffffff',
      border: 'none',
      hoverBg: '#2f363d',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {buttons.map(({ provider, label, icon, bgColor, textColor, border, hoverBg }) => (
        <button
          key={provider}
          type="button"
          onClick={() => handleOAuth(provider)}
          disabled={loading === provider}
          style={{
            width: '100%',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            backgroundColor: bgColor,
            color: textColor,
            border: border,
            borderRadius: '8px',
            fontSize: '0.9rem',
            fontWeight: 500,
            cursor: loading === provider ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
            opacity: loading === provider ? 0.7 : 1,
          }}
          onMouseEnter={(e) => {
            if (loading !== provider) {
              e.target.style.backgroundColor = hoverBg;
            }
          }}
          onMouseLeave={(e) => {
            if (loading !== provider) {
              e.target.style.backgroundColor = bgColor;
            }
          }}
        >
          {loading === provider ? (
            <span
              style={{
                width: '18px',
                height: '18px',
                border: '2.5px solid rgba(0, 0, 0, 0.2)',
                borderTop: `2.5px solid ${textColor}`,
                borderRadius: '50%',
                animation: 'spin 0.6s linear infinite',
                display: 'inline-block',
              }}
            />
          ) : (
            icon
          )}
          <span>{loading === provider ? 'Connecting...' : label}</span>
        </button>
      ))}
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default OAuthButtons;