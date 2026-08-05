import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../services/api';
import Modal from '../../../components/Modal/Modal';
import StatusBadge from '../../../components/StatusBadge/StatusBadge';
import PrimaryButton from '../../../components/primaryButton/primaryButton';
import Toast from '../../../components/Toast/Toast';
import styles from './HiringOnboarding.module.css';
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  Play,
  Send,
  Mail,
  UserCheck,
  FileText,
  ClipboardCheck,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Plus,
  Trash2,
  Download,
  X,
  ArrowLeft,
  Building2,
  Briefcase,
  MapPin,
  Phone,
  Users,
  Calendar,
  BadgeCheck,
  Laptop,
  IdCard,
  Shield,
  Bell,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Check,
  Loader,
  UserPlus
} from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'offer-accepted', label: 'Offer Accepted' },
  { value: 'pending-documents', label: 'Pending Documents' },
  { value: 'documents-verified', label: 'Documents Verified' },
  { value: 'joining-scheduled', label: 'Joining Scheduled' },
  { value: 'joined', label: 'Joined' },
  { value: 'onboarding', label: 'Onboarding' },
  { value: 'completed', label: 'Completed' }
];

const DEPARTMENT_OPTIONS = [
  { value: '', label: 'All Departments' },
  { value: 'Engineering', label: 'Engineering' },
  { value: 'Design', label: 'Design' },
  { value: 'Marketing', label: 'Marketing' },
  { value: 'Sales', label: 'Sales' },
  { value: 'HR', label: 'HR' },
  { value: 'Finance', label: 'Finance' },
  { value: 'Operations', label: 'Operations' },
  { value: 'Product', label: 'Product' },
  { value: 'Legal', label: 'Legal' }
];

const DOCUMENT_STATUS_COLORS = {
  pending: { bg: 'var(--warning-light)', color: 'var(--warning)', label: 'Pending' },
  uploaded: { bg: 'var(--info-light)', color: 'var(--info)', label: 'Uploaded' },
  verified: { bg: 'var(--success-light)', color: 'var(--success)', label: 'Verified' },
  rejected: { bg: 'var(--danger-light)', color: 'var(--danger)', label: 'Rejected' },
  requested: { bg: 'var(--warning-light)', color: 'var(--warning)', label: 'Re-upload Requested' }
};

const CHECKLIST_ICONS = {
  'offer-accepted': Clock,
  'employee_id_generated': IdCard,
  'documents_uploaded': FileText,
  'documents_verified': BadgeCheck,
  'welcome_email_sent': Mail,
  'manager_assigned': Users,
  'laptop_assigned': Laptop,
  'first_day_scheduled': Calendar,
  'employee_joined': UserCheck,
  'onboarding_completed': Shield
};

const HiringOnboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [hirings, setHirings] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 10 });
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [joiningDateFilter, setJoiningDateFilter] = useState('');
  const [sort, setSort] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedHiring, setSelectedHiring] = useState(null);
  const [showWelcomeEmail, setShowWelcomeEmail] = useState(false);
  const [showManagerAssign, setShowManagerAssign] = useState(false);
  const [showAssignment, setShowAssignment] = useState(false);
  const [users, setUsers] = useState([]);
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const searchTimeoutRef = useRef(null);

  const fetchHirings = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('page', pagination.page);
      params.set('limit', pagination.limit);
      if (search) params.set('search', search);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (departmentFilter) params.set('department', departmentFilter);
      if (joiningDateFilter) params.set('joiningDate', joiningDateFilter);
      if (sort) params.set('sort', sort);

      const res = await api.get(`/hiring?${params.toString()}`);
      if (res.data.success) {
        setHirings(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Failed to load hirings:', err);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, statusFilter, departmentFilter, joiningDateFilter, sort]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/hiring/stats');
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await api.get('/search?q=');
      if (res.data) {
        setUsers(res.data.people || []);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  }, []);

  useEffect(() => {
    fetchHirings();
    fetchStats();
    fetchUsers();
  }, [fetchHirings, fetchStats, fetchUsers]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setSearch(value);
      setPagination(prev => ({ ...prev, page: 1 }));
    }, 300);
  };

  const handleFilterChange = (field, value) => {
    if (field === 'statusFilter') setStatusFilter(value);
    if (field === 'departmentFilter') setDepartmentFilter(value);
    if (field === 'joiningDateFilter') setJoiningDateFilter(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleView = (hiring) => {
    setSelectedHiring(hiring);
    setShowDetail(true);
    setActiveTab('details');
  };

  const handleStartOnboarding = async (hiringId) => {
    try {
      setActionLoading(true);
      const res = await api.put(`/hiring/${hiringId}/status`, { status: 'onboarding' });
      if (res.data.success) {
        showToast('Onboarding started successfully', 'success');
        fetchHirings();
        fetchStats();
        if (selectedHiring?._id === hiringId) {
          setSelectedHiring(res.data.data);
        }
      }
    } catch (err) {
      showToast('Failed to start onboarding', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendWelcomeEmail = async (hiringId) => {
    try {
      setActionLoading(true);
      const res = await api.post(`/hiring/${hiringId}/send-welcome-email`);
      if (res.data.success) {
        showToast('Welcome email sent successfully', 'success');
        fetchHirings();
        if (selectedHiring?._id === hiringId) {
          setSelectedHiring(res.data.data);
        }
      }
    } catch (err) {
      showToast('Failed to send welcome email', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async (hiringId, newStatus) => {
    try {
      setActionLoading(true);
      const res = await api.put(`/hiring/${hiringId}/status`, { status: newStatus });
      if (res.data.success) {
        showToast(`Status updated to ${newStatus}`, 'success');
        fetchHirings();
        fetchStats();
        if (selectedHiring?._id === hiringId) {
          setSelectedHiring(res.data.data);
        }
      }
    } catch (err) {
      showToast('Failed to update status', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyDocument = async (hiringId, docIndex, action, note = '') => {
    try {
      setActionLoading(true);
      const res = await api.put(`/hiring/${hiringId}/documents/${docIndex}/verify`, { action, note });
      if (res.data.success) {
        showToast(`Document ${action === 'verify' ? 'verified' : action === 'reject' ? 'rejected' : 're-upload requested'}`, 'success');
        fetchHirings();
        if (selectedHiring?._id === hiringId) {
          setSelectedHiring(res.data.data);
        }
      }
    } catch (err) {
      showToast('Failed to update document', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleChecklistUpdate = async (hiringId, key, completed) => {
    try {
      setActionLoading(true);
      const res = await api.put(`/hiring/${hiringId}/checklist`, { key, completed });
      if (res.data.success) {
        showToast('Checklist updated', 'success');
        fetchHirings();
        if (selectedHiring?._id === hiringId) {
          setSelectedHiring(res.data.data);
        }
      }
    } catch (err) {
      showToast('Failed to update checklist', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignManager = async (hiringId, managerId, team) => {
    try {
      setActionLoading(true);
      const res = await api.put(`/hiring/${hiringId}/manager`, { manager: managerId, team });
      if (res.data.success) {
        showToast('Manager assigned successfully', 'success');
        fetchHirings();
        if (selectedHiring?._id === hiringId) {
          setSelectedHiring(res.data.data);
        }
        setShowManagerAssign(false);
      }
    } catch (err) {
      showToast('Failed to assign manager', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOfficeAssignment = async (hiringId, assignmentData) => {
    try {
      setActionLoading(true);
      const res = await api.put(`/hiring/${hiringId}/assignment`, { officeAssignment: assignmentData });
      if (res.data.success) {
        showToast('Office assignment updated', 'success');
        fetchHirings();
        if (selectedHiring?._id === hiringId) {
          setSelectedHiring(res.data.data);
        }
        setShowAssignment(false);
      }
    } catch (err) {
      showToast('Failed to update assignment', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'info' }), 3000);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getStatusBadgeStyle = (status) => {
    const styles = {
      'offer-accepted': { bg: 'var(--info-light)', color: 'var(--info)' },
      'pending-documents': { bg: 'var(--warning-light)', color: 'var(--warning)' },
      'documents-verified': { bg: 'var(--primary-light)', color: 'var(--primary)' },
      'joining-scheduled': { bg: '#ede9fe', color: '#7c3aed' },
      'joined': { bg: 'var(--success-light)', color: 'var(--success)' },
      'onboarding': { bg: '#fef3c7', color: '#d97706' },
      'completed': { bg: '#d1fae5', color: '#059669' }
    };
    return styles[status] || { bg: 'var(--bg-tertiary)', color: 'var(--text-secondary)' };
  };

  const getCardStatusClass = (status) => {
    const map = {
      'offer-accepted': 'cardStatusAccepted',
      'pending-documents': 'cardStatusPendingDocuments',
      'documents-verified': 'cardStatusDocumentsVerified',
      'joining-scheduled': 'cardStatusJoiningScheduled',
      'joined': 'cardStatusJoined',
      'onboarding': 'cardStatusOnboarding',
      'completed': 'cardStatusCompleted'
    };
    return map[status] || '';
  };

  const getStatusLabel = (status) => {
    return status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading && !stats) {
    return (
      <div className={styles.loaderContainer}>
        <Loader size={40} />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerTitle}>
            <div>
              <h1 className={styles.headerTitleText}>Hiring & Onboarding</h1>
              <p>Manage hired candidates and their onboarding progress</p>
            </div>
          </div>
          {stats && (
            <div className={styles.headerStats}>
              <div className={styles.headerStat}>
                <div className={styles.headerStatValue}>{stats.pendingJoining + stats.joiningThisWeek}</div>
                <div className={styles.headerStatLabel}>Pending</div>
              </div>
              <div className={styles.headerStat}>
                <div className={styles.headerStatValue}>{stats.onboardingInProgress}</div>
                <div className={styles.headerStatLabel}>In Progress</div>
              </div>
              <div className={styles.headerStat}>
                <div className={styles.headerStatValue}>{stats.completedOnboarding}</div>
                <div className={styles.headerStatLabel}>Completed</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className={styles.statsGrid}>
          <div className={styles.statCard} onClick={() => handleFilterChange('statusFilter', 'offer-accepted')}>
            <div className={styles.statIcon} style={{ background: 'var(--info-light)', color: 'var(--info)' }}>
              <Clock size={24} />
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{stats.pendingJoining}</div>
              <div className={styles.statLabel}>Pending Joining</div>
            </div>
          </div>
          <div className={styles.statCard} onClick={() => handleFilterChange('statusFilter', 'joining-scheduled')}>
            <div className={styles.statIcon} style={{ background: '#ede9fe', color: '#7c3aed' }}>
              <Calendar size={24} />
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{stats.joiningThisWeek}</div>
              <div className={styles.statLabel}>Joining This Week</div>
            </div>
          </div>
          <div className={styles.statCard} onClick={() => handleFilterChange('statusFilter', 'pending-documents')}>
            <div className={styles.statIcon} style={{ background: 'var(--warning-light)', color: 'var(--warning)' }}>
              <FileText size={24} />
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{stats.documentsPending}</div>
              <div className={styles.statLabel}>Documents Pending</div>
            </div>
          </div>
          <div className={styles.statCard} onClick={() => handleFilterChange('statusFilter', 'onboarding')}>
            <div className={styles.statIcon} style={{ background: '#fef3c7', color: '#d97706' }}>
              <Play size={24} />
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{stats.onboardingInProgress}</div>
              <div className={styles.statLabel}>Onboarding In Progress</div>
            </div>
          </div>
          <div className={styles.statCard} onClick={() => handleFilterChange('statusFilter', 'joined')}>
            <div className={styles.statIcon} style={{ background: 'var(--success-light)', color: 'var(--success)' }}>
              <UserCheck size={24} />
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{stats.employeesJoined}</div>
              <div className={styles.statLabel}>Employees Joined</div>
            </div>
          </div>
          <div className={styles.statCard} onClick={() => handleFilterChange('statusFilter', 'completed')}>
            <div className={styles.statIcon} style={{ background: '#d1fae5', color: '#059669' }}>
              <Shield size={24} />
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{stats.completedOnboarding}</div>
              <div className={styles.statLabel}>Completed Onboarding</div>
            </div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search by name, job title, department, employee ID..."
            value={searchInput}
            onChange={handleSearchChange}
            className={styles.searchInput}
          />
        </div>
        <button
          className={`${styles.filterButton} ${showFilters ? styles.filterButtonActive : ''}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={18} />
          Filters
        </button>
        <select value={sort} onChange={(e) => setSort(e.target.value)} className={styles.sortSelect}>
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="joining-asc">Joining Date (Asc)</option>
          <option value="joining-desc">Joining Date (Desc)</option>
          <option value="name-asc">Name (A-Z)</option>
          <option value="name-desc">Name (Z-A)</option>
        </select>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className={styles.filtersPanel}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Status</label>
            <select value={statusFilter} onChange={(e) => handleFilterChange('statusFilter', e.target.value)} className={styles.filterSelect}>
              {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Department</label>
            <select value={departmentFilter} onChange={(e) => handleFilterChange('departmentFilter', e.target.value)} className={styles.filterSelect}>
              {DEPARTMENT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Joining Date</label>
            <input
              type="date"
              value={joiningDateFilter}
              onChange={(e) => handleFilterChange('joiningDateFilter', e.target.value)}
              className={styles.dateInput}
            />
          </div>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className={styles.loaderContainer}>
          <Loader size={32} />
        </div>
      ) : hirings.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyStateIcon}>
            <UserCheck size={32} />
          </div>
          <h3>No hired candidates found</h3>
          <p>Candidates who have accepted offers will appear here for onboarding.</p>
        </div>
      ) : (
        <>
          <div className={styles.cardsGrid}>
            {hirings.map((hiring) => {
              const statusStyle = getStatusBadgeStyle(hiring.status);
              const cardStatusClass = getCardStatusClass(hiring.status);
              return (
                <div key={hiring._id} className={`${styles.hiringCard} ${styles[cardStatusClass]}`}>
                  <div className={styles.cardHeader}>
                    <div className={styles.cardAvatar}>
                      {hiring.candidateData?.avatar ? (
                        <img src={hiring.candidateData.avatar} alt={hiring.candidateData.name} />
                      ) : (
                        <span>{hiring.candidateData?.name?.charAt(0) || '?'}</span>
                      )}
                    </div>
                    <div className={styles.cardInfo}>
                      <h3 className={styles.cardName}>{hiring.candidateData?.name || 'Unknown'}</h3>
                      <span className={styles.cardId}>{hiring.employeeId || hiring.employeeCode || ''}</span>
                    </div>
                    <span
                      className={styles.cardStatus}
                      style={{ background: statusStyle.bg, color: statusStyle.color }}
                    >
                      {getStatusLabel(hiring.status)}
                    </span>
                  </div>
                  <div className={styles.cardBody}>
                    <div className={styles.cardRow}>
                      <Briefcase size={14} />
                      <span>{hiring.jobData?.title || 'N/A'}</span>
                    </div>
                    <div className={styles.cardRow}>
                      <Building2 size={14} />
                      <span>{hiring.companyData?.companyName || hiring.department || 'N/A'}</span>
                    </div>
                    <div className={styles.cardRow}>
                      <Calendar size={14} />
                      <span>Joining: {formatDate(hiring.joiningDate)}</span>
                    </div>
                    <div className={styles.cardRow}>
                      <MapPin size={14} />
                      <span>{hiring.officeLocation || 'N/A'}</span>
                    </div>
                  </div>
                  <div className={styles.cardFooter}>
                    <button className={styles.actionButton} onClick={() => handleView(hiring)}>
                      <Eye size={16} /> View
                    </button>
                    <button className={`${styles.actionButton} ${styles.actionButtonPrimary}`} onClick={() => handleStartOnboarding(hiring._id)}>
                      <Play size={16} /> Start
                    </button>
                    <button className={styles.actionButton} onClick={() => handleSendWelcomeEmail(hiring._id)}>
                      <Send size={16} /> Email
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {pagination.totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                className={styles.pageButton}
                disabled={pagination.page <= 1}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              >
                <ChevronLeft size={18} />
              </button>
              <span className={styles.pageInfo}>
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
              </span>
              <button
                className={styles.pageButton}
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}

      {/* Detail Modal */}
      {showDetail && selectedHiring && (
        <div className={styles.modalOverlay} onClick={() => setShowDetail(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Hiring Details</h2>
              <button className={styles.modalClose} onClick={() => setShowDetail(false)}>
                <X size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.detailTabs}>
                <button
                  className={`${styles.tab} ${activeTab === 'details' ? styles.tabActive : ''}`}
                  onClick={() => setActiveTab('details')}
                >
                  Details
                </button>
                <button
                  className={`${styles.tab} ${activeTab === 'documents' ? styles.tabActive : ''}`}
                  onClick={() => setActiveTab('documents')}
                >
                  Documents
                </button>
                <button
                  className={`${styles.tab} ${activeTab === 'checklist' ? styles.tabActive : ''}`}
                  onClick={() => setActiveTab('checklist')}
                >
                  Checklist
                </button>
                <button
                  className={`${styles.tab} ${activeTab === 'timeline' ? styles.tabActive : ''}`}
                  onClick={() => setActiveTab('timeline')}
                >
                  Timeline
                </button>
              </div>

              {activeTab === 'details' && (
                <div>
                  <div className={styles.detailSection}>
                    <h3 className={styles.detailSectionTitle}>
                      <UserPlus size={18} /> Candidate Information
                    </h3>
                    <div className={styles.detailGrid}>
                      <div className={styles.detailItem}>
                        <img
                          src={selectedHiring.candidateData?.avatar || '/default-avatar.png'}
                          alt={selectedHiring.candidateData?.name}
                          className={styles.detailAvatar}
                        />
                      </div>
                      <div className={styles.detailItem}>
                        <label>Full Name</label>
                        <span>{selectedHiring.candidateData?.name || 'N/A'}</span>
                      </div>
                      <div className={styles.detailItem}>
                        <label>Email</label>
                        <span>{selectedHiring.candidateData?.email || 'N/A'}</span>
                      </div>
                      <div className={styles.detailItem}>
                        <label>Phone</label>
                        <span>{selectedHiring.candidateData?.phone || 'N/A'}</span>
                      </div>
                      <div className={styles.detailItem}>
                        <label>Employee ID</label>
                        <span>{selectedHiring.employeeId || 'Not generated'}</span>
                      </div>
                      <div className={styles.detailItem}>
                        <label>Employee Code</label>
                        <span>{selectedHiring.employeeCode || 'Not generated'}</span>
                      </div>
                      <div className={styles.detailItem}>
                        <label>Employee Status</label>
                        <span>{selectedHiring.employeeStatus || 'pending'}</span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.detailSection}>
                    <h3 className={styles.detailSectionTitle}>
                      <Briefcase size={18} /> Job Information
                    </h3>
                    <div className={styles.detailGrid}>
                      <div className={styles.detailItem}>
                        <label>Job Title</label>
                        <span>{selectedHiring.jobData?.title || 'N/A'}</span>
                      </div>
                      <div className={styles.detailItem}>
                        <label>Department</label>
                        <span>{selectedHiring.department || 'N/A'}</span>
                      </div>
                      <div className={styles.detailItem}>
                        <label>Manager</label>
                        <span>{selectedHiring.managerName || selectedHiring.managerData?.name || 'Not assigned'}</span>
                      </div>
                      <div className={styles.detailItem}>
                        <label>Office Location</label>
                        <span>{selectedHiring.officeLocation || 'N/A'}</span>
                      </div>
                      <div className={styles.detailItem}>
                        <label>Employment Type</label>
                        <span>{selectedHiring.workType || 'N/A'}</span>
                      </div>
                      <div className={styles.detailItem}>
                        <label>Team</label>
                        <span>{selectedHiring.team || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.detailSection}>
                    <h3 className={styles.detailSectionTitle}>
                      <Calendar size={18} /> Joining Information
                    </h3>
                    <div className={styles.detailGrid}>
                      <div className={styles.detailItem}>
                        <label>Joining Date</label>
                        <span>{formatDate(selectedHiring.joiningDate)}</span>
                      </div>
                      <div className={styles.detailItem}>
                        <label>Reporting Time</label>
                        <span>{selectedHiring.reportingTime || 'N/A'}</span>
                      </div>
                      <div className={styles.detailItem}>
                        <label>Office Location</label>
                        <span>{selectedHiring.officeLocation || 'N/A'}</span>
                      </div>
                      <div className={styles.detailItem}>
                        <label>Reporting Manager</label>
                        <span>{selectedHiring.managerName || selectedHiring.managerData?.name || 'N/A'}</span>
                      </div>
                      <div className={styles.detailItem}>
                        <label>Team</label>
                        <span>{selectedHiring.team || 'N/A'}</span>
                      </div>
                      <div className={styles.detailItem}>
                        <label>Work Type</label>
                        <span>{selectedHiring.workType || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.detailActions}>
                    <PrimaryButton onClick={() => setShowWelcomeEmail(true)}>
                      <Send size={16} /> Send Welcome Email
                    </PrimaryButton>
                    <PrimaryButton onClick={() => setShowManagerAssign(true)}>
                      <Users size={16} /> Assign Manager
                    </PrimaryButton>
                    <PrimaryButton onClick={() => setShowAssignment(true)}>
                      <MapPin size={16} /> Office Assignment
                    </PrimaryButton>
                    <select
                      className={styles.statusSelect}
                      value={selectedHiring.status}
                      onChange={(e) => handleStatusChange(selectedHiring._id, e.target.value)}
                    >
                      {STATUS_OPTIONS.filter(o => o.value !== 'all').map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {activeTab === 'documents' && (
                <div>
                  {selectedHiring.documents?.length === 0 ? (
                    <p className={styles.noData}>No documents uploaded yet</p>
                  ) : (
                    <div className={styles.documentList}>
                      {selectedHiring.documents?.map((doc, index) => (
                        <div key={index} className={styles.documentItem}>
                          <div className={styles.documentIcon}>
                            <FileText size={20} />
                          </div>
                          <div className={styles.documentInfo}>
                            <span className={styles.documentName}>{doc.documentName}</span>
                            <span className={styles.documentStatus} style={{
                              color: DOCUMENT_STATUS_COLORS[doc.status]?.color || 'var(--text-secondary)'
                            }}>
                              {DOCUMENT_STATUS_COLORS[doc.status]?.label || doc.status}
                            </span>
                          </div>
                          {doc.fileUrl && (
                            <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className={styles.actionButton}>
                              <Download size={14} /> View
                            </a>
                          )}
                          <div className={styles.documentActions}>
                            {doc.status !== 'verified' && (
                              <>
                                <button
                                  className={styles.docButton}
                                  style={{ background: 'var(--success-light)', color: 'var(--success)' }}
                                  onClick={() => handleVerifyDocument(selectedHiring._id, index, 'verify')}
                                >
                                  <Check size={14} /> Verify
                                </button>
                                <button
                                  className={styles.docButton}
                                  style={{ background: 'var(--danger-light)', color: 'var(--danger)' }}
                                  onClick={() => handleVerifyDocument(selectedHiring._id, index, 'reject')}
                                >
                                  <XCircle size={14} /> Reject
                                </button>
                                <button
                                  className={styles.docButton}
                                  style={{ background: 'var(--warning-light)', color: 'var(--warning)' }}
                                  onClick={() => handleVerifyDocument(selectedHiring._id, index, 'request-reupload')}
                                >
                                  <RotateCcw size={14} /> Re-upload
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'checklist' && (
                <div>
                  {selectedHiring.checklist?.length === 0 ? (
                    <p className={styles.noData}>No checklist items yet</p>
                  ) : (
                    <div className={styles.checklistContainer}>
                      {selectedHiring.checklist?.map((item, index) => {
                        const Icon = CHECKLIST_ICONS[item.key] || CheckCircle2;
                        return (
                          <div key={index} className={styles.checklistItem}>
                            <div className={styles.checklistIcon}>
                              <Icon size={18} />
                            </div>
                            <div className={styles.checklistInfo}>
                              <span className={styles.checklistTask}>{item.task}</span>
                              <span className={styles.checklistDate}>
                                {item.completedAt ? `Completed: ${formatDate(item.completedAt)}` : 'Not completed'}
                              </span>
                            </div>
                            <label className={styles.checkboxWrapper}>
                              <input
                                type="checkbox"
                                checked={item.completed}
                                onChange={(e) => handleChecklistUpdate(selectedHiring._id, item.key, e.target.checked)}
                              />
                              <span className={styles.checkboxCustom} />
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'timeline' && (
                <div>
                  {selectedHiring.timeline?.length === 0 ? (
                    <p className={styles.noData}>No timeline entries yet</p>
                  ) : (
                    <div className={styles.timelineContainer}>
                      {[...selectedHiring.timeline].reverse().map((entry, index) => (
                        <div key={index} className={styles.timelineItem}>
                          <div className={styles.timelineContent}>
                            <span className={styles.timelineAction}>{entry.action}</span>
                            <span className={styles.timelineNote}>{entry.note}</span>
                            <span className={styles.timelineDate}>
                              {formatDate(entry.timestamp)} at {new Date(entry.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Welcome Email Modal */}
      {showWelcomeEmail && selectedHiring && (
        <div className={styles.modalOverlay} onClick={() => setShowWelcomeEmail(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Send Welcome Email</h2>
              <button className={styles.modalClose} onClick={() => setShowWelcomeEmail(false)}>
                <X size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <p style={{ margin: '0 0 20px', color: 'var(--text-secondary)' }}>
                A professional welcome email will be sent to <strong>{selectedHiring.candidateData?.name}</strong> with onboarding details.
              </p>
              <div className={styles.formActions}>
                <PrimaryButton onClick={() => handleSendWelcomeEmail(selectedHiring._id)} disabled={actionLoading}>
                  {actionLoading ? <Loader size={16} /> : <Send size={16} />} Send Welcome Email
                </PrimaryButton>
                <button className={styles.cancelButton} onClick={() => setShowWelcomeEmail(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Manager Modal */}
      {showManagerAssign && selectedHiring && (
        <div className={styles.modalOverlay} onClick={() => setShowManagerAssign(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Assign Manager</h2>
              <button className={styles.modalClose} onClick={() => setShowManagerAssign(false)}>
                <X size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Select Manager</label>
                <select
                  className={styles.formSelect}
                  onChange={(e) => setSelectedHiring(prev => ({ ...prev, tempManager: e.target.value }))}
                >
                  <option value="">Select a manager...</option>
                  {users.filter(u => u.role === 'recruiter' || u.role === 'student').map(u => (
                    <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Team</label>
                <input
                  type="text"
                  className={styles.formInput}
                  placeholder="Enter team name"
                  onChange={(e) => setSelectedHiring(prev => ({ ...prev, tempTeam: e.target.value }))}
                />
              </div>
              <div className={styles.formActions}>
                <PrimaryButton
                  onClick={() => {
                    if (selectedHiring.tempManager) {
                      handleAssignManager(selectedHiring._id, selectedHiring.tempManager, selectedHiring.tempTeam || '');
                    }
                  }}
                  disabled={actionLoading || !selectedHiring.tempManager}
                >
                  {actionLoading ? <Loader size={16} /> : <Users size={16} />} Assign Manager
                </PrimaryButton>
                <button className={styles.cancelButton} onClick={() => setShowManagerAssign(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Office Assignment Modal */}
      {showAssignment && selectedHiring && (
        <div className={styles.modalOverlay} onClick={() => setShowAssignment(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Office & Equipment Assignment</h2>
              <button className={styles.modalClose} onClick={() => setShowAssignment(false)}>
                <X size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Branch</label>
                <input type="text" className={styles.formInput} placeholder="Enter branch" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Floor</label>
                <input type="text" className={styles.formInput} placeholder="Enter floor" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Office</label>
                <input type="text" className={styles.formInput} placeholder="Enter office" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Workstation</label>
                <input type="text" className={styles.formInput} placeholder="Enter workstation (optional)" />
              </div>
              <div className={styles.formActions}>
                <PrimaryButton onClick={() => setShowAssignment(false)}>Save Assignment</PrimaryButton>
                <button className={styles.cancelButton} onClick={() => setShowAssignment(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ show: false, message: '', type: 'info' })}
        />
      )}
    </div>
  );
};

export default HiringOnboarding;
