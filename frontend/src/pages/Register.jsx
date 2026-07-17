import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthCard from '../components/AuthCard';
import InputField from '../components/InputField';
import PasswordStrengthMeter from '../components/PasswordStrengthMeter';
import OAuthButtons from '../components/OAuthButtons';

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
    // Clear error for this field
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
      acceptedTerms  // ✅ Pass acceptedTerms
    );

    if (result.success) {
      // ✅ Get the verificationToken from the real API response
      const verificationToken = result.data?.verificationToken;
      
      setStatusMessage({
        type: 'success',
        text: result.message || 'Registration successful! Please check your email to verify your account.'
      });

      // Navigate to verify-email page
      setTimeout(() => {
        if (verificationToken) {
          // Auto-verify by passing token in URL
          navigate(`/verify-email?token=${verificationToken}&email=${encodeURIComponent(formData.email)}`);
        } else {
          // Show "check email" message
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
        <div
          style={{
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '0.875rem',
            fontWeight: 500,
            textAlign: 'center',
            backgroundColor: statusMessage.type === 'success' 
              ? 'rgba(34, 197, 94, 0.1)' 
              : 'rgba(239, 68, 68, 0.1)',
            color: statusMessage.type === 'success' 
              ? '#16a34a' 
              : '#dc2626',
            border: `1px solid ${statusMessage.type === 'success' ? '#16a34a' : '#dc2626'}20`,
          }}
        >
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

        <div style={{ position: 'relative' }}>
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
            style={{
              position: 'absolute',
              right: '12px',
              top: '42px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              fontSize: '0.875rem',
            }}
          >
            {showPassword ? '🙈' : '👁️'}
          </button>
        </div>

        {formData.password && (
          <PasswordStrengthMeter password={formData.password} />
        )}

        <div style={{ position: 'relative' }}>
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
            style={{
              position: 'absolute',
              right: '12px',
              top: '42px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              fontSize: '0.875rem',
            }}
          >
            {showConfirmPassword ? '🙈' : '👁️'}
          </button>
        </div>

        {/* Terms and Privacy Policy Checkbox */}
        <div style={{ margin: '20px 0' }}>
          <label style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            cursor: 'pointer',
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
          }}>
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => {
                setAcceptedTerms(e.target.checked);
                if (errors.terms) {
                  setErrors(prev => ({ ...prev, terms: null }));
                }
              }}
              style={{
                marginTop: '2px',
                width: '18px',
                height: '18px',
                cursor: 'pointer',
                accentColor: 'var(--primary)',
              }}
            />
            <span>
              I agree to the{' '}
              <Link to="/terms" style={{ color: 'var(--primary)', fontWeight: 600 }}>
                Terms of Service
              </Link>
              {' '}and{' '}
              <Link to="/privacy" style={{ color: 'var(--primary)', fontWeight: 600 }}>
                Privacy Policy
              </Link>
            </span>
          </label>
          {errors.terms && (
            <p style={{ 
              color: '#dc2626', 
              fontSize: '0.8rem', 
              marginTop: '6px',
              marginLeft: '28px' 
            }}>
              {errors.terms}
            </p>
          )}
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
          style={{ 
            width: '100%', 
            marginTop: '12px', 
            height: '48px',
            fontSize: '1rem',
            fontWeight: 600,
          }}
        >
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <span className="spinner" style={{
                width: '16px',
                height: '16px',
                border: '2px solid rgba(255,255,255,0.3)',
                borderTop: '2px solid white',
                borderRadius: '50%',
                animation: 'spin 0.6s linear infinite',
              }} />
              Creating account...
            </span>
          ) : (
            'Sign Up'
          )}
        </button>
      </form>

      {/* OAuth Section */}
      <div style={{ marginTop: '24px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '20px',
        }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }} />
          <span style={{ 
            fontSize: '0.8rem', 
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            fontWeight: 600,
          }}>
            Or continue with
          </span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }} />
        </div>

        <OAuthButtons />
      </div>

      <p
        style={{
          marginTop: '24px',
          textAlign: 'center',
          fontSize: '0.875rem',
          color: 'var(--text-secondary)'
        }}
      >
        Already on InternLink?{' '}
        <Link 
          to="/login" 
          style={{ 
            color: 'var(--primary)', 
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Sign In
        </Link>
      </p>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </AuthCard>
  );
};

export default Register;