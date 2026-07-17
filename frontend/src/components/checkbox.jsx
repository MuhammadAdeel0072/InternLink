import React from 'react';

const Checkbox = ({
  label,
  checked,
  onChange,
  name,
  id,
  disabled = false,
  error,
  linkText,
  linkTo,
}) => {
  const checkboxId = id || `checkbox-${name}`;

  return (
    <div style={{ margin: '16px 0' }}>
      <label
        htmlFor={checkboxId}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          fontSize: '0.875rem',
          color: 'var(--text-secondary)',
          userSelect: 'none',
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <div style={{ position: 'relative', width: '20px', height: '20px', flexShrink: 0 }}>
          <input
            type="checkbox"
            id={checkboxId}
            name={name}
            checked={checked}
            onChange={onChange}
            disabled={disabled}
            style={{
              position: 'absolute',
              opacity: 0,
              width: '100%',
              height: '100%',
              cursor: disabled ? 'not-allowed' : 'pointer',
              margin: 0,
            }}
          />
          <div
            style={{
              width: '20px',
              height: '20px',
              border: `2px solid ${checked ? 'var(--primary)' : 'var(--border-color)'}`,
              borderRadius: '4px',
              backgroundColor: checked ? 'var(--primary)' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
            }}
          >
            {checked && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </div>
        </div>
        
        <span style={{ lineHeight: '1.4' }}>{label}</span>
      </label>
      
      {error && (
        <p style={{ 
          color: 'var(--danger)', 
          fontSize: '0.75rem', 
          marginTop: '6px',
          marginLeft: '30px',
        }}>
          {error}
        </p>
      )}
    </div>
  );
};

export default Checkbox;