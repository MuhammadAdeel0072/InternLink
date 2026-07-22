import React from 'react';
import styles from './AuthLayout.module.css';

const AuthLayout = ({ children }) => {
  return (
    <div className={styles.authLayout}>
      {children}
    </div>
  );
};

export default AuthLayout;