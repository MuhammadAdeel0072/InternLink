import React from 'react';
import styles from './PrimaryButton.module.css';

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
      className={`btn btn-primary ${styles.primaryButton} ${className} ${fullWidth ? styles.fullWidth : ''} ${(disabled || loading) ? styles.disabled : ''}`}
      style={style}
    >
      {loading ? (
        <>
          <span className={styles.spinner} />
          <span>Please wait...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};

export default PrimaryButton;