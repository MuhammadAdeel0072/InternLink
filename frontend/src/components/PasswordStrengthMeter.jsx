import React, { useMemo } from 'react';

const PasswordStrengthMeter = ({ password }) => {
  const strength = useMemo(() => {
    if (!password) return { score: 0, label: '', color: '#e5e7eb' };

    let score = 0;
    
    // Length check
    if (password.length >= 8) score += 20;
    if (password.length >= 12) score += 10;
    
    // Character variety checks
    if (/[a-z]/.test(password)) score += 20;
    if (/[A-Z]/.test(password)) score += 20;
    if (/\d/.test(password)) score += 20;
    if (/[@$!%*?&#^()_\-+=]/.test(password)) score += 10;
    
    // Bonus for combination
    const varietyCount = [
      /[a-z]/.test(password),
      /[A-Z]/.test(password),
      /\d/.test(password),
      /[@$!%*?&#^()_\-+=]/.test(password)
    ].filter(Boolean).length;
    
    if (varietyCount >= 4) score += 10;

    if (score <= 30) return { score, label: 'Weak', color: '#ef4444' };
    if (score <= 60) return { score, label: 'Fair', color: '#f59e0b' };
    if (score <= 80) return { score, label: 'Good', color: '#3b82f6' };
    return { score, label: 'Strong', color: '#22c55e' };
  }, [password]);

  const requirements = [
    { regex: /.{8,}/, text: 'At least 8 characters' },
    { regex: /[a-z]/, text: 'One lowercase letter' },
    { regex: /[A-Z]/, text: 'One uppercase letter' },
    { regex: /\d/, text: 'One number' },
    { regex: /[@$!%*?&#^()_\-+=]/, text: 'One special character' },
  ];

  return (
    <div style={{ marginBottom: '16px' }}>
      {/* Strength Bar */}
      <div style={{
        height: '4px',
        backgroundColor: '#e5e7eb',
        borderRadius: '2px',
        marginBottom: '8px',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${strength.score}%`,
          backgroundColor: strength.color,
          transition: 'width 0.3s ease, background-color 0.3s ease',
          borderRadius: '2px',
        }} />
      </div>
      
      {/* Strength Label */}
      {strength.label && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px',
        }}>
          <span style={{
            fontSize: '0.75rem',
            color: strength.color,
            fontWeight: 600,
          }}>
            Password strength: {strength.label}
          </span>
        </div>
      )}

      {/* Requirements Checklist */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '4px',
      }}>
        {requirements.map((req, index) => {
          const isMet = req.regex.test(password);
          return (
            <div key={index} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.7rem',
              color: isMet ? '#22c55e' : '#9ca3af',
            }}>
              <span>{isMet ? '✓' : '○'}</span>
              <span>{req.text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PasswordStrengthMeter;