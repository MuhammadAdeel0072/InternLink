import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../services/api';
import Loader from '../../../components/Loader/Loader';
import InputField from '../../../components/InputField/InputField';
import styles from './JoinCompany.module.css';
import {
  Search,
  Building2,
  MapPin,
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  ExternalLink,
  ChevronLeft,
} from 'lucide-react';

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

const JoinCompany = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState({});
  const [cancelling, setCancelling] = useState({});
  const [userCompanyStatus, setUserCompanyStatus] = useState(null);

  const fetchUserStatus = useCallback(async () => {
    try {
      const res = await api.get('/recruiter/company-status');
      if (res.data.success) {
        setUserCompanyStatus(res.data.data);
        if (res.data.data.hasCompany && res.data.data.status === 'approved') {
          navigate('/recruiter/dashboard', { replace: true });
        }
      }
    } catch (err) {
      console.error('Failed to load company status:', err);
    }
  }, [navigate]);

  useEffect(() => {
    fetchUserStatus();
  }, [fetchUserStatus]);

  useEffect(() => {
    const delayedSearch = setTimeout(async () => {
      if (searchQuery.trim().length < 2) {
        setCompanies([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await api.get(`/companies/search?q=${encodeURIComponent(searchQuery.trim())}`);
        if (res.data.success) {
          setCompanies(res.data.data);
        }
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchQuery]);

  const handleJoin = async (companyId) => {
    try {
      setJoining((prev) => ({ ...prev, [companyId]: true }));
      const res = await api.post(`/companies/${companyId}/join`);
      if (res.data.success) {
        setUserCompanyStatus({
          hasCompany: true,
          company: res.data.data,
          status: 'pending',
        });
        navigate('/recruiter/dashboard', { replace: true });
      }
    } catch (err) {
      console.error('Join company failed:', err);
    } finally {
      setJoining((prev) => ({ ...prev, [companyId]: false }));
    }
  };

  const handleCancel = async (companyId) => {
    try {
      setCancelling((prev) => ({ ...prev, [companyId]: true }));
      const res = await api.delete(`/companies/${companyId}/join`);
      if (res.data.success) {
        setUserCompanyStatus((prev) => ({ ...prev, status: null }));
        setCompanies((prev) =>
          prev.map((c) =>
            c._id === companyId ? { ...c, userStatus: null } : c
          )
        );
      }
    } catch (err) {
      console.error('Cancel join request failed:', err);
    } finally {
      setCancelling((prev) => ({ ...prev, [companyId]: false }));
    }
  };

  const getStatusBadge = (company) => {
    if (userCompanyStatus?.company?._id === company._id) {
      const status = userCompanyStatus.status;
      if (status === 'pending') {
        return (
          <span className={`${styles.badge} ${styles.badgePending}`}>
            <Clock size={14} />
            Pending Approval
          </span>
        );
      }
      if (status === 'approved') {
        return (
          <span className={`${styles.badge} ${styles.badgeApproved}`}>
            <CheckCircle2 size={14} />
            Approved
          </span>
        );
      }
      if (status === 'rejected') {
        return (
          <span className={`${styles.badge} ${styles.badgeRejected}`}>
            <XCircle size={14} />
            Rejected
          </span>
        );
      }
    }
    return null;
  };

  const getActionButton = (company) => {
    const companyStatus = userCompanyStatus?.company?._id === company._id
      ? userCompanyStatus.status
      : company.userStatus;

    if (companyStatus === 'pending') {
      return (
        <button
          className={styles.secondaryButton}
          onClick={() => handleCancel(company._id)}
          disabled={cancelling[company._id]}
        >
          {cancelling[company._id] ? 'Cancelling...' : 'Cancel Request'}
        </button>
      );
    }

    if (companyStatus === 'approved') {
      return (
        <button className={styles.approvedButton} disabled>
          <CheckCircle2 size={16} />
          Joined
        </button>
      );
    }

    return (
      <button
        className={styles.primaryButton}
        onClick={() => handleJoin(company._id)}
        disabled={joining[company._id]}
      >
        {joining[company._id] ? 'Joining...' : 'Join Company'}
      </button>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate('/recruiter/company-association')}>
          <ChevronLeft size={20} />
          Back
        </button>
        <h1 className={styles.title}>Join Existing Company</h1>
        <p className={styles.subtitle}>Search for your company and request to join.</p>
      </div>

      <div className={styles.searchContainer}>
        <div className={styles.searchWrapper}>
          <Search size={20} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search companies by name or industry..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      {loading && (
        <div className={styles.loadingContainer}>
          <Loader fullPage />
        </div>
      )}

      {!loading && searchQuery.trim().length >= 2 && companies.length === 0 && (
        <div className={styles.emptyState}>
          <Building2 size={48} />
          <p>No companies found. Try a different search term.</p>
        </div>
      )}

      {!loading && companies.length > 0 && (
        <div className={styles.companiesGrid}>
          {companies.map((company) => (
            <div key={company._id} className={styles.companyCard}>
              <div className={styles.companyHeader}>
                <div className={styles.logoContainer}>
                  {company.logo ? (
                    <img src={company.logo} alt={company.companyName} className={styles.logo} />
                  ) : (
                    <div className={styles.logoPlaceholder}>
                      <Building2 size={32} />
                    </div>
                  )}
                </div>
                <div className={styles.companyInfo}>
                  <div className={styles.companyNameRow}>
                    <h3 className={styles.companyName}>{company.companyName}</h3>
                    {company.verificationStatus === 'verified' && (
                      <span className={styles.verifiedBadge} title="Verified Company">
                        <CheckCircle2 size={16} />
                      </span>
                    )}
                  </div>
                  <p className={styles.industry}>{company.industry}</p>
                  {company.headquarters?.city || company.headquarters?.country ? (
                    <p className={styles.headquarters}>
                      <MapPin size={14} />
                      {[company.headquarters?.city, company.headquarters?.state, company.headquarters?.country]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  ) : null}
                  <p className={styles.companySize}>
                    <Users size={14} />
                    {company.companySize}
                  </p>
                </div>
              </div>
              <div className={styles.companyActions}>
                {getStatusBadge(company)}
                {getActionButton(company)}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && searchQuery.trim().length < 2 && (
        <div className={styles.emptyState}>
          <Search size={48} />
          <p>Type at least 2 characters to search for companies.</p>
        </div>
      )}
    </div>
  );
};

export default JoinCompany;
