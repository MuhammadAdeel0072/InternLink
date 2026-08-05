import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../services/api';
import Modal from '../../../components/Modal/Modal';
import StatusBadge from '../../../components/StatusBadge/StatusBadge';
import InterviewCard from '../../../components/InterviewCard/InterviewCard';
import CalendarView from '../../../components/CalendarView/CalendarView';
import PrimaryButton from '../../../components/primaryButton/primaryButton';
import Toast from '../../../components/Toast/Toast';
import NotificationBell from '../../../components/notifications/NotificationBell';
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  Calendar,
  Download,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  MapPin,
  Link as LinkIcon,
  MoreVertical,
  TrendingUp,
  ClipboardList,
  BarChart3,
  Video,
  Phone,
  RefreshCw,
  MessageSquare,
  Award,
  Play,
  X,
  CheckSquare,
  Star
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

const DURATION_OPTIONS = [
  '15 minutes',
  '30 minutes',
  '45 minutes',
  '60 minutes',
  '90 minutes',
  '2 hours'
];

const TIMEZONE_OPTIONS = [
  'UTC',
  'America/New_York',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Berlin',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney'
];

const RECOMMENDATION_OPTIONS = [
  { value: 'strong-hire', label: 'Strong Hire' },
  { value: 'hire', label: 'Hire' },
  { value: 'hold', label: 'Hold' },
  { value: 'no-hire', label: 'No Hire' }
];

const InterviewManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [interviews, setInterviews] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 10 });
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    interviewType: 'all',
    date: '',
    jobId: 'all',
    sort: 'newest',
    view: 'list'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({
    applicationId: '',
    interviewType: 'online',
    date: '',
    time: '',
    duration: '30 minutes',
    timezone: 'UTC',
    interviewer: '',
    department: '',
    meetingLink: '',
    location: '',
    notes: ''
  });
  const [rescheduleForm, setRescheduleForm] = useState({
    date: '',
    time: '',
    reason: ''
  });
  const [cancelReason, setCancelReason] = useState('');
  const [feedbackForm, setFeedbackForm] = useState({
    communication: 3,
    technicalSkills: 3,
    problemSolving: 3,
    leadership: 3,
    cultureFit: 3,
    overallRating: 3,
    recommendation: 'hold',
    comments: ''
  });
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [toast, setToast] = useState({ message: '', type: 'success', isVisible: false });
  const [searchInput, setSearchInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    fetchJobs();
    fetchApplications();
    fetchUnreadNotifications();
  }, []);

  useEffect(() => {
    fetchInterviews();
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
      if (filters.jobId !== 'all') params.append('jobId', filters.jobId);
      if (filters.sort) params.append('sort', filters.sort);
      if (filters.view) params.append('view', filters.view);

      const res = await api.get(`/interviews?${params.toString()}`);
      if (res.data.success) {
        setInterviews(res.data.data);
        setPagination(prev => ({ ...prev, ...res.data.pagination }));
      }
    } catch (err) {
      console.error('Failed to fetch interviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/interviews/analytics');
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

  const handleScheduleInterview = async () => {
    try {
      setSaving(true);
      await api.post('/interviews', scheduleForm);
      setShowScheduleModal(false);
      setScheduleForm({
        applicationId: '',
        interviewType: 'online',
        date: '',
        time: '',
        duration: '30 minutes',
        timezone: 'UTC',
        interviewer: '',
        department: '',
        meetingLink: '',
        location: '',
        notes: ''
      });
      showToast('Interview scheduled successfully', 'success');
      fetchInterviews();
      fetchAnalytics();
    } catch (err) {
      console.error('Schedule interview failed:', err);
      showToast(err.response?.data?.message || 'Failed to schedule interview', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleReschedule = async () => {
    try {
      setSaving(true);
      await api.post(`/interviews/${selectedInterview._id}/reschedule`, rescheduleForm);
      setShowRescheduleModal(false);
      setRescheduleForm({ date: '', time: '', reason: '' });
      showToast('Interview rescheduled successfully', 'success');
      fetchInterviews();
      fetchAnalytics();
    } catch (err) {
      console.error('Reschedule failed:', err);
      showToast(err.response?.data?.message || 'Failed to reschedule interview', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    try {
      setSaving(true);
      await api.post(`/interviews/${selectedInterview._id}/cancel`, { reason: cancelReason });
      setShowCancelModal(false);
      setCancelReason('');
      showToast('Interview cancelled successfully', 'success');
      fetchInterviews();
      fetchAnalytics();
    } catch (err) {
      console.error('Cancel failed:', err);
      showToast(err.response?.data?.message || 'Failed to cancel interview', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async (interviewId) => {
    try {
      await api.post(`/interviews/${interviewId}/complete`);
      showToast('Interview marked as completed', 'success');
      fetchInterviews();
      fetchAnalytics();
    } catch (err) {
      console.error('Complete failed:', err);
      showToast(err.response?.data?.message || 'Failed to complete interview', 'error');
    }
  };

  const handleAddFeedback = async () => {
    try {
      setSaving(true);
      await api.post(`/interviews/${selectedInterview._id}/feedback`, feedbackForm);
      setShowFeedbackModal(false);
      setFeedbackForm({
        communication: 3,
        technicalSkills: 3,
        problemSolving: 3,
        leadership: 3,
        cultureFit: 3,
        overallRating: 3,
        recommendation: 'hold',
        comments: ''
      });
      showToast('Feedback added successfully', 'success');
      fetchInterviews();
      fetchAnalytics();
    } catch (err) {
      console.error('Add feedback failed:', err);
      showToast(err.response?.data?.message || 'Failed to add feedback', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleMarkNoShow = async (interviewId) => {
    try {
      await api.post(`/interviews/${interviewId}/no-show`);
      showToast('Interview marked as no-show', 'success');
      fetchInterviews();
      fetchAnalytics();
    } catch (err) {
      console.error('Mark no-show failed:', err);
      showToast(err.response?.data?.message || 'Failed to mark as no-show', 'error');
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

  const handleExport = async () => {
    try {
      const res = await api.get('/interviews/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'interviews.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      showToast('Export downloaded successfully', 'success');
    } catch (err) {
      console.error('Export failed:', err);
      showToast(err.response?.data?.message || 'Failed to export interviews', 'error');
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

  const fetchUnreadNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      const unread = res.data.filter((n) => !n.isRead).length;
      setUnreadNotifications(unread);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const renderStatsCards = () => {
    if (!analytics) return null;
    const stats = [
      { label: "Today's Interviews", value: analytics.today || 0, color: 'rgba(99, 102, 241, 0.15)', textColor: 'var(--primary)', icon: Calendar },
      { label: 'Upcoming Interviews', value: analytics.upcoming || 0, color: 'rgba(6, 182, 212, 0.15)', textColor: 'var(--info)', icon: Clock },
      { label: 'Completed Interviews', value: analytics.completed || 0, color: 'rgba(16, 185, 129, 0.15)', textColor: 'var(--success)', icon: CheckCircle2 },
      { label: 'Cancelled Interviews', value: analytics.cancelled || 0, color: 'rgba(239, 68, 68, 0.15)', textColor: 'var(--danger)', icon: XCircle },
      { label: 'Pending Confirmations', value: analytics.pendingConfirmation || 0, color: 'rgba(245, 158, 11, 0.15)', textColor: 'var(--warning)', icon: Clock },
      { label: 'Rescheduled Interviews', value: analytics.rescheduled || 0, color: 'rgba(139, 92, 246, 0.15)', textColor: '#8b5cf6', icon: RefreshCw },
    ];

    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {stats.map((stat, idx) => (
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

  const renderAnalytics = () => {
    if (!analytics) return null;
    const chartData = [
      { label: 'Scheduled', value: analytics.scheduled || 0, color: 'var(--primary)' },
      { label: 'Pending', value: analytics.pendingConfirmation || 0, color: 'var(--warning)' },
      { label: 'Confirmed', value: analytics.confirmed || 0, color: 'var(--success)' },
      { label: 'Rescheduled', value: analytics.rescheduled || 0, color: '#8b5cf6' },
      { label: 'Completed', value: analytics.completed || 0, color: 'var(--info)' },
      { label: 'Cancelled', value: analytics.cancelled || 0, color: 'var(--danger)' },
      { label: 'No Show', value: analytics.noShow || 0, color: '#f87171' },
    ];

    const maxValue = Math.max(...chartData.map(d => d.value), 1);

    return (
      <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', padding: '24px', marginBottom: '24px', border: '1px solid var(--border-color)' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
          <BarChart3 size={20} />
          Interview Analytics
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
          {chartData.map(item => (
            <div key={item.label} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{item.label}</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>{item.value}</div>
              <div style={{ height: '6px', background: 'var(--bg-primary)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(item.value / maxValue) * 100}%`, background: item.color, borderRadius: '3px', transition: 'width 0.3s ease' }} />
              </div>
            </div>
          ))}
        </div>
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
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
          <Calendar size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
          <h3 style={{ margin: '0 0 8px', color: 'var(--text-primary)' }}>No interviews found</h3>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Try adjusting your filters or schedule a new interview.</p>
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {interviews.map(interview => (
          <InterviewCard
            key={interview._id}
            interview={interview}
            userRole="recruiter"
            onViewDetails={handleViewDetails}
            onStart={handleStartInterview}
            onReschedule={(iv) => { setSelectedInterview(iv); setShowRescheduleModal(true); }}
            onCancel={(iv) => { setSelectedInterview(iv); setShowCancelModal(true); }}
          />
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
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: '1.75rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>Interview Management</h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Schedule, manage, and track all candidate interviews</p>
        </div>
        <NotificationBell unreadCount={unreadNotifications} />
      </div>

      {renderStatsCards()}
      {renderAnalytics()}

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
        <button
          onClick={() => setShowScheduleModal(true)}
          style={{
            padding: '10px 20px',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            background: 'var(--primary)',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.95rem',
            fontWeight: 500
          }}
        >
          <Calendar size={18} />
          Schedule Interview
        </button>
        <button
          onClick={handleExport}
          style={{
            padding: '10px 16px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.95rem'
          }}
        >
          <Download size={18} />
          Export
        </button>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Job</label>
            <select
              value={filters.jobId}
              onChange={(e) => handleFilterChange('jobId', e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
            >
              <option value="all">All Jobs</option>
              {jobs.map(job => (
                <option key={job._id} value={job._id}>{job.title}</option>
              ))}
            </select>
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

      {/* Schedule Interview Modal */}
      <Modal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        title="Schedule Interview"
        footer={
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setShowScheduleModal(false)}
              style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <PrimaryButton onClick={handleScheduleInterview} loading={saving}>
              Schedule Interview
            </PrimaryButton>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Application / Job</label>
            <select
              value={scheduleForm.applicationId}
              onChange={(e) => setScheduleForm(prev => ({ ...prev, applicationId: e.target.value }))}
              style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
            >
              <option value="">Select an application</option>
              {applications.map(app => (
                <option key={app._id} value={app._id}>
                  {app.jobData?.title || 'Job'} - {app.studentData?.name || 'Student'}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Date</label>
              <input
                type="date"
                value={scheduleForm.date}
                onChange={(e) => setScheduleForm(prev => ({ ...prev, date: e.target.value }))}
                style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Time</label>
              <input
                type="time"
                value={scheduleForm.time}
                onChange={(e) => setScheduleForm(prev => ({ ...prev, time: e.target.value }))}
                style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Duration</label>
              <select
                value={scheduleForm.duration}
                onChange={(e) => setScheduleForm(prev => ({ ...prev, duration: e.target.value }))}
                style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
              >
                {DURATION_OPTIONS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Timezone</label>
              <select
                value={scheduleForm.timezone}
                onChange={(e) => setScheduleForm(prev => ({ ...prev, timezone: e.target.value }))}
                style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
              >
                {TIMEZONE_OPTIONS.map(tz => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Interviewer</label>
            <input
              type="text"
              value={scheduleForm.interviewer}
              onChange={(e) => setScheduleForm(prev => ({ ...prev, interviewer: e.target.value }))}
              placeholder="Interviewer name"
              style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Department</label>
            <input
              type="text"
              value={scheduleForm.department}
              onChange={(e) => setScheduleForm(prev => ({ ...prev, department: e.target.value }))}
              placeholder="Department"
              style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
            />
          </div>
          {scheduleForm.interviewType === 'online' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Meeting Link</label>
              <input
                type="url"
                value={scheduleForm.meetingLink}
                onChange={(e) => setScheduleForm(prev => ({ ...prev, meetingLink: e.target.value }))}
                placeholder="https://meet.example.com/..."
                style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
              />
            </div>
          )}
          {scheduleForm.interviewType === 'on-site' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Location</label>
              <input
                type="text"
                value={scheduleForm.location}
                onChange={(e) => setScheduleForm(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Office address"
                style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
              />
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Notes</label>
            <textarea
              value={scheduleForm.notes}
              onChange={(e) => setScheduleForm(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes..."
              rows={3}
              style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', resize: 'vertical' }}
            />
          </div>
        </div>
      </Modal>

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
                {selectedInterview.candidateData?.name?.charAt(0).toUpperCase() || 'C'}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 4px', fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {selectedInterview.candidateData?.name || 'Candidate'}
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
                <span style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{selectedInterview.time || 'N/A'}</span>
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
                  <a href={selectedInterview.meetingLink} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.95rem', color: 'var(--primary)', textDecoration: 'none' }}>
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

            {selectedInterview.feedback && (
              <div>
                <h4 style={{ margin: '0 0 12px', fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Award size={18} /> Feedback
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {Object.entries(selectedInterview.feedback).filter(([key]) => key !== 'comments').map(([key, value]) => (
                    <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{key.replace(/([A-Z])/g, ' $1')}</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{value}/5</span>
                    </div>
                  ))}
                </div>
                {selectedInterview.feedback.comments && (
                  <p style={{ marginTop: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{selectedInterview.feedback.comments}</p>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Reschedule Modal */}
      <Modal
        isOpen={showRescheduleModal && !!selectedInterview}
        onClose={() => setShowRescheduleModal(false)}
        title="Reschedule Interview"
        footer={
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setShowRescheduleModal(false)}
              style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <PrimaryButton onClick={handleReschedule} loading={saving}>
              Reschedule
            </PrimaryButton>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
            Rescheduling interview with <strong>{selectedInterview?.candidateData?.name}</strong> for <strong>{selectedInterview?.jobData?.title}</strong>
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

      {/* Cancel Modal */}
      <Modal
        isOpen={showCancelModal && !!selectedInterview}
        onClose={() => setShowCancelModal(false)}
        title="Cancel Interview"
        footer={
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setShowCancelModal(false)}
              style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', cursor: 'pointer' }}
            >
              Keep Interview
            </button>
            <button
              onClick={handleCancel}
              disabled={saving}
              style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--danger)', color: 'white', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}
            >
              Cancel Interview
            </button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
            Are you sure you want to cancel the interview with <strong>{selectedInterview?.candidateData?.name}</strong>? This action cannot be undone.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Reason for cancellation</label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Reason for cancellation..."
              rows={3}
              style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', resize: 'vertical' }}
            />
          </div>
        </div>
      </Modal>

      {/* Feedback Modal */}
      <Modal
        isOpen={showFeedbackModal && !!selectedInterview}
        onClose={() => setShowFeedbackModal(false)}
        title="Add Interview Feedback"
        maxWidth="550px"
        footer={
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setShowFeedbackModal(false)}
              style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <PrimaryButton onClick={handleAddFeedback} loading={saving}>
              Submit Feedback
            </PrimaryButton>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {[
              { key: 'communication', label: 'Communication' },
              { key: 'technicalSkills', label: 'Technical Skills' },
              { key: 'problemSolving', label: 'Problem Solving' },
              { key: 'leadership', label: 'Leadership' },
              { key: 'cultureFit', label: 'Culture Fit' },
              { key: 'overallRating', label: 'Overall Rating' }
            ].map(field => (
              <div key={field.key} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>{field.label}</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={feedbackForm[field.key]}
                    onChange={(e) => setFeedbackForm(prev => ({ ...prev, [field.key]: parseInt(e.target.value) }))}
                    style={{ flex: 1 }}
                  />
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', minWidth: '24px', textAlign: 'center' }}>
                    {feedbackForm[field.key]}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Recommendation</label>
            <select
              value={feedbackForm.recommendation}
              onChange={(e) => setFeedbackForm(prev => ({ ...prev, recommendation: e.target.value }))}
              style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
            >
              {RECOMMENDATION_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Comments</label>
            <textarea
              value={feedbackForm.comments}
              onChange={(e) => setFeedbackForm(prev => ({ ...prev, comments: e.target.value }))}
              placeholder="Additional feedback comments..."
              rows={4}
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

export default InterviewManagement;
