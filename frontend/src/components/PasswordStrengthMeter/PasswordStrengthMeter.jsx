import React, { useMemo } from 'react';
import styles from './PasswordStrengthMeter.module.css';

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
    <div className={styles.meterContainer}>
      {/* Strength Bar */}
      <div className={styles.strengthBar}>
        <div 
          className={styles.strengthFill}
          style={{
            width: `${strength.score}%`,
            backgroundColor: strength.color,
          }}
        />
      </div>
      
      {/* Strength Label */}
      {strength.label && (
        <div className={styles.strengthLabel}>
          <span 
            className={styles.strengthText}
            style={{ color: strength.color }}
          >
            Password strength: {strength.label}
          </span>
        </div>
      )}

      {/* Requirements Checklist */}
      <div className={styles.requirementsGrid}>
        {requirements.map((req, index) => {
          const isMet = req.regex.test(password);
          return (
            <div 
              key={index} 
              className={`${styles.requirementItem} ${isMet ? styles.requirementMet : styles.requirementNotMet}`}
            >
              <span className={styles.requirementIcon}>{isMet ? '✓' : '○'}</span>
              <span className={styles.requirementText}>{req.text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PasswordStrengthMeter;