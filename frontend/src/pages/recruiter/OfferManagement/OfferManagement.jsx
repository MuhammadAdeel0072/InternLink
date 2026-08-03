import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../services/api';
import Modal from '../../../components/Modal/Modal';
import StatusBadge from '../../../components/StatusBadge/StatusBadge';
import PrimaryButton from '../../../components/primaryButton/primaryButton';
import Toast from '../../../components/Toast/Toast';
import styles from './OfferManagement.module.css';
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  Plus,
  Download,
  Send,
  XCircle,
  RefreshCw,
  Copy,
  Trash2,
  FileText,
  MoreVertical,
  TrendingUp,
  BarChart3,
  DollarSign,
  Users,
  CheckCircle2,
  XCircle as XCircleIcon,
  Clock,
  AlertTriangle
} from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'viewed', label: 'Viewed' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'withdrawn', label: 'Withdrawn' },
  { value: 'expired', label: 'Expired' }
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'expiry-asc', label: 'Expiry (Ascending)' },
  { value: 'expiry-desc', label: 'Expiry (Descending)' },
  { value: 'salary-asc', label: 'Salary (Low to High)' },
  { value: 'salary-desc', label: 'Salary (High to Low)' }
];

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const CURRENCY_OPTIONS = ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD'];

const BENEFITS_LIST = [
  'Health Insurance',
  'Dental Insurance',
  'Vision Insurance',
  'Paid Leave',
  'Flexible Hours',
  'Remote Work',
  'Laptop',
  'Learning Budget',
  'Gym Membership',
  'Relocation Support',
  'Employee Discounts'
];

const OfferManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [offers, setOffers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 10 });
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    jobId: 'all',
    companyId: 'all',
    department: '',
    date: '',
    sort: 'newest'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [toast, setToast] = useState({ message: '', type: 'success', isVisible: false });
  const [searchInput, setSearchInput] = useState('');
  const [saving, setSaving] = useState(false);
  const searchTimeoutRef = useRef(null);

  const [createForm, setCreateForm] = useState({
    applicationId: '',
    interviewId: '',
    jobId: '',
    candidateId: '',
    companyId: '',
    baseSalary: '',
    currency: 'USD',
    bonus: '',
    signingBonus: '',
    stockOptions: '',
    performanceBonus: '',
    annualBonus: '',
    travelAllowance: '',
    medicalAllowance: '',
    housingAllowance: '',
    internetAllowance: '',
    other: '',
    benefits: [],
    customBenefits: [],
    joiningDate: '',
    reportingTime: '09:00 AM',
    officeLocation: '',
    manager: '',
    team: '',
    expiryDate: '',
    template: 'default'
  });

  const [withdrawReason, setWithdrawReason] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    fetchJobs();
    fetchApplications();
  }, []);

  useEffect(() => {
    fetchOffers();
    fetchAnalytics();
  }, [filters, pagination.page, pagination.limit]);

  const fetchJobs = async () => {
    try {
      const res = await api.get('/recruiter/jobs?limit=100');
      if (res.data.success) {
        setJobs(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
    }
  };

  const fetchApplications = async () => {
    try {
      const res = await api.get('/applicants?limit=100');
      if (res.data.success) {
        setApplications(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch applications:', err);
    }
  };

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      });

      if (filters.search) params.append('search', filters.search);
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.jobId !== 'all') params.append('jobId', filters.jobId);
      if (filters.companyId !== 'all') params.append('companyId', filters.companyId);
      if (filters.department) params.append('department', filters.department);
      if (filters.date) params.append('date', filters.date);
      if (filters.sort) params.append('sort', filters.sort);

      const res = await api.get(`/offers?${params.toString()}`);
      if (res.data.success) {
        setOffers(res.data.data);
        setPagination(prev => ({ ...prev, ...res.data.pagination }));
      }
    } catch (err) {
      console.error('Failed to fetch offers:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/offers/analytics');
      if (res.data.success) {
        setAnalytics(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: value, page: 1 }));
    }, 300);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleCreateOffer = async () => {
    try {
      setSaving(true);
      const payload = {
        ...createForm,
        baseSalary: parseFloat(createForm.baseSalary) || 0,
        bonus: parseFloat(createForm.bonus) || 0,
        signingBonus: parseFloat(createForm.signingBonus) || 0,
        performanceBonus: parseFloat(createForm.performanceBonus) || 0,
        annualBonus: parseFloat(createForm.annualBonus) || 0,
        travelAllowance: parseFloat(createForm.travelAllowance) || 0,
        medicalAllowance: parseFloat(createForm.medicalAllowance) || 0,
        housingAllowance: parseFloat(createForm.housingAllowance) || 0,
        internetAllowance: parseFloat(createForm.internetAllowance) || 0,
        other: parseFloat(createForm.other) || 0,
        salary: {
          baseSalary: parseFloat(createForm.baseSalary) || 0,
          currency: createForm.currency,
          bonus: parseFloat(createForm.bonus) || 0,
          signingBonus: parseFloat(createForm.signingBonus) || 0,
          stockOptions: createForm.stockOptions
        },
        compensation: {
          performanceBonus: parseFloat(createForm.performanceBonus) || 0,
          annualBonus: parseFloat(createForm.annualBonus) || 0,
          travelAllowance: parseFloat(createForm.travelAllowance) || 0,
          medicalAllowance: parseFloat(createForm.medicalAllowance) || 0,
          housingAllowance: parseFloat(createForm.housingAllowance) || 0,
          internetAllowance: parseFloat(createForm.internetAllowance) || 0,
          other: parseFloat(createForm.other) || 0
        }
      };

      await api.post('/offers', payload);
      setShowCreateModal(false);
      setCreateForm({
        applicationId: '',
        interviewId: '',
        jobId: '',
        candidateId: '',
        companyId: '',
        baseSalary: '',
        currency: 'USD',
        bonus: '',
        signingBonus: '',
        stockOptions: '',
        performanceBonus: '',
        annualBonus: '',
        travelAllowance: '',
        medicalAllowance: '',
        housingAllowance: '',
        internetAllowance: '',
        other: '',
        benefits: [],
        customBenefits: [],
        joiningDate: '',
        reportingTime: '09:00 AM',
        officeLocation: '',
        manager: '',
        team: '',
        expiryDate: '',
        template: 'default'
      });
      showToast('Offer created successfully', 'success');
      fetchOffers();
      fetchAnalytics();
    } catch (err) {
      console.error('Create offer failed:', err);
      showToast(err.response?.data?.message || 'Failed to create offer', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSendOffer = async () => {
    try {
      setSaving(true);
      await api.post(`/offers/${selectedOffer._id}/send`);
      setShowSendModal(false);
      setSelectedOffer(null);
      showToast('Offer sent successfully', 'success');
      fetchOffers();
      fetchAnalytics();
    } catch (err) {
      console.error('Send offer failed:', err);
      showToast(err.response?.data?.message || 'Failed to send offer', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleWithdrawOffer = async () => {
    try {
      setSaving(true);
      await api.post(`/offers/${selectedOffer._id}/withdraw`, { reason: withdrawReason });
      setShowWithdrawModal(false);
      setWithdrawReason('');
      setSelectedOffer(null);
      showToast('Offer withdrawn successfully', 'success');
      fetchOffers();
      fetchAnalytics();
    } catch (err) {
      console.error('Withdraw offer failed:', err);
      showToast(err.response?.data?.message || 'Failed to withdraw offer', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleRejectOffer = async () => {
    try {
      setSaving(true);
      await api.post(`/offers/${selectedOffer._id}/reject`, { reason: rejectReason });
      setShowRejectModal(false);
      setRejectReason('');
      setSelectedOffer(null);
      showToast('Offer rejected successfully', 'success');
      fetchOffers();
      fetchAnalytics();
    } catch (err) {
      console.error('Reject offer failed:', err);
      showToast(err.response?.data?.message || 'Failed to reject offer', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicateOffer = async (offer) => {
    try {
      setSaving(true);
      await api.post(`/offers/${offer._id}/duplicate`);
      showToast('Offer duplicated successfully', 'success');
      fetchOffers();
      fetchAnalytics();
    } catch (err) {
      console.error('Duplicate offer failed:', err);
      showToast(err.response?.data?.message || 'Failed to duplicate offer', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOffer = async (offer) => {
    if (!window.confirm('Are you sure you want to delete this offer? This action cannot be undone.')) {
      return;
    }
    try {
      setSaving(true);
      await api.delete(`/offers/${offer._id}`);
      showToast('Offer deleted successfully', 'success');
      fetchOffers();
      fetchAnalytics();
    } catch (err) {
      console.error('Delete offer failed:', err);
      showToast(err.response?.data?.message || 'Failed to delete offer', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    try {
      const res = await api.get('/offers/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'offers.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      showToast('Export downloaded successfully', 'success');
    } catch (err) {
      console.error('Export failed:', err);
      showToast(err.response?.data?.message || 'Failed to export offers', 'error');
    }
  };

  const handleLimitChange = (e) => {
    const newLimit = parseInt(e.target.value);
    setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }));
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type, isVisible: true });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }));
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const getStatusBadge = (status) => {
    const config = {
      draft: { label: 'Draft', className: 'draft' },
      sent: { label: 'Sent', className: 'sent' },
      viewed: { label: 'Viewed', className: 'viewed' },
      accepted: { label: 'Accepted', className: 'accepted' },
      rejected: { label: 'Rejected', className: 'rejected' },
      negotiation: { label: 'Negotiation', className: 'negotiation' },
      withdrawn: { label: 'Withdrawn', className: 'withdrawn' },
      expired: { label: 'Expired', className: 'expired' }
    };
    return config[status] || config.draft;
  };

  const renderStatsCards = () => {
    if (!analytics) return null;
    const stats = [
      { label: 'Total Offers', value: analytics.totalOffers || 0, color: 'rgba(99, 102, 241, 0.15)', textColor: 'var(--primary)', icon: FileText },
      { label: 'Pending', value: analytics.pendingOffers || 0, color: 'rgba(245, 158, 11, 0.15)', textColor: 'var(--warning)', icon: Clock },
      { label: 'Accepted', value: analytics.acceptedOffers || 0, color: 'rgba(16, 185, 129, 0.15)', textColor: 'var(--success)', icon: CheckCircle2 },
      { label: 'Rejected', value: analytics.rejectedOffers || 0, color: 'rgba(239, 68, 68, 0.15)', textColor: 'var(--danger)', icon: XCircleIcon },
      { label: 'Expired', value: analytics.expiredOffers || 0, color: 'rgba(107, 114, 128, 0.15)', textColor: '#6b7280', icon: AlertTriangle },
      { label: 'Withdrawn', value: analytics.withdrawnOffers || 0, color: 'rgba(139, 92, 246, 0.15)', textColor: '#8b5cf6', icon: XCircleIcon }
    ];

    return (
      <div className={styles.statsGrid}>
        {stats.map((stat, idx) => (
          <div key={idx} className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: stat.color, color: stat.textColor }}>
              <stat.icon size={24} />
            </div>
            <div>
              <div className={styles.statValue}>{stat.value}</div>
              <div className={styles.statLabel}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderOfferCard = (offer) => {
    const statusConfig = getStatusBadge(offer.status);
    const candidate = offer.candidateData || {};
    const job = offer.jobData || {};
    const company = offer.companyData || {};

    return (
      <div key={offer._id} className={styles.offerCard}>
        <div className={styles.offerCardHeader}>
          <div className={styles.candidateInfo}>
            {candidate.avatar ? (
              <img src={candidate.avatar} alt="" className={styles.avatar} />
            ) : (
              <div className={styles.avatarPlaceholder}>{candidate.name?.charAt(0)?.toUpperCase() || '?'}</div>
            )}
            <div>
              <h4 className={styles.candidateName}>{candidate.name || 'Unknown'}</h4>
              <p className={styles.jobTitle}>{job.title || 'Unknown Position'}</p>
            </div>
          </div>
          <StatusBadge status={offer.status} size="sm" />
        </div>

        <div className={styles.offerDetails}>
          <div className={styles.offerDetailItem}>
            <span className={styles.offerDetailLabel}>Department</span>
            <span className={styles.offerDetailValue}>{job.department || 'N/A'}</span>
          </div>
          <div className={styles.offerDetailItem}>
            <span className={styles.offerDetailLabel}>Salary</span>
            <span className={styles.offerDetailValue}>{formatCurrency(offer.salary?.baseSalary, offer.salary?.currency)}</span>
          </div>
          <div className={styles.offerDetailItem}>
            <span className={styles.offerDetailLabel}>Joining Date</span>
            <span className={styles.offerDetailValue}>{formatDate(offer.joiningDate)}</span>
          </div>
          <div className={styles.offerDetailItem}>
            <span className={styles.offerDetailLabel}>Offer Expiry</span>
            <span className={styles.offerDetailValue}>{formatDate(offer.expiryDate)}</span>
          </div>
        </div>

        <div className={styles.offerActions}>
          <button className={`${styles.iconBtn} ${styles.view}`} title="View Details" onClick={() => { setSelectedOffer(offer); setShowDetailsModal(true); }}>
            <Eye size={16} />
          </button>
          {offer.status === 'draft' && (
            <button className={`${styles.iconBtn} ${styles.send}`} title="Send Offer" onClick={() => { setSelectedOffer(offer); setShowSendModal(true); }}>
              <Send size={16} />
            </button>
          )}
          {['sent', 'viewed', 'negotiation'].includes(offer.status) && (
            <button className={`${styles.iconBtn} ${styles.withdraw}`} title="Withdraw Offer" onClick={() => { setSelectedOffer(offer); setShowWithdrawModal(true); }}>
              <XCircle size={16} />
            </button>
          )}
          <button className={`${styles.iconBtn} ${styles.duplicate}`} title="Duplicate" onClick={() => handleDuplicateOffer(offer)}>
            <Copy size={16} />
          </button>
          <button className={`${styles.iconBtn} ${styles.download}`} title="Download PDF" onClick={() => showToast('PDF export coming soon', 'info')}>
            <Download size={16} />
          </button>
          {!['accepted', 'withdrawn', 'rejected'].includes(offer.status) && (
            <button className={`${styles.iconBtn} ${styles.delete}`} title="Delete" onClick={() => handleDeleteOffer(offer)}>
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            <FileText size={28} />
            Offer Management
          </h1>
          <p className={styles.subtitle}>Manage employment offers and hiring decisions</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className={styles.secondaryBtn} onClick={handleExport}>
            <Download size={18} />
            Export
          </button>
          <button className={styles.primaryBtn} onClick={() => setShowCreateModal(true)}>
            <Plus size={18} />
            Create Offer
          </button>
        </div>
      </div>

      {renderStatsCards()}

      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search by candidate name, job title, company, recruiter, offer ID..."
            value={searchInput}
            onChange={handleSearchChange}
            className={styles.searchInput}
          />
        </div>
        <select value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)} className={styles.filterSelect}>
          {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
        <select value={filters.jobId} onChange={(e) => handleFilterChange('jobId', e.target.value)} className={styles.filterSelect}>
          <option value="all">All Jobs</option>
          {jobs.map(job => <option key={job._id} value={job._id}>{job.title}</option>)}
        </select>
        <select value={filters.sort} onChange={(e) => handleFilterChange('sort', e.target.value)} className={styles.filterSelect}>
          {SORT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
        <select value={pagination.limit} onChange={handleLimitChange} className={styles.filterSelect}>
          {PAGE_SIZE_OPTIONS.map(size => <option key={size} value={size}>{size} / page</option>)}
        </select>
      </div>

      {loading ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyStateIcon}><Clock size={48} /></div>
          <h3 className={styles.emptyStateTitle}>Loading offers...</h3>
        </div>
      ) : offers.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyStateIcon}><FileText size={48} /></div>
          <h3 className={styles.emptyStateTitle}>No offers found</h3>
          <p className={styles.emptyStateText}>Create your first offer to get started</p>
        </div>
      ) : (
        <>
          <div className={styles.cardGrid}>
            {offers.map(renderOfferCard)}
          </div>
          <div className={styles.pagination}>
            <button className={styles.pageBtn} disabled={pagination.page <= 1} onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}>
              <ChevronLeft size={18} />
            </button>
            <span className={styles.pageInfo}>Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)</span>
            <button className={styles.pageBtn} disabled={pagination.page >= pagination.totalPages} onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}>
              <ChevronRight size={18} />
            </button>
          </div>
        </>
      )}

      {/* Create Offer Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create New Offer" maxWidth="700px" footer={
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button className={styles.secondaryBtn} onClick={() => setShowCreateModal(false)} disabled={saving}>Cancel</button>
          <button className={styles.primaryBtn} onClick={handleCreateOffer} disabled={saving}>
            {saving ? 'Creating...' : 'Create Offer'}
          </button>
        </div>
      }>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Application</label>
          <select value={createForm.applicationId} onChange={(e) => setCreateForm(prev => ({ ...prev, applicationId: e.target.value }))} className={styles.formSelect}>
            <option value="">Select Application</option>
            {applications.map(app => (
              <option key={app._id} value={app._id}>{app.studentData?.name || 'Student'} - {app.jobData?.title || 'Job'}</option>
            ))}
          </select>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Base Salary</label>
            <input type="number" value={createForm.baseSalary} onChange={(e) => setCreateForm(prev => ({ ...prev, baseSalary: e.target.value }))} className={styles.formInput} placeholder="e.g. 50000" />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Currency</label>
            <select value={createForm.currency} onChange={(e) => setCreateForm(prev => ({ ...prev, currency: e.target.value }))} className={styles.formSelect}>
              {CURRENCY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Bonus</label>
            <input type="number" value={createForm.bonus} onChange={(e) => setCreateForm(prev => ({ ...prev, bonus: e.target.value }))} className={styles.formInput} placeholder="e.g. 5000" />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Signing Bonus</label>
            <input type="number" value={createForm.signingBonus} onChange={(e) => setCreateForm(prev => ({ ...prev, signingBonus: e.target.value }))} className={styles.formInput} placeholder="e.g. 2000" />
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Performance Bonus</label>
            <input type="number" value={createForm.performanceBonus} onChange={(e) => setCreateForm(prev => ({ ...prev, performanceBonus: e.target.value }))} className={styles.formInput} placeholder="e.g. 3000" />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Annual Bonus</label>
            <input type="number" value={createForm.annualBonus} onChange={(e) => setCreateForm(prev => ({ ...prev, annualBonus: e.target.value }))} className={styles.formInput} placeholder="e.g. 2000" />
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Joining Date</label>
            <input type="date" value={createForm.joiningDate} onChange={(e) => setCreateForm(prev => ({ ...prev, joiningDate: e.target.value }))} className={styles.formInput} />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Expiry Date</label>
            <input type="date" value={createForm.expiryDate} onChange={(e) => setCreateForm(prev => ({ ...prev, expiryDate: e.target.value }))} className={styles.formInput} />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Benefits</label>
          <div className={styles.benefitsGrid}>
            {BENEFITS_LIST.map(benefit => (
              <label key={benefit} className={styles.benefitCheckbox}>
                <input
                  type="checkbox"
                  checked={createForm.benefits.includes(benefit)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setCreateForm(prev => ({ ...prev, benefits: [...prev.benefits, benefit] }));
                    } else {
                      setCreateForm(prev => ({ ...prev, benefits: prev.benefits.filter(b => b !== benefit) }));
                    }
                  }}
                />
                <span className={styles.benefitLabel}>{benefit}</span>
              </label>
            ))}
          </div>
        </div>
      </Modal>

      {/* Send Offer Modal */}
      <Modal isOpen={showSendModal} onClose={() => { setShowSendModal(false); setSelectedOffer(null); }} title="Send Offer" maxWidth="500px" footer={
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button className={styles.secondaryBtn} onClick={() => { setShowSendModal(false); setSelectedOffer(null); }} disabled={saving}>Cancel</button>
          <button className={styles.primaryBtn} onClick={handleSendOffer} disabled={saving}>
            {saving ? 'Sending...' : 'Send Offer'}
          </button>
        </div>
      }>
        {selectedOffer && (
          <div>
            <p><strong>Candidate:</strong> {selectedOffer.candidateData?.name}</p>
            <p><strong>Job:</strong> {selectedOffer.jobData?.title}</p>
            <p><strong>Salary:</strong> {formatCurrency(selectedOffer.salary?.baseSalary, selectedOffer.salary?.currency)}</p>
            <p><strong>Joining Date:</strong> {formatDate(selectedOffer.joiningDate)}</p>
            <p><strong>Expiry Date:</strong> {formatDate(selectedOffer.expiryDate)}</p>
          </div>
        )}
      </Modal>

      {/* Withdraw Offer Modal */}
      <Modal isOpen={showWithdrawModal} onClose={() => { setShowWithdrawModal(false); setWithdrawReason(''); setSelectedOffer(null); }} title="Withdraw Offer" maxWidth="500px" footer={
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button className={styles.secondaryBtn} onClick={() => { setShowWithdrawModal(false); setWithdrawReason(''); setSelectedOffer(null); }} disabled={saving}>Cancel</button>
          <button className={styles.dangerBtn} onClick={handleWithdrawOffer} disabled={saving || !withdrawReason}>
            {saving ? 'Withdrawing...' : 'Withdraw Offer'}
          </button>
        </div>
      }>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Reason for Withdrawal (required)</label>
          <textarea value={withdrawReason} onChange={(e) => setWithdrawReason(e.target.value)} className={styles.formTextarea} placeholder="Please provide a reason for withdrawing this offer..." />
        </div>
      </Modal>

      <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={hideToast} />
    </div>
  );
};

export default OfferManagement;
