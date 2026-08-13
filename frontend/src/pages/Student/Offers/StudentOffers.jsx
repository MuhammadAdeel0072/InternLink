import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../services/api';
import Modal from '../../../components/Modal/Modal';
import StatusBadge from '../../../components/StatusBadge/StatusBadge';
import Toast from '../../../components/Toast/Toast';
import styles from './StudentOffers.module.css';
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle2,
  XCircle,
  MessageSquare,
  FileText,
  Download,
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
  { value: 'expiry-desc', label: 'Expiry (Descending)' }
];

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const StudentOffers = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [offers, setOffers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 10 });
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    sort: 'newest'
  });
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showNegotiateModal, setShowNegotiateModal] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [toast, setToast] = useState({ message: '', type: 'success', isVisible: false });
  const [searchInput, setSearchInput] = useState('');
  const [saving, setSaving] = useState(false);
  const searchTimeoutRef = useRef(null);

  const [rejectReason, setRejectReason] = useState('');
  const [negotiateForm, setNegotiateForm] = useState({
    expectedSalary: '',
    preferredJoiningDate: '',
    additionalComments: ''
  });

  useEffect(() => {
    fetchOffers();
  }, [filters, pagination.page, pagination.limit]);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      });

      if (filters.search) params.append('search', filters.search);
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.sort) params.append('sort', filters.sort);

      const res = await api.get(`/offers/student/offers?${params.toString()}`);
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

  const handleViewDetails = async (offer) => {
    try {
      const res = await api.get(`/offers/${offer._id}`);
      if (res.data.success) {
        setSelectedOffer(res.data.data);
        setShowDetailsModal(true);
      }
    } catch (err) {
      console.error('Failed to fetch offer details:', err);
      showToast('Failed to load offer details', 'error');
    }
  };

  const handleAcceptOffer = async (offer) => {
    if (!window.confirm('Are you sure you want to accept this offer?')) {
      return;
    }
    try {
      setSaving(true);
      await api.post(`/offers/${offer._id}/accept`);
      showToast('Offer accepted successfully!', 'success');
      fetchOffers();
    } catch (err) {
      console.error('Accept offer failed:', err);
      showToast(err.response?.data?.message || 'Failed to accept offer', 'error');
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
    } catch (err) {
      console.error('Reject offer failed:', err);
      showToast(err.response?.data?.message || 'Failed to reject offer', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleNegotiateOffer = async () => {
    try {
      setSaving(true);
      await api.post(`/offers/${selectedOffer._id}/negotiate`, {
        expectedSalary: parseFloat(negotiateForm.expectedSalary) || undefined,
        preferredJoiningDate: negotiateForm.preferredJoiningDate || undefined,
        additionalComments: negotiateForm.additionalComments
      });
      setShowNegotiateModal(false);
      setNegotiateForm({ expectedSalary: '', preferredJoiningDate: '', additionalComments: '' });
      setSelectedOffer(null);
      showToast('Negotiation request sent successfully', 'success');
      fetchOffers();
    } catch (err) {
      console.error('Negotiate offer failed:', err);
      showToast(err.response?.data?.message || 'Failed to send negotiation request', 'error');
    } finally {
      setSaving(false);
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

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          <FileText size={28} />
          My Offers
        </h1>
        <p className={styles.subtitle}>Review and respond to your job offers</p>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search by job title, company, recruiter..."
            value={searchInput}
            onChange={handleSearchChange}
            className={styles.searchInput}
          />
        </div>
        <select value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)} className={styles.filterSelect}>
          {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
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
          <h3 className={styles.emptyStateTitle}>No offers yet</h3>
          <p className={styles.emptyStateText}>You will see your offers here once recruiters send them</p>
        </div>
      ) : (
        <>
          <div className={styles.cardGrid}>
            {offers.map(offer => {
              const company = offer.companyData || {};
              const job = offer.jobData || {};
              const statusConfig = getStatusBadge(offer.status);

              return (
                <div key={offer._id} className={styles.offerCard}>
                  <div className={styles.offerCardHeader}>
                    <div className={styles.companyInfo}>
                      {company.logo ? (
                        <img src={company.logo} alt="" className={styles.companyLogo} />
                      ) : (
                        <div className={styles.companyLogoPlaceholder}>{company.companyName?.charAt(0)?.toUpperCase() || 'C'}</div>
                      )}
                      <div>
                        <h4 className={styles.companyName}>{company.companyName || 'Unknown Company'}</h4>
                        <p className={styles.jobTitle}>{job.title || 'Unknown Position'}</p>
                      </div>
                    </div>
                    <StatusBadge status={offer.status} size="sm" />
                  </div>

                  <div className={styles.offerDetails}>
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
                    <div className={styles.offerDetailItem}>
                      <span className={styles.offerDetailLabel}>Department</span>
                      <span className={styles.offerDetailValue}>{job.department || 'N/A'}</span>
                    </div>
                  </div>

                  <div className={styles.offerActions}>
                    <button className={`${styles.actionBtn} ${styles.view}`} onClick={() => handleViewDetails(offer)}>
                      <Eye size={16} />
                      View
                    </button>
                    {['sent', 'viewed', 'negotiation'].includes(offer.status) && (
                      <>
                        <button className={`${styles.actionBtn} ${styles.accept}`} onClick={() => handleAcceptOffer(offer)}>
                          <CheckCircle2 size={16} />
                          Accept
                        </button>
                        <button className={`${styles.actionBtn} ${styles.reject}`} onClick={() => { setSelectedOffer(offer); setShowRejectModal(true); }}>
                          <XCircle size={16} />
                          Reject
                        </button>
                        {['sent', 'viewed'].includes(offer.status) && (
                          <button className={`${styles.actionBtn} ${styles.negotiate}`} onClick={() => { setSelectedOffer(offer); setShowNegotiateModal(true); }}>
                            <MessageSquare size={16} />
                            Negotiate
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
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

      {/* Reject Offer Modal */}
      <Modal isOpen={showRejectModal} onClose={() => { setShowRejectModal(false); setRejectReason(''); setSelectedOffer(null); }} title="Reject Offer" maxWidth="500px" footer={
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button className={styles.secondaryBtn} onClick={() => { setShowRejectModal(false); setRejectReason(''); setSelectedOffer(null); }} disabled={saving}>Cancel</button>
          <button className={styles.dangerBtn} onClick={handleRejectOffer} disabled={saving || !rejectReason}>
            {saving ? 'Rejecting...' : 'Reject Offer'}
          </button>
        </div>
      }>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Reason for Rejection (required)</label>
          <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} className={styles.formTextarea} placeholder="Please provide a reason for rejecting this offer..." />
        </div>
      </Modal>

      {/* Negotiate Offer Modal */}
      <Modal isOpen={showNegotiateModal} onClose={() => { setShowNegotiateModal(false); setNegotiateForm({ expectedSalary: '', preferredJoiningDate: '', additionalComments: '' }); setSelectedOffer(null); }} title="Negotiate Offer" maxWidth="500px" footer={
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button className={styles.secondaryBtn} onClick={() => { setShowNegotiateModal(false); setNegotiateForm({ expectedSalary: '', preferredJoiningDate: '', additionalComments: '' }); setSelectedOffer(null); }} disabled={saving}>Cancel</button>
          <button className={styles.primaryBtn} onClick={handleNegotiateOffer} disabled={saving}>
            {saving ? 'Submitting...' : 'Submit Negotiation Request'}
          </button>
        </div>
      }>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Expected Salary (optional)</label>
          <input type="number" value={negotiateForm.expectedSalary} onChange={(e) => setNegotiateForm(prev => ({ ...prev, expectedSalary: e.target.value }))} className={styles.formInput} placeholder="Enter your expected salary" />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Preferred Joining Date (optional)</label>
          <input type="date" value={negotiateForm.preferredJoiningDate} onChange={(e) => setNegotiateForm(prev => ({ ...prev, preferredJoiningDate: e.target.value }))} className={styles.formInput} />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Additional Comments (optional)</label>
          <textarea value={negotiateForm.additionalComments} onChange={(e) => setNegotiateForm(prev => ({ ...prev, additionalComments: e.target.value }))} className={styles.formTextarea} placeholder="Any additional comments or requests..." />
        </div>
      </Modal>

      <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={hideToast} />
    </div>
  );
};

export default StudentOffers;
