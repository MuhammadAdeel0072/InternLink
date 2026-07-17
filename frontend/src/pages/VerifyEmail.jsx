import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthCard from '../components/AuthCard';
import Loader from '../components/Loader';

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
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Loader size={30} />
          <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>
            Verifying token credentials with our database...
          </p>
        </div>
      ) : verified ? (
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              backgroundColor: 'var(--success-light)',
              color: 'var(--success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              fontSize: '1.75rem',
              fontWeight: 'bold'
            }}
          >
            ✓
          </div>
          <h4 style={{ fontSize: '1.25rem', marginBottom: '12px' }}>Account Activated!</h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
            Your email has been verified successfully. You can now access your feed, build your network, and apply for jobs.
          </p>
          <Link to="/login" className="btn btn-primary" style={{ display: 'inline-flex', width: '100%' }}>
            Continue to Login
          </Link>
        </div>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              backgroundColor: 'var(--danger-light)',
              color: 'var(--danger)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              fontSize: '1.75rem',
              fontWeight: 'bold'
            }}
          >
            !
          </div>
          <h4 style={{ fontSize: '1.25rem', marginBottom: '12px', color: 'var(--danger)' }}>
            Verification Failed
          </h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
            {errorMsg || 'The verification link is invalid or has expired.'}
          </p>
          <Link to="/login" className="btn btn-secondary" style={{ display: 'inline-flex', width: '100%' }}>
            Back to Login
          </Link>
        </div>
      )}
    </AuthCard>
  );
};

export default VerifyEmail;
