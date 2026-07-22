import React from 'react';
import { Link } from 'react-router-dom';
import styles from './AuthFooter.module.css';

const AuthFooter = ({
  text,
  linkText,
  linkTo,
}) => {
  return (
    <p className={styles.authFooter}>
      {text}{' '}
      <Link
        to={linkTo}
        className={styles.authFooterLink}
      >
        {linkText}
      </Link>
    </p>
  );
};

export default AuthFooter;