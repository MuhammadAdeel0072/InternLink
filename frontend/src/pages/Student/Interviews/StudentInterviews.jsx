import { useState, useEffect, useRef } from 'react';
import api from '../../../services/api';
import Modal from '../../../components/Modal/Modal';
import StatusBadge from '../../../components/StatusBadge/StatusBadge';
import CalendarView from '../../../components/CalendarView/CalendarView';
import PrimaryButton from '../../../components/primaryButton/primaryButton';
import Toast from '../../../components/Toast/Toast';
import styles from './StudentInterviews.module.css';
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  MapPin,
  Link as LinkIcon,
  Video,
  Phone,
  Play,
  X,
  ClipboardList
} from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'pending-confirmation', label: 'Pending Confirmation' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'rescheduled', label: 'Rescheduled' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'no-show', label: 'No Show' },
];

const INTERVIEW_TYPE_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: 'online', label: 'Online' },
  { value: 'on-site', label: 'On-site' },
  { value: 'phone', label: 'Phone' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'date-asc', label: 'Date (Ascending)' },
  { value: 'date-desc', label: 'Date (Descending)' },
];

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const StudentInterviews = () => {
  const [loading, setLoading] = useState(true);
  const [interviews, setInterviews] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 10 });
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    interviewType: 'all',
    date: '',
    sort: 'newest',
    view: 'list'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [rescheduleForm, setRescheduleForm] = useState({
    date: '',
    time: '',
    reason: ''
  });
  const [declineReason, setDeclineReason] = useState('');
  const [toast, setToast] = useState({ message: '', type: 'success', isVisible: false });
  const [searchInput, setSearchInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const searchTimeoutRef = useRef(null);

  const computeStats = () => {
    if (!interviews.length) {
      return {
        upcoming: 0,
        completed: 0,
        pending: 0,
        cancelled: 0,
        rescheduled: 0
      };
    }

    const stats = {
      upcoming: 0,
      completed: 0,
      pending: 0,
      cancelled: 0,
      rescheduled: 0
    };

    interviews.forEach(interview => {
      const status = interview.status;
      if (status === 'scheduled' || status === 'confirmed') {
        stats.upcoming++;
      } else if (status === 'completed') {
        stats.completed++;
      } else if (status === 'pending-confirmation') {
        stats.pending++;
      } else if (status === 'cancelled') {
        stats.cancelled++;
      } else if (status === 'rescheduled') {
        stats.rescheduled++;
      }
    });

    return stats;
  };

  useEffect(() => {
    fetchInterviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, pagination.page, pagination.limit]);

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (filters.search) params.append('search', filters.search);
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.interviewType !== 'all') params.append('interviewType', filters.interviewType);
      if (filters.date) params.append('date', filters.date);
      if (filters.sort) params.append('sort', filters.sort);
      if (filters.view) params.append('view', filters.view);

      const res = await api.get(`/interviews?${params.toString()}`);
      if (res.data.success) {
        setInterviews(res.data.data);
        setPagination(prev => ({ ...prev, ...res.data.pagination }));
      }
    } catch (err) {
      console.error('Failed to fetch interviews:', err);
      showToast(err.response?.data?.message || 'Failed to fetch interviews', 'error');
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

  const handleConfirm = async (interview) => {
    try {
      setSaving(true);
      await api.post(`/interviews/${interview._id}/confirm`);
      showToast('Interview confirmed successfully', 'success');
      fetchInterviews();
    } catch (err) {
      console.error('Confirm failed:', err);
      showToast(err.response?.data?.message || 'Failed to confirm interview', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleReschedule = async () => {
    try {
      setSaving(true);
      await api.post(`/interviews/${selectedInterview._id}/request-reschedule`, rescheduleForm);
      setShowRescheduleModal(false);
      setRescheduleForm({ date: '', time: '', reason: '' });
      showToast('Reschedule request submitted successfully', 'success');
      fetchInterviews();
    } catch (err) {
      console.error('Request reschedule failed:', err);
      showToast(err.response?.data?.message || 'Failed to request reschedule', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDecline = async () => {
    try {
      setSaving(true);
      await api.post(`/interviews/${selectedInterview._id}/decline`, { reason: declineReason });
      setShowDeclineModal(false);
      setDeclineReason('');
      showToast('Interview declined successfully', 'success');
      fetchInterviews();
    } catch (err) {
      console.error('Decline failed:', err);
      showToast(err.response?.data?.message || 'Failed to decline interview', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleStartInterview = (interview) => {
    if (interview.meetingLink) {
      window.open(interview.meetingLink, '_blank');
    }
  };

  const handleViewDetails = async (interview) => {
    try {
      const res = await api.get(`/interviews/${interview._id}`);
      if (res.data.success) {
        setSelectedInterview(res.data.data);
        setShowDetailsModal(true);
      }
    } catch (err) {
      console.error('Failed to fetch interview details:', err);
      showToast('Failed to load interview details', 'error');
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

  const formatTime = (time) => {
    if (!time) return 'N/A';
    const [hours, minutes] = time.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    return `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  const stats = computeStats();

  const renderStatsCards = () => {
    const cards = [
      { label: 'Upcoming Interviews', value: stats.upcoming, color: 'rgba(6, 182, 212, 0.15)', textColor: 'var(--info)', icon: Clock },
      { label: 'Completed Interviews', value: stats.completed, color: 'rgba(16, 185, 129, 0.15)', textColor: 'var(--success)', icon: CheckCircle2 },
      { label: 'Pending Confirmations', value: stats.pending, color: 'rgba(245, 158, 11, 0.15)', textColor: 'var(--warning)', icon: ClipboardList },
      { label: 'Cancelled Interviews', value: stats.cancelled, color: 'rgba(239, 68, 68, 0.15)', textColor: 'var(--danger)', icon: XCircle },
      { label: 'Rescheduled Interviews', value: stats.rescheduled, color: 'rgba(139, 92, 246, 0.15)', textColor: '#8b5cf6', icon: RefreshCw },
    ];

    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {cards.map((stat, idx) => (
          <div key={idx} style={{
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            cursor: 'pointer',
            border: '1px solid var(--border-color)',
            transition: 'transform 0.2s, box-shadow 0.2s'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
          onClick={() => {
            if (stat.label.includes('Upcoming')) handleFilterChange('status', 'scheduled');
            else if (stat.label.includes('Completed')) handleFilterChange('status', 'completed');
            else if (stat.label.includes('Cancelled')) handleFilterChange('status', 'cancelled');
            else if (stat.label.includes('Pending')) handleFilterChange('status', 'pending-confirmation');
            else if (stat.label.includes('Rescheduled')) handleFilterChange('status', 'rescheduled');
          }}>
            <div style={{ background: stat.color, color: stat.textColor, padding: '12px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <stat.icon size={24} />
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{stat.value}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderListView = () => {
    if (loading) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', padding: '20px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-primary)' }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ height: '16px', width: '40%', background: 'var(--bg-primary)', borderRadius: '4px' }} />
                  <div style={{ height: '14px', width: '60%', background: 'var(--bg-primary)', borderRadius: '4px' }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (interviews.length === 0) {
      return (
        <div className={styles.emptyState}>
          <Calendar size={48} className={styles.emptyStateIcon} />
          <h3>No interviews found</h3>
          <p>Try adjusting your filters or request a new interview.</p>
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {interviews.map(interview => (
          <div key={interview._id} style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flex: 1 }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 600 }}>
                    {(interview.recruiterData?.name?.charAt(0) || 'R').toUpperCase()}
                  </div>
                  <div>
                    <h3 style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {interview.recruiterData?.name || 'Recruiter'}
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      {interview.jobData?.title || 'Job Title'}
                    </p>
                    {interview.companyData?.companyName && (
                      <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {interview.companyData.companyName}
                      </p>
                    )}
                  </div>
                </div>
                <StatusBadge status={interview.status} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={16} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{formatDate(interview.date)}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={16} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{formatTime(interview.time)}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {interview.interviewType === 'online' && <Video size={16} style={{ color: 'var(--text-muted)' }} />}
                  {interview.interviewType === 'on-site' && <MapPin size={16} style={{ color: 'var(--text-muted)' }} />}
                  {interview.interviewType === 'phone' && <Phone size={16} style={{ color: 'var(--text-muted)' }} />}
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                    {interview.interviewType}
                  </span>
                </div>
                {interview.interviewType === 'online' && interview.meetingLink && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <LinkIcon size={16} style={{ color: 'var(--text-muted)' }} />
                    <a href={interview.meetingLink} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.9rem', color: 'var(--primary)', textDecoration: 'none' }}>
                      Join Meeting
                    </a>
                  </div>
                )}
              </div>

              {interview.notes && (
                <div style={{ padding: '12px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', marginBottom: '16px' }}>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{interview.notes}</p>
                </div>
              )}

              {interview.timeline && interview.timeline.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ margin: '0 0 8px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Timeline
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {interview.timeline.slice(-3).map((entry, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)' }} />
                        <span style={{ flex: 1, textTransform: 'capitalize' }}>{entry.action?.replace(/-/g, ' ')}</span>
                        {entry.timestamp && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{formatDate(entry.timestamp)}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => handleViewDetails(interview)}
                  style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}
                >
                  <Eye size={16} />
                  View Details
                </button>
                {['pending-confirmation', 'scheduled'].includes(interview.status) && (
                  <>
                    <button
                      onClick={() => handleConfirm(interview)}
                      disabled={saving}
                      style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--success)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', opacity: saving ? 0.7 : 1 }}
                    >
                      <CheckCircle2 size={16} />
                      Accept
                    </button>
                    <button
                      onClick={() => { setSelectedInterview(interview); setShowRescheduleModal(true); }}
                      style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}
                    >
                      <RefreshCw size={16} />
                      Reschedule
                    </button>
                    <button
                      onClick={() => { setSelectedInterview(interview); setShowDeclineModal(true); }}
                      style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--danger)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}
                    >
                      <X size={16} />
                      Decline
                    </button>
                  </>
                )}
                {['confirmed', 'rescheduled'].includes(interview.status) && interview.interviewType === 'online' && interview.meetingLink && (
                  <button
                    onClick={() => handleStartInterview(interview)}
                    style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--primary)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}
                  >
                    <Play size={16} />
                    Join Interview
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderCalendarView = () => {
    return (
      <CalendarView
        interviews={interviews}
        currentDate={currentDate}
        onMonthChange={setCurrentDate}
        onDateSelect={(date) => handleFilterChange('date', date.toISOString().split('T')[0])}
        selectedDate={filters.date ? new Date(filters.date) : null}
      />
    );
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: '0 0 4px', fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>My Interviews</h1>
        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>View and manage your interview schedule</p>
      </div>

      {renderStatsCards()}

      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search by candidate, job, recruiter, company, type..."
            value={searchInput}
            onChange={handleSearchChange}
            style={{
              width: '100%',
              padding: '10px 12px 10px 40px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontSize: '0.95rem'
            }}
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          style={{
            padding: '10px 16px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            background: showFilters ? 'var(--primary)' : 'var(--bg-secondary)',
            color: showFilters ? 'white' : 'var(--text-primary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.95rem'
          }}
        >
          <Filter size={18} />
          Filters
        </button>
        <select
          value={filters.sort}
          onChange={(e) => handleFilterChange('sort', e.target.value)}
          style={{
            padding: '10px 12px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            fontSize: '0.95rem',
            cursor: 'pointer'
          }}
        >
          {SORT_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <select
          value={pagination.limit}
          onChange={handleLimitChange}
          style={{
            padding: '10px 12px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            fontSize: '0.95rem',
            cursor: 'pointer'
          }}
        >
          {PAGE_SIZE_OPTIONS.map(size => (
            <option key={size} value={size}>{size} / page</option>
          ))}
        </select>
      </div>

      {showFilters && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          padding: '20px',
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          marginBottom: '16px',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
            >
              {STATUS_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Interview Type</label>
            <select
              value={filters.interviewType}
              onChange={(e) => handleFilterChange('interviewType', e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
            >
              {INTERVIEW_TYPE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Date</label>
            <input
              type="date"
              value={filters.date}
              onChange={(e) => handleFilterChange('date', e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
            />
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          onClick={() => handleFilterChange('view', 'list')}
          style={{
            padding: '8px 16px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            background: filters.view === 'list' ? 'var(--primary)' : 'var(--bg-secondary)',
            color: filters.view === 'list' ? 'white' : 'var(--text-primary)',
            cursor: 'pointer',
            fontSize: '0.9rem'
          }}
        >
          List View
        </button>
        <button
          onClick={() => handleFilterChange('view', 'calendar')}
          style={{
            padding: '8px 16px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            background: filters.view === 'calendar' ? 'var(--primary)' : 'var(--bg-secondary)',
            color: filters.view === 'calendar' ? 'white' : 'var(--text-primary)',
            cursor: 'pointer',
            fontSize: '0.9rem'
          }}
        >
          Calendar View
        </button>
      </div>

      {filters.view === 'calendar' ? renderCalendarView() : renderListView()}

      {pagination.totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '24px', padding: '16px' }}>
          <button
            disabled={pagination.page === 1}
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            style={{
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)',
              color: pagination.page === 1 ? 'var(--text-muted)' : 'var(--text-primary)',
              cursor: pagination.page === 1 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <ChevronLeft size={18} />
          </button>
          <span style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            disabled={pagination.page === pagination.totalPages}
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            style={{
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)',
              color: pagination.page === pagination.totalPages ? 'var(--text-muted)' : 'var(--text-primary)',
              cursor: pagination.page === pagination.totalPages ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* Interview Details Modal */}
      <Modal
        isOpen={showDetailsModal && !!selectedInterview}
        onClose={() => setShowDetailsModal(false)}
        title="Interview Details"
        maxWidth="600px"
        footer={
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setShowDetailsModal(false)}
              style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', cursor: 'pointer' }}
            >
              Close
            </button>
          </div>
        }
      >
        {selectedInterview && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'var(--primary)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                fontWeight: 600
               }}>
                {(selectedInterview.recruiterData?.name?.charAt(0) || 'R').toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 4px', fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {selectedInterview.recruiterData?.name || 'Recruiter'}
                </h3>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  {selectedInterview.jobData?.title || 'Job Title'}
                </p>
                <div style={{ marginTop: '8px' }}>
                  <StatusBadge status={selectedInterview.status} />
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Interview Type</span>
                <span style={{ fontSize: '0.95rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {selectedInterview.interviewType === 'online' && <Video size={16} />}
                  {selectedInterview.interviewType === 'on-site' && <MapPin size={16} />}
                  {selectedInterview.interviewType === 'phone' && <Phone size={16} />}
                  {selectedInterview.interviewType?.toUpperCase()}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date</span>
                <span style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{formatDate(selectedInterview.date)}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Time</span>
                <span style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{formatTime(selectedInterview.time)}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Duration</span>
                <span style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{selectedInterview.duration || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Interviewer</span>
                <span style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{selectedInterview.interviewer || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Timezone</span>
                <span style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{selectedInterview.timezone || 'UTC'}</span>
              </div>
              {selectedInterview.meetingLink && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: '1 / -1' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Meeting Link</span>
                  <a href={selectedInterview.meetingLink} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.95rem', color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <LinkIcon size={16} />
                    {selectedInterview.meetingLink}
                  </a>
                </div>
              )}
              {selectedInterview.location && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: '1 / -1' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Location</span>
                  <span style={{ fontSize: '0.95rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={16} /> {selectedInterview.location}
                  </span>
                </div>
              )}
            </div>

            {selectedInterview.notes && (
              <div style={{ padding: '12px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Notes</span>
                <p style={{ margin: '8px 0 0', fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>{selectedInterview.notes}</p>
              </div>
            )}

            {selectedInterview.timeline && selectedInterview.timeline.length > 0 && (
              <div>
                <h4 style={{ margin: '0 0 12px', fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={18} /> Timeline
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedInterview.timeline.map((entry, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 12px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)', textTransform: 'capitalize' }}>{entry.action?.replace(/-/g, ' ')}</div>
                        {entry.note && <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{entry.note}</div>}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{entry.timestamp ? formatDate(entry.timestamp) : ''}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Request Reschedule Modal */}
      <Modal
        isOpen={showRescheduleModal && !!selectedInterview}
        onClose={() => setShowRescheduleModal(false)}
        title="Request Reschedule"
        footer={
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setShowRescheduleModal(false)}
              style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <PrimaryButton onClick={handleReschedule} loading={saving}>
              Submit Request
            </PrimaryButton>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
            Request to reschedule interview with <strong>{selectedInterview?.recruiterData?.name}</strong> for <strong>{selectedInterview?.jobData?.title}</strong>
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>New Date</label>
              <input
                type="date"
                value={rescheduleForm.date}
                onChange={(e) => setRescheduleForm(prev => ({ ...prev, date: e.target.value }))}
                style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>New Time</label>
              <input
                type="time"
                value={rescheduleForm.time}
                onChange={(e) => setRescheduleForm(prev => ({ ...prev, time: e.target.value }))}
                style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Reason</label>
            <textarea
              value={rescheduleForm.reason}
              onChange={(e) => setRescheduleForm(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="Reason for rescheduling..."
              rows={3}
              style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', resize: 'vertical' }}
            />
          </div>
        </div>
      </Modal>

      {/* Decline Interview Modal */}
      <Modal
        isOpen={showDeclineModal && !!selectedInterview}
        onClose={() => setShowDeclineModal(false)}
        title="Decline Interview"
        footer={
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setShowDeclineModal(false)}
              style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', cursor: 'pointer' }}
            >
              Keep Interview
            </button>
            <button
              onClick={handleDecline}
              disabled={saving}
              style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--danger)', color: 'white', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}
            >
              Decline Interview
            </button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
            Are you sure you want to decline the interview with <strong>{selectedInterview?.recruiterData?.name}</strong>? This action cannot be undone.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Reason for declining (optional)</label>
            <textarea
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              placeholder="Reason for declining..."
              rows={3}
              style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', resize: 'vertical' }}
            />
          </div>
        </div>
      </Modal>

      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
        duration={5000}
      />
    </div>
  );
};

export default StudentInterviews;
