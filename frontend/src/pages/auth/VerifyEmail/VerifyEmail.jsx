import React, { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import AuthCard from '../../../components/AuthCard/AuthCard';
import Loader from '../../../components/Loader/Loader';
import PrimaryButton from '../../../components/primaryButton/primaryButton';
import InputField from '../../../components/InputField/InputField';
import styles from './VerifyEmail.module.css';
import { Mail, RefreshCw, CheckCircle, AlertCircle, Clock } from 'lucide-react';

const VerifyEmail = () => {
  const { verifyEmail, resendVerification } = useAuth();
  const { token: pathToken } = useParams();
  const location = useLocation();
  const stateEmail = location.state?.email;

  const token = pathToken;

  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [errorType, setErrorType] = useState('');
  const [resendEmail, setResendEmail] = useState(stateEmail || '');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [resendError, setResendError] = useState('');
  const [showResendForm, setShowResendForm] = useState(false);

  useEffect(() => {
    document.title = 'Verify Email - InternLink';
  }, []);

  useEffect(() => {
    const triggerVerification = async () => {
      if (!token) {
        setVerifying(false);
        setErrorMsg('');
        setErrorType('');
        return;
      }

      try {
        const result = await verifyEmail(token);
        setVerifying(false);
        if (result.success) {
          setVerified(true);
        } else {
          setErrorMsg(result.message);
          if (result.message?.toLowerCase().includes('expired')) {
            setErrorType('expired');
          } else {
            setErrorType('invalid');
          }
        }
      } catch (err) {
        setVerifying(false);
        setErrorMsg('Verification failed. Please try again.');
        setErrorType('invalid');
      }
    };

    triggerVerification();
  }, [token, verifyEmail]);

  const handleResend = async (e) => {
    e.preventDefault();
    if (!resendEmail.trim()) return;

    setResendLoading(true);
    setResendMessage('');
    setResendError('');

    try {
      const result = await resendVerification(resendEmail);
      if (result.success) {
        setResendMessage('Verification email sent! Please check your inbox.');
        setShowResendForm(false);
      } else {
        setResendError(result.message);
      }
    } catch (err) {
      setResendError('Failed to send verification email. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  if (verifying) {
    return (
      <AuthCard title="Email Verification" subtitle="Activating your InternLink account">
        <div className={styles.verifyingContainer}>
          <Loader size={32} />
          <p className={styles.verifyingText}>
            Verifying your email address...
          </p>
        </div>
      </AuthCard>
    );
  }

  if (verified) {
    return (
      <AuthCard title="Email Verified" subtitle="Your account has been activated">
        <div className={styles.successContainer}>
          <div className={styles.successIcon}>
            <CheckCircle size={48} />
          </div>
          <h3 className={styles.successTitle}>Email Verified Successfully</h3>
          <p className={styles.successText}>
            Your email has been verified. You can now log in and access all features of InternLink.
          </p>
          <Link to="/login" className={`btn btn-primary ${styles.actionBtn}`}>
            Continue to Login
          </Link>
        </div>
      </AuthCard>
    );
  }

  if (!token) {
    return (
      <AuthCard title="Verify Your Email" subtitle="Enter your email to resend verification">
        <div className={styles.resendContainer}>
          {resendError && (
            <div className={`${styles.messageBox} ${styles.errorBox}`}>
              {resendError}
            </div>
          )}
          {resendMessage && (
            <div className={`${styles.messageBox} ${styles.successBox}`}>
              {resendMessage}
            </div>
          )}
          {!showResendForm ? (
            <>
              <div className={styles.iconWrapper}>
                <Mail size={40} className={styles.icon} />
              </div>
              <p className={styles.resendText}>
                Please verify your email address to continue using InternLink.
              </p>
              <PrimaryButton
                onClick={() => setShowResendForm(true)}
                fullWidth
              >
                <RefreshCw size={18} />
                Resend Verification Email
              </PrimaryButton>
              <Link to="/login" className={styles.backLink}>
                Back to Login
              </Link>
            </>
          ) : (
            <form onSubmit={handleResend}>
              <InputField
                label="Email Address"
                name="email"
                type="email"
                placeholder="you@school.edu"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                required
                autoComplete="email"
                disabled={resendLoading}
              />
              <div className={styles.submitWrapper}>
                <PrimaryButton
                  type="submit"
                  loading={resendLoading}
                  disabled={resendLoading}
                  fullWidth
                >
                  {resendLoading ? 'Sending...' : 'Send Verification Email'}
                </PrimaryButton>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowResendForm(false);
                  setResendError('');
                  setResendMessage('');
                }}
                className={styles.cancelBtn}
              >
                Cancel
              </button>
            </form>
          )}
        </div>
      </AuthCard>
    );
  }

  if (errorMsg) {
    const isExpired = errorType === 'expired';
    return (
      <AuthCard
        title={isExpired ? 'Link Expired' : 'Verification Failed'}
        subtitle={isExpired ? 'This verification link has expired' : 'The verification link is not valid'}
      >
        <div className={styles.errorContainer}>
          <div className={styles.errorIcon}>
            {isExpired ? <Clock size={48} /> : <AlertCircle size={48} />}
          </div>
          <h3 className={styles.errorTitle}>
            {isExpired ? 'Verification Link Expired' : 'Invalid Verification Link'}
          </h3>
          <p className={styles.errorText}>
            {isExpired
              ? 'This verification link has expired after 30 minutes. Please request a new one.'
              : errorMsg || 'This verification link is invalid or has already been used. Please request a new one.'}
          </p>
          {!showResendForm ? (
            <>
              <PrimaryButton
                onClick={() => setShowResendForm(true)}
                fullWidth
              >
                <RefreshCw size={18} />
                Resend Verification Email
              </PrimaryButton>
              <Link to="/login" className={styles.backLink}>
                Back to Login
              </Link>
            </>
          ) : (
            <form onSubmit={handleResend}>
              <InputField
                label="Email Address"
                name="email"
                type="email"
                placeholder="you@school.edu"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                required
                autoComplete="email"
                disabled={resendLoading}
              />
              <div className={styles.submitWrapper}>
                <PrimaryButton
                  type="submit"
                  loading={resendLoading}
                  disabled={resendLoading}
                  fullWidth
                >
                  {resendLoading ? 'Sending...' : 'Send Verification Email'}
                </PrimaryButton>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowResendForm(false);
                  setResendError('');
                  setResendMessage('');
                }}
                className={styles.cancelBtn}
              >
                Cancel
              </button>
            </form>
          )}
        </div>
      </AuthCard>
    );
  }

  return null;
};

export default VerifyEmail;
