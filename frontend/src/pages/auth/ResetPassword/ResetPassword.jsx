import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import AuthCard from '../../../components/AuthCard/AuthCard';
import InputField from '../../../components/InputField/InputField';
import PasswordInput from '../../../components/passwordInput/passwordInput';
import PrimaryButton from '../../../components/primaryButton/primaryButton';
import Loader from '../../../components/Loader/Loader';
import PasswordStrengthMeter from '../../../components/PasswordStrengthMeter/PasswordStrengthMeter';
import styles from './ResetPassword.module.css';
import { Lock, CheckCircle, AlertCircle } from 'lucide-react';

const ResetPassword = () => {
  const { resetPassword, validateResetToken } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    document.title = 'Reset Password - InternLink';
  }, []);

  useEffect(() => {
    const checkToken = async () => {
      if (!token) {
        setValidating(false);
        setErrorMsg('Reset token is missing. Please use the link from your email.');
        return;
      }

      try {
        const result = await validateResetToken(token);
        if (result.success) {
          setTokenValid(true);
        } else {
          setErrorMsg(result.message);
        }
      } catch (err) {
        setErrorMsg('Unable to validate reset token. Please try again.');
      } finally {
        setValidating(false);
      }
    };

    checkToken();
  }, [token, validateResetToken]);

  const validateForm = () => {
    const tempErrors = {};

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!password) {
      tempErrors.password = 'Password is required';
    } else if (!passwordRegex.test(password)) {
      tempErrors.password = 'Password must be 8+ chars with uppercase, lowercase, number, and special character';
    }

    if (!confirmPassword) {
      tempErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      tempErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setErrorMsg('');

    try {
      const result = await resetPassword(token, password);
      if (result.success) {
        setSubmitted(true);
        navigate('/login');
      } else {
        setErrorMsg(result.message);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <AuthCard title="Reset Password" subtitle="Validating your reset link">
        <div className={styles.validatingContainer}>
          <Loader size={32} />
          <p className={styles.validatingText}>Validating reset token...</p>
        </div>
      </AuthCard>
    );
  }

  if (submitted) {
    return (
      <AuthCard title="Password Changed" subtitle="Your password has been reset">
        <div className={styles.successContainer}>
          <div className={styles.successIcon}>
            <CheckCircle size={48} />
          </div>
          <h3 className={styles.successTitle}>Password Changed Successfully</h3>
          <p className={styles.successText}>
            Your password has been reset. You will be redirected to the login page shortly.
          </p>
          <Link to="/login" className={`btn btn-primary ${styles.actionBtn}`}>
            Go to Login
          </Link>
        </div>
      </AuthCard>
    );
  }

  if (!tokenValid) {
    return (
      <AuthCard title="Invalid Link" subtitle="This password reset link is not valid">
        <div className={styles.errorContainer}>
          <div className={styles.errorIcon}>
            <AlertCircle size={48} />
          </div>
          <h3 className={styles.errorTitle}>Invalid or Expired Link</h3>
          <p className={styles.errorText}>
            {errorMsg || 'This password reset link is invalid or has expired. Please request a new one.'}
          </p>
          <Link to="/forgot-password" className={`btn btn-primary ${styles.actionBtn}`}>
            Request New Link
          </Link>
          <Link to="/login" className={styles.backLink}>
            Back to Login
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Create New Password" subtitle="Enter your new password below">
      {errorMsg && (
        <div className={styles.messageBox}>
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className={styles.passwordIconWrapper}>
          <Lock size={20} className={styles.passwordIcon} />
        </div>

        <PasswordInput
          label="New Password"
          name="password"
          placeholder="Enter new password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          required
          autoComplete="new-password"
          disabled={loading}
        />

        <div className={styles.strengthMeterWrapper}>
          {password && <PasswordStrengthMeter password={password} />}
        </div>

        <PasswordInput
          label="Confirm Password"
          name="confirmPassword"
          placeholder="Re-enter new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={errors.confirmPassword}
          required
          autoComplete="new-password"
          disabled={loading}
        />

        <div className={styles.requirements}>
          <p className={styles.requirementsTitle}>Password must contain:</p>
          <ul className={styles.requirementsList}>
            <li className={password.length >= 8 ? styles.requirementMet : styles.requirementUnmet}>
              At least 8 characters
            </li>
            <li className={/[A-Z]/.test(password) ? styles.requirementMet : styles.requirementUnmet}>
              One uppercase letter
            </li>
            <li className={/[a-z]/.test(password) ? styles.requirementMet : styles.requirementUnmet}>
              One lowercase letter
            </li>
            <li className={/\d/.test(password) ? styles.requirementMet : styles.requirementUnmet}>
              One number
            </li>
            <li className={/[@$!%*?&]/.test(password) ? styles.requirementMet : styles.requirementUnmet}>
              One special character (@$!%*?&)
            </li>
          </ul>
        </div>

        <div className={styles.submitWrapper}>
          <PrimaryButton
            type="submit"
            loading={loading}
            disabled={loading || !password || !confirmPassword}
            fullWidth
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </PrimaryButton>
        </div>

        <div className={styles.backToLogin}>
          <Link to="/login" className={styles.backLink}>
            Back to Login
          </Link>
        </div>
      </form>
    </AuthCard>
  );
};

export default ResetPassword;
