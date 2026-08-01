import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../services/api';
import Loader from '../../../components/Loader/Loader';
import styles from './CompanyAssociation.module.css';
import { Building2, Users, CheckCircle2 } from 'lucide-react';

const INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Education',
  'Finance',
  'Retail',
  'Manufacturing',
  'Government',
  'Telecommunications',
  'Consulting',
  'Construction',
  'Media',
  'Transportation',
  'Energy',
  'Agriculture',
  'Hospitality',
];

const COMPANY_SIZES = [
  { value: '1-10', label: '1–10' },
  { value: '11-50', label: '11–50' },
  { value: '51-200', label: '51–200' },
  { value: '201-500', label: '201–500' },
  { value: '501-1000', label: '501–1000' },
  { value: '1001-5000', label: '1001–5000' },
  { value: '5000+', label: '5000+' },
];

const BENEFITS_OPTIONS = [
  'Remote',
  'Hybrid',
  'Flexible Hours',
  'Health Insurance',
  'Learning Budget',
  'Paid Leave',
  'Stock Options',
];

const CompanyAssociation = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const res = await api.get('/recruiter/company-status');
      if (res.data.success && res.data.data.hasCompany && res.data.data.status === 'approved') {
        navigate('/recruiter/dashboard', { replace: true });
      }
    } catch (err) {
      console.error('Failed to load company status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader fullPage />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.progressIndicator}>
        <div className={`${styles.step} ${styles.completed}`}>
          <div className={styles.stepIcon}>
            <CheckCircle2 size={20} />
          </div>
          <span className={styles.stepLabel}>Account</span>
        </div>
        <div className={styles.stepLine} />
        <div className={`${styles.step} ${styles.completed}`}>
          <div className={styles.stepIcon}>
            <CheckCircle2 size={20} />
          </div>
          <span className={styles.stepLabel}>Recruiter Profile</span>
        </div>
        <div className={styles.stepLine} />
        <div className={`${styles.step} ${styles.active}`}>
          <div className={styles.stepIcon}>
            <div className={styles.activeDot} />
          </div>
          <span className={styles.stepLabel}>Company Association</span>
        </div>
        <div className={styles.stepLine} />
        <div className={styles.step}>
          <div className={styles.stepIcon}>
            <div className={styles.inactiveDot} />
          </div>
          <span className={styles.stepLabel}>Dashboard</span>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.header}>
          <h1 className={styles.title}>Associate with a Company</h1>
          <p className={styles.subtitle}>
            Connect your recruiter account with a company to start posting jobs and finding candidates.
          </p>
        </div>

        <div className={styles.cardsContainer}>
          <div className={styles.optionCard} onClick={() => navigate('/recruiter/company/join')}>
            <div className={styles.cardIcon}>
              <Building2 size={48} />
            </div>
            <h2 className={styles.cardTitle}>Join Existing Company</h2>
            <p className={styles.cardDescription}>
              Already work for a registered company? Search and request to join your organization.
            </p>
            <button className={styles.primaryButton}>Continue</button>
          </div>

          <div className={styles.optionCard} onClick={() => navigate('/recruiter/company/create')}>
            <div className={styles.cardIcon}>
              <Users size={48} />
            </div>
            <h2 className={styles.cardTitle}>Create New Company</h2>
            <p className={styles.cardDescription}>
              My company is not listed. Create a new company profile and become the first recruiter.
            </p>
            <button className={styles.primaryButton}>Create Company</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyAssociation;
