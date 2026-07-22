import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AuthCard from '../../components/AuthCard/AuthCard';
import Loader from '../../components/Loader/Loader';
import styles from './VerifyEmail.module.css';

const VerifyEmail = () => {
  const { verifyEmail } = useAuth();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const triggerVerification = async () => {
      if (!token) {
        setVerifying(false);
        setErrorMsg('Verification token is missing. Please check your verification link.');
        return;
      }

      const result = await verifyEmail(token);
      setVerifying(false);
      if (result.success) {
        setVerified(true);
      } else {
        setErrorMsg(result.message);
      }
    };

    triggerVerification();
  }, [token, verifyEmail]);

  return (
    <AuthCard title="Email Verification" subtitle="Activating your InternLink student profile">
      {verifying ? (
        <div className={styles.verifyingContainer}>
          <Loader size={30} />
          <p className={styles.verifyingText}>
            Verifying token credentials with our database...
          </p>
        </div>
      ) : verified ? (
        <div className={styles.successContainer}>
          <div className={styles.successIcon}>
            ✓
          </div>
          <h4 className={styles.successTitle}>Account Activated!</h4>
          <p className={styles.successText}>
            Your email has been verified successfully. You can now access your feed, build your network, and apply for jobs.
          </p>
          <Link to="/login" className={`btn btn-primary ${styles.actionBtn}`}>
            Continue to Login
          </Link>
        </div>
      ) : (
        <div className={styles.errorContainer}>
          <div className={styles.errorIcon}>
            !
          </div>
          <h4 className={styles.errorTitle}>
            Verification Failed
          </h4>
          <p className={styles.errorText}>
            {errorMsg || 'The verification link is invalid or has expired.'}
          </p>
          <Link to="/login" className={`btn btn-secondary ${styles.actionBtn}`}>
            Back to Login
          </Link>
        </div>
      )}
    </AuthCard>
  );
};

export default VerifyEmail;