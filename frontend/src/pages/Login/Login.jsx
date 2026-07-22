import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AuthCard from '../../components/AuthCard/AuthCard';
import InputField from '../../components/InputField/InputField';
import PasswordInput from '../../components/passwordInput/passwordInput';
import PrimaryButton from '../../components/primaryButton/primaryButton';
import Checkbox from '../../components/checkbox/checkbox';
import OAuthButtons from '../../components/OAuthButtons/OAuthButtons';
import AuthDivider from '../../components/AuthDivider/AuthDivider';
import AuthFooter from '../../components/AuthFooter/AuthFooter';
import Toast from '../../components/Toast/Toast';
import styles from './Login.module.css';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [unverifiedEmail, setUnverifiedEmail] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear field error on change
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const tempErrors = {};
    
    // Email validation
    if (!formData.email.trim()) {
      tempErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      tempErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      tempErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      tempErrors.password = 'Password must be at least 8 characters';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);

    try {
      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        showToast('Welcome back! Login successful.', 'success');
        
        // Store remember me preference
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', formData.email);
        } else {
          localStorage.removeItem('rememberedEmail');
        }
        
        // Short delay to show toast before navigation
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 800);
      } else {
        // Handle specific error cases
        if (result.message?.toLowerCase().includes('verify')) {
          setUnverifiedEmail(formData.email);
          showToast('Please verify your email before logging in.', 'warning');
        } else if (result.message?.toLowerCase().includes('invalid')) {
          showToast('Invalid email or password. Please try again.', 'error');
        } else if (result.message?.toLowerCase().includes('not found')) {
          showToast('No account found with this email.', 'error');
        } else {
          showToast(result.message || 'Login failed. Please try again.', 'error');
        }
      }
    } catch (error) {
      if (error.response?.status === 429) {
        showToast('Too many attempts. Please try again later.', 'error');
      } else if (error.response?.status === 500) {
        showToast('Server error. Please try again later.', 'error');
      } else if (!error.response) {
        showToast('Network error. Please check your connection.', 'error');
      } else {
        showToast(
          error.response?.data?.message || 'Login failed. Please try again.',
          'error'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Load remembered email on mount
  React.useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setFormData(prev => ({ ...prev, email: rememberedEmail }));
      setRememberMe(true);
    }
  }, []);

  return (
    <>
      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.visible}
        onClose={() => setToast({ ...toast, visible: false })}
      />

      <AuthCard 
        title="Welcome Back" 
        subtitle="Log in to your InternLink account"
      >
        <form onSubmit={handleSubmit} noValidate>
          {/* Email Field */}
          <InputField
            label="Email Address"
            name="email"
            type="email"
            placeholder="you@school.edu"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            required
            autoComplete="email"
            disabled={loading}
          />

          {/* Password Field */}
          <PasswordInput
            label="Password"
            name="password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            required
            autoComplete="current-password"
            disabled={loading}
          />

          {/* Remember Me & Forgot Password Row */}
          <div className={styles.rememberRow}>
            <Checkbox
              label="Remember me"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              name="rememberMe"
              disabled={loading}
            />
            
            <Link
              to="/forgot-password"
              className={styles.forgotPasswordLink}
            >
              Forgot Password?
            </Link>
          </div>

          {/* Unverified Email Notice */}
          {unverifiedEmail && (
            <div className={styles.unverifiedNotice}>
              <p className={styles.unverifiedText}>
                Email not verified.{' '}
                <Link
                  to="/verify-email"
                  state={{ email: unverifiedEmail }}
                  className={styles.resendLink}
                >
                  Resend verification email
                </Link>
              </p>
            </div>
          )}

          {/* Login Button */}
          <div className={styles.loginButtonWrapper}>
            <PrimaryButton
              type="submit"
              loading={loading}
              disabled={loading}
            >
              Sign In
            </PrimaryButton>
          </div>
        </form>

        {/* OAuth Section */}
        <AuthDivider text="or continue with" />
        
        <OAuthButtons mode="login" />

        {/* Footer */}
        <AuthFooter
          text="Don't have an account?"
          linkText="Create Account"
          linkTo="/register"
        />
      </AuthCard>
    </>
  );
};

export default Login;