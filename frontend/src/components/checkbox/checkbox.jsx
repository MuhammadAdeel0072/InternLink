import React from 'react';
import styles from './Checkbox.module.css';

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
    <div className={styles.checkboxContainer}>
      <label
        htmlFor={checkboxId}
        className={`${styles.checkboxLabel} ${disabled ? styles.checkboxLabelDisabled : ''}`}
      >
        <div className={styles.checkboxWrapper}>
          <input
            type="checkbox"
            id={checkboxId}
            name={name}
            checked={checked}
            onChange={onChange}
            disabled={disabled}
            className={styles.checkboxInput}
          />
          <div className={`${styles.checkboxBox} ${checked ? styles.checkboxBoxChecked : ''}`}>
            {checked && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </div>
        </div>
        
        <span className={styles.checkboxLabelText}>{label}</span>
      </label>
      
      {error && (
        <p className={styles.checkboxError}>
          {error}
        </p>
      )}
    </div>
  );
};

export default Checkbox;