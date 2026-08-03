import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import AuthCard from '../../../components/AuthCard/AuthCard';
import InputField from '../../../components/InputField/InputField';
import PrimaryButton from '../../../components/primaryButton/primaryButton';
import Loader from '../../../components/Loader/Loader';
import styles from './ForgotPassword.module.css';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';

const ForgotPassword = () => {
  const { forgotPassword } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);

  useEffect(() => {
    document.title = 'Forgot Password - InternLink';
  }, []);

  const validateForm = () => {
    const tempErrors = {};
    if (!email.trim()) {
      tempErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      tempErrors.email = 'Please enter a valid email address';
    }
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    if (errors.email) {
      if (!value.trim()) {
        setErrors({ email: 'Email is required' });
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        setErrors({ email: 'Please enter a valid email address' });
      } else {
        setErrors({});
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setErrorMsg('');
    setNeedsVerification(false);

    try {
      const result = await forgotPassword(email);
      if (result.success) {
        setSubmitted(true);
      } else {
        if (result.needsVerification) {
          setNeedsVerification(true);
        }
        setErrorMsg(result.message);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard title="Reset Password" subtitle="We'll send you a link to reset your password">
      {submitted ? (
        <div className={styles.successContainer}>
          <div className={styles.successIcon}>
            <CheckCircle size={48} />
          </div>
          <h3 className={styles.successTitle}>Check Your Email</h3>
          <p className={styles.successText}>
            We've sent a password reset link to <strong>{email}</strong>. Please check your inbox and follow the instructions to reset your password.
          </p>
          <p className={styles.successSubtext}>
            Didn't receive the email? Check your spam folder or try again.
          </p>
          <Link to="/login" className={`btn btn-primary ${styles.actionBtn}`}>
            Back to Login
          </Link>
        </div>
      ) : (
        <>
          {errorMsg && (
            <div className={`${styles.messageBox} ${needsVerification ? styles.warningBox : styles.errorBox}`}>
              <p>{errorMsg}</p>
              {needsVerification && (
                <Link to="/verify-email" state={{ email }} className={styles.resendLink}>
                  Verify your email first
                </Link>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className={styles.emailIconWrapper}>
              <Mail size={20} className={styles.emailIcon} />
            </div>
            <InputField
              label="Email Address"
              name="email"
              type="email"
              placeholder="you@school.edu"
              value={email}
              onChange={handleEmailChange}
              error={errors.email}
              required
              autoComplete="email"
              disabled={loading}
            />

            <div className={styles.submitWrapper}>
              <PrimaryButton
                type="submit"
                loading={loading}
                disabled={loading}
                fullWidth
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </PrimaryButton>
            </div>

            <div className={styles.backToLogin}>
              <Link to="/login" className={styles.backLink}>
                <ArrowLeft size={16} />
                Back to Login
              </Link>
            </div>
          </form>
        </>
      )}
    </AuthCard>
  );
};

export default ForgotPassword;
