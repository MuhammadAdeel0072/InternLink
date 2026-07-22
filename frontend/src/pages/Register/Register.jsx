import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AuthCard from '../../components/AuthCard/AuthCard';
import InputField from '../../components/InputField/InputField';
import PasswordStrengthMeter from '../../components/PasswordStrengthMeter/PasswordStrengthMeter';
import OAuthButtons from '../../components/OAuthButtons/OAuthButtons';
import styles from './Register.module.css';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student'
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const tempErrors = {};
    
    if (!formData.name || formData.name.trim().length < 2) {
      tempErrors.name = 'Full name is required (min 2 characters)';
    }
    
    if (!formData.email) {
      tempErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      tempErrors.email = 'Please enter a valid email address';
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!formData.password) {
      tempErrors.password = 'Password is required';
    } else if (!passwordRegex.test(formData.password)) {
      tempErrors.password = 'Password must be 8+ chars with uppercase, lowercase, number, and special character';
    }

    if (!formData.confirmPassword) {
      tempErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      tempErrors.confirmPassword = 'Passwords do not match';
    }

    if (!acceptedTerms) {
      tempErrors.terms = 'You must accept the Terms of Service and Privacy Policy';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setStatusMessage(null);

    try {
      const result = await register(
        formData.name,
        formData.email,
        formData.password,
        formData.role,
        acceptedTerms
      );

      if (result.success) {
        const verificationToken = result.data?.verificationToken;
        
        setStatusMessage({
          type: 'success',
          text: result.message || 'Registration successful! Please check your email to verify your account.'
        });

        setTimeout(() => {
          if (verificationToken) {
            navigate(`/verify-email?token=${verificationToken}&email=${encodeURIComponent(formData.email)}`);
          } else {
            navigate('/verify-email', { 
              state: { email: formData.email } 
            });
          }
        }, 1500);
      } else {
        setStatusMessage({ type: 'error', text: result.message });
      }
    } catch (err) {
      setStatusMessage({ 
        type: 'error', 
        text: err.response?.data?.message || 'Registration failed. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard 
      title="Create Profile" 
      subtitle="Build your professional identity on InternLink"
    >
      {statusMessage && (
        <div className={`${styles.statusMessage} ${statusMessage.type === 'success' ? styles.statusSuccess : styles.statusError}`}>
          {statusMessage.text}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <InputField
          label="Full Name"
          name="name"
          placeholder="Jane Doe"
          value={formData.name}
          onChange={handleChange}
          error={errors.name}
          required
          autoComplete="name"
        />

        <InputField
          label="Email Address"
          name="email"
          type="email"
          placeholder="jane@school.edu"
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
          required
          autoComplete="email"
        />

        <InputField
          label="Join As"
          name="role"
          type="select"
          value={formData.role}
          onChange={handleChange}
          options={[
            { value: 'student', label: 'Student / Job Seeker' },
            { value: 'recruiter', label: 'Recruiter' }
          ]}
          required
        />

        <div className={styles.passwordWrapper}>
          <InputField
            label="Password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Minimum 8 characters"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            required
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className={styles.passwordToggle}
          >
            {showPassword ? '🙈' : '👁️'}
          </button>
        </div>

        {formData.password && (
          <PasswordStrengthMeter password={formData.password} />
        )}

        <div className={styles.passwordWrapper}>
          <InputField
            label="Confirm Password"
            name="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Re-enter password"
            value={formData.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
            required
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className={styles.passwordToggle}
          >
            {showConfirmPassword ? '🙈' : '👁️'}
          </button>
        </div>

        {/* Terms and Privacy Policy Checkbox */}
        <div className={styles.termsContainer}>
          <label className={styles.termsLabel}>
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => {
                setAcceptedTerms(e.target.checked);
                if (errors.terms) {
                  setErrors(prev => ({ ...prev, terms: null }));
                }
              }}
              className={styles.termsCheckbox}
            />
            <span>
              I agree to the{' '}
              <Link to="/terms" className={styles.termsLink}>
                Terms of Service
              </Link>
              {' '}and{' '}
              <Link to="/privacy" className={styles.termsLink}>
                Privacy Policy
              </Link>
            </span>
          </label>
          {errors.terms && (
            <p className={styles.termsError}>
              {errors.terms}
            </p>
          )}
        </div>

        <button
          type="submit"
          className={`btn btn-primary ${styles.submitBtn}`}
          disabled={loading}
        >
          {loading ? (
            <span className={styles.loadingContent}>
              <span className={styles.spinner} />
              Creating account...
            </span>
          ) : (
            'Sign Up'
          )}
        </button>
      </form>

      {/* OAuth Section */}
      <div className={styles.oauthSection}>
        <div className={styles.oauthDivider}>
          <div className={styles.oauthDividerLine} />
          <span className={styles.oauthDividerText}>
            Or continue with
          </span>
          <div className={styles.oauthDividerLine} />
        </div>

        <OAuthButtons />
      </div>

      <p className={styles.loginLink}>
        Already on InternLink?{' '}
        <Link to="/login" className={styles.loginLinkText}>
          Sign In
        </Link>
      </p>
    </AuthCard>
  );
};

export default Register;