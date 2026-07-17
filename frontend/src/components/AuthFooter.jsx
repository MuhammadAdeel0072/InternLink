import React from 'react';
import { Link } from 'react-router-dom';

const AuthFooter = ({
  text,
  linkText,
  linkTo,
}) => {
  return (
    <p
      style={{
        marginTop: '28px',
        textAlign: 'center',
        fontSize: '0.875rem',
        color: 'var(--text-secondary)',
        lineHeight: '1.5',
      }}
    >
      {text}{' '}
      <Link
        to={linkTo}
        style={{
          color: 'var(--primary)',
          fontWeight: 600,
          textDecoration: 'none',
          transition: 'color 0.2s ease',
        }}
        onMouseEnter={(e) => e.target.style.color = 'var(--primary-hover)'}
        onMouseLeave={(e) => e.target.style.color = 'var(--primary)'}
      >
        {linkText}
      </Link>
    </p>
  );
};

export default AuthFooter;