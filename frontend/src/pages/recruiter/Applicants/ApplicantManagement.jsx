import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../services/api';
import styles from './ApplicantManagement.module.css';
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  MessageSquare,
  Calendar,
  Download,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  GraduationCap,
  Briefcase,
  MapPin,
  Link as LinkIcon,
  CheckSquare,
  Square,
  MoreVertical,
  TrendingUp,
  Send,
  Trash2,
  ClipboardList,
  Award,
  Globe,
  BarChart3,
} from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'applied', label: 'Applied' },
  { value: 'under-review', label: 'Under Review' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'interview', label: 'Interview Scheduled' },
  { value: 'offer', label: 'Offer Sent' },
  { value: 'hired', label: 'Hired' },
  { value: 'rejected', label: 'Rejected' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest Applications' },
  { value: 'oldest', label: 'Oldest Applications' },
  { value: 'highest-experience', label: 'Most Experienced' },
  { value: 'recently-updated', label: 'Recently Updated' },
  { value: 'profile-completion', label: 'Profile Completion' },
  { value: 'alphabetical', label: 'Alphabetical' },
];

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const PIPELINE_STAGES = [
  { value: 'all', label: 'All', icon: Users },
  { value: 'applied', label: 'Applied', icon: FileText },
  { value: 'under-review', label: 'Under Review', icon: Clock },
  { value: 'shortlisted', label: 'Shortlisted', icon: CheckCircle2 },
  { value: 'interview', label: 'Interview', icon: Calendar },
  { value: 'offer', label: 'Offer', icon: Send },
  { value: 'hired', label: 'Hired', icon: Award },
  { value: 'rejected', label: 'Rejected', icon: XCircle },
];

const ApplicantManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [applicants, setApplicants] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 10 });
  const [selectedIds, setSelectedIds] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    jobId: 'all',
    location: '',
    education: '',
    experience: '',
    skills: '',
    appliedDate: '',
    graduationYear: '',
    availability: '',
    sort: 'newest',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [interviewForm, setInterviewForm] = useState({
    type: 'online',
    date: '',
    time: '',
    timezone: 'UTC',
    interviewer: '',
    duration: '30 minutes',
    meetingLink: '',
    notes: ''
  });
  const [noteText, setNoteText] = useState('');
  const [saving, setSaving] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    fetchApplicants();
    fetchAnalytics();
  }, [filters, pagination.page, pagination.limit]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (activeDropdown && !e.target.closest('.dropdown')) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeDropdown]);

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

  const fetchApplicants = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...filters,
      });
      const res = await api.get(`/applicants?${params.toString()}`);
      if (res.data.success) {
        setApplicants(res.data.data);
        setPagination(prev => ({ ...prev, ...res.data.pagination }));
      }
    } catch (err) {
      console.error('Failed to fetch applicants:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/applicants/analytics');
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

  const handleStatusChange = async (applicationId, newStatus, reason = '') => {
    try {
      await api.put(`/applicants/${applicationId}/status`, { status: newStatus, reason });
      fetchApplicants();
      fetchAnalytics();
    } catch (err) {
      console.error('Status update failed:', err);
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    try {
      setSaving(true);
      await api.post(`/applicants/${selectedApplicant._id}/notes`, { text: noteText });
      setNoteText('');
      setShowNoteModal(false);
      fetchApplicants();
    } catch (err) {
      console.error('Add note failed:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleScheduleInterview = async () => {
    try {
      setSaving(true);
      await api.post(`/applicants/${selectedApplicant._id}/interview`, interviewForm);
      setShowInterviewModal(false);
      setInterviewForm({
        type: 'online',
        date: '',
        time: '',
        timezone: 'UTC',
        interviewer: '',
        duration: '30 minutes',
        meetingLink: '',
        notes: ''
      });
      fetchApplicants();
      fetchAnalytics();
    } catch (err) {
      console.error('Schedule interview failed:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleMessage = async (applicationId) => {
    try {
      const res = await api.post(`/applicants/${applicationId}/message`);
      if (res.data.success) {
        navigate(`/messages/${res.data.data._id}`);
      }
    } catch (err) {
      console.error('Message failed:', err);
    }
  };

  const handleBulkAction = async (action) => {
    try {
      if (action === 'message') {
        const promises = selectedIds.map(id => api.post(`/applicants/${id}/message`));
        await Promise.all(promises);
        const firstConv = await api.post(`/applicants/${selectedIds[0]}/message`);
        if (firstConv.data.success) {
          navigate(`/messages/${firstConv.data.data._id}`);
        }
      } else {
        await api.post('/applicants/bulk', { applicantIds: selectedIds, action });
      }
      setSelectedIds([]);
      fetchApplicants();
      fetchAnalytics();
    } catch (err) {
      console.error('Bulk action failed:', err);
    }
  };

  const handleExport = async () => {
    try {
      const res = await api.get('/applicants/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'applicants.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const handleDownloadResume = (e, resumeUrl) => {
    e.stopPropagation();
    if (!resumeUrl) return;
    const link = document.createElement('a');
    link.href = resumeUrl;
    link.setAttribute('download', 'resume');
    link.setAttribute('target', '_blank');
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === applicants.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(applicants.map(a => a._id));
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      applied: { label: 'Applied', className: styles.badgeApplied },
      'under-review': { label: 'Under Review', className: styles.badgeUnderReview },
      shortlisted: { label: 'Shortlisted', className: styles.badgeShortlisted },
      interview: { label: 'Interview', className: styles.badgeInterview },
      offer: { label: 'Offer', className: styles.badgeOffer },
      hired: { label: 'Hired', className: styles.badgeHired },
      rejected: { label: 'Rejected', className: styles.badgeRejected },
    };
    const config = statusConfig[status] || statusConfig.applied;
    return <span className={`${styles.badge} ${config.className}`}>{config.label}</span>;
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getCompletionPercentage = (profile) => {
    if (!profile) return 0;
    return Math.min(profile.completionPercentage || 0, 100);
  };

  const getFileType = (url) => {
    if (!url) return 'Unknown';
    const ext = url.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return 'PDF';
    if (ext === 'docx' || ext === 'doc') return 'DOCX';
    return 'File';
  };

  const handleLimitChange = (e) => {
    const newLimit = parseInt(e.target.value);
    setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }));
  };

  const renderSkeletonCards = () => {
    return Array.from({ length: 5 }).map((_, idx) => (
      <div key={idx} className={styles.applicantCard}>
        <div className={styles.applicantHeader}>
          <div className={styles.applicantInfo}>
            <div className={styles.skeletonAvatar} />
            <div className={styles.skeletonDetails}>
              <div className={styles.skeletonLine} style={{ width: '40%' }} />
              <div className={styles.skeletonLine} style={{ width: '60%' }} />
              <div className={styles.skeletonLine} style={{ width: '30%' }} />
            </div>
          </div>
          <div className={styles.skeletonBadge} />
        </div>
        <div className={styles.skeletonFooter}>
          <div className={styles.skeletonLine} style={{ width: '20%' }} />
          <div className={styles.skeletonActions}>
            <div className={styles.skeletonButton} />
            <div className={styles.skeletonButton} />
            <div className={styles.skeletonButton} />
          </div>
        </div>
      </div>
    ));
  };

  const renderAnalyticsCharts = () => {
    if (!analytics) return null;
    const maxValue = Math.max(analytics.total || 1, 1);
    const chartData = [
      { label: 'Applied', value: analytics.applied || 0, color: 'var(--text-muted)' },
      { label: 'Under Review', value: analytics.underReview || 0, color: 'var(--info)' },
      { label: 'Shortlisted', value: analytics.shortlisted || 0, color: 'var(--primary)' },
      { label: 'Interview', value: analytics.interview || 0, color: '#8b5cf6' },
      { label: 'Offer', value: analytics.offer || 0, color: 'var(--warning)' },
      { label: 'Hired', value: analytics.hired || 0, color: 'var(--success)' },
      { label: 'Rejected', value: analytics.rejected || 0, color: 'var(--danger)' },
    ];

    return (
      <div className={styles.analyticsSection}>
        <h3 className={styles.analyticsTitle}>
          <BarChart3 size={20} />
          Hiring Analytics
        </h3>
        <div className={styles.chartsContainer}>
          <div className={styles.chartBars}>
            {chartData.map(item => (
              <div key={item.label} className={styles.chartBarWrapper}>
                <div className={styles.chartBarLabel}>{item.label}</div>
                <div className={styles.chartBarTrack}>
                  <div
                    className={styles.chartBarFill}
                    style={{
                      width: `${(item.value / maxValue) * 100}%`,
                      background: item.color,
                    }}
                  />
                </div>
                <div className={styles.chartBarValue}>{item.value}</div>
              </div>
            ))}
          </div>
          <div className={styles.chartStats}>
            <div className={styles.chartStatItem}>
              <span className={styles.chartStatLabel}>Avg. Time to Hire</span>
              <span className={styles.chartStatValue}>{analytics.avgReviewTime || 0} days</span>
            </div>
            <div className={styles.chartStatItem}>
              <span className={styles.chartStatLabel}>Resume Downloads</span>
              <span className={styles.chartStatValue}>{analytics.resumeDownloads || 0}</span>
            </div>
            <div className={styles.chartStatItem}>
              <span className={styles.chartStatLabel}>Messages Sent</span>
              <span className={styles.chartStatValue}>{analytics.messagesSent || 0}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Applicants</h1>
          <p className={styles.subtitle}>Manage and review candidates for your jobs</p>
        </div>
      </div>

      {analytics && (
        <div className={styles.statsGrid}>
          <div className={styles.statCard} onClick={() => setFilters(prev => ({ ...prev, status: 'all' }))}>
            <div className={styles.statIcon} style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary)' }}>
              <Users size={24} />
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{analytics.total}</div>
              <div className={styles.statLabel}>Total Applicants</div>
            </div>
          </div>
          <div className={styles.statCard} onClick={() => setFilters(prev => ({ ...prev, status: 'applied' }))}>
            <div className={styles.statIcon} style={{ background: 'rgba(107, 114, 128, 0.15)', color: '#9ca3af' }}>
              <FileText size={24} />
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{analytics.applied}</div>
              <div className={styles.statLabel}>Applied</div>
            </div>
          </div>
          <div className={styles.statCard} onClick={() => setFilters(prev => ({ ...prev, status: 'under-review' }))}>
            <div className={styles.statIcon} style={{ background: 'rgba(6, 182, 212, 0.15)', color: 'var(--info)' }}>
              <Clock size={24} />
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{analytics.underReview}</div>
              <div className={styles.statLabel}>Under Review</div>
            </div>
          </div>
          <div className={styles.statCard} onClick={() => setFilters(prev => ({ ...prev, status: 'shortlisted' }))}>
            <div className={styles.statIcon} style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)' }}>
              <CheckCircle2 size={24} />
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{analytics.shortlisted}</div>
              <div className={styles.statLabel}>Shortlisted</div>
            </div>
          </div>
          <div className={styles.statCard} onClick={() => setFilters(prev => ({ ...prev, status: 'interview' }))}>
            <div className={styles.statIcon} style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6' }}>
              <Calendar size={24} />
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{analytics.interview}</div>
              <div className={styles.statLabel}>Interview</div>
            </div>
          </div>
          <div className={styles.statCard} onClick={() => setFilters(prev => ({ ...prev, status: 'rejected' }))}>
            <div className={styles.statIcon} style={{ background: 'rgba(239, 68, 68, 0.15)', color: 'var(--danger)' }}>
              <XCircle size={24} />
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{analytics.rejected}</div>
              <div className={styles.statLabel}>Rejected</div>
            </div>
          </div>
          <div className={styles.statCard} onClick={() => setFilters(prev => ({ ...prev, status: 'hired' }))}>
            <div className={styles.statIcon} style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)' }}>
              <TrendingUp size={24} />
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{analytics.hired}</div>
              <div className={styles.statLabel}>Hired</div>
            </div>
          </div>
        </div>
      )}

      {renderAnalyticsCharts()}

      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search applicants by name, email, skills, job..."
            value={searchInput}
            onChange={handleSearchChange}
            className={styles.searchInput}
          />
        </div>
        <button className={`${styles.filterButton} ${showFilters ? styles.filterButtonActive : ''}`} onClick={() => setShowFilters(!showFilters)}>
          <Filter size={18} />
          Filters
        </button>
        <select
          value={filters.sort}
          onChange={(e) => setFilters(prev => ({ ...prev, sort: e.target.value, page: 1 }))}
          className={styles.sortSelect}
        >
          {SORT_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <select
          value={pagination.limit}
          onChange={handleLimitChange}
          className={styles.sortSelect}
        >
          {PAGE_SIZE_OPTIONS.map(size => (
            <option key={size} value={size}>{size} / page</option>
          ))}
        </select>
      </div>

      {showFilters && (
        <div className={styles.filtersPanel}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
              className={styles.filterSelect}
            >
              {STATUS_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Job</label>
            <select
              value={filters.jobId}
              onChange={(e) => setFilters(prev => ({ ...prev, jobId: e.target.value, page: 1 }))}
              className={styles.filterSelect}
            >
              <option value="all">All Jobs</option>
              {jobs.map(job => (
                <option key={job._id} value={job._id}>{job.title}</option>
              ))}
            </select>
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Location</label>
            <input
              type="text"
              placeholder="Filter by location"
              value={filters.location}
              onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value, page: 1 }))}
              className={styles.filterSelect}
            />
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Education</label>
            <input
              type="text"
              placeholder="Filter by education"
              value={filters.education}
              onChange={(e) => setFilters(prev => ({ ...prev, education: e.target.value, page: 1 }))}
              className={styles.filterSelect}
            />
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Skills</label>
            <input
              type="text"
              placeholder="Filter by skills"
              value={filters.skills}
              onChange={(e) => setFilters(prev => ({ ...prev, skills: e.target.value, page: 1 }))}
              className={styles.filterSelect}
            />
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Experience (min years)</label>
            <input
              type="number"
              placeholder="e.g. 2"
              value={filters.experience}
              onChange={(e) => setFilters(prev => ({ ...prev, experience: e.target.value, page: 1 }))}
              className={styles.filterSelect}
              min="0"
            />
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Graduation Year</label>
            <input
              type="number"
              placeholder="e.g. 2025"
              value={filters.graduationYear}
              onChange={(e) => setFilters(prev => ({ ...prev, graduationYear: e.target.value, page: 1 }))}
              className={styles.filterSelect}
            />
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Availability</label>
            <select
              value={filters.availability}
              onChange={(e) => setFilters(prev => ({ ...prev, availability: e.target.value, page: 1 }))}
              className={styles.filterSelect}
            >
              <option value="">All</option>
              <option value="looking-internship">Looking for Internship</option>
              <option value="looking-job">Looking for Job</option>
              <option value="employed">Employed</option>
              <option value="student">Student</option>
              <option value="graduate">Graduate</option>
            </select>
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Applied Date</label>
            <input
              type="date"
              value={filters.appliedDate}
              onChange={(e) => setFilters(prev => ({ ...prev, appliedDate: e.target.value, page: 1 }))}
              className={styles.filterSelect}
            />
          </div>
        </div>
      )}

      <div className={styles.pipelineTabs}>
        {PIPELINE_STAGES.map(stage => {
          const Icon = stage.icon;
          const count = stage.value === 'all'
            ? analytics?.total || 0
            : applicants.filter(a => a.status === stage.value).length;
          return (
            <button
              key={stage.value}
              className={`${styles.pipelineTab} ${filters.status === stage.value ? styles.pipelineTabActive : ''}`}
              onClick={() => setFilters(prev => ({ ...prev, status: stage.value, page: 1 }))}
            >
              <Icon size={16} />
              {stage.label}
              <span className={styles.pipelineTabCount}>{count}</span>
            </button>
          );
        })}
      </div>

      {selectedIds.length > 0 && (
        <div className={styles.bulkActions}>
          <span className={styles.bulkActionsText}>{selectedIds.length} selected</span>
          <button className={styles.bulkButton} onClick={() => handleBulkAction('shortlist')}>
            <CheckCircle2 size={16} />
            Shortlist
          </button>
          <button className={`${styles.bulkButton} ${styles.bulkButtonDanger}`} onClick={() => handleBulkAction('reject')}>
            <XCircle size={16} />
            Reject
          </button>
          <button className={`${styles.bulkButton} ${styles.bulkButtonSecondary}`} onClick={() => handleBulkAction('message')}>
            <MessageSquare size={16} />
            Message
          </button>
          <button className={`${styles.bulkButton} ${styles.bulkButtonSecondary}`} onClick={handleExport}>
            <Download size={16} />
            Export
          </button>
          <button className={`${styles.bulkButton} ${styles.bulkButtonSecondary}`} onClick={() => setSelectedIds([])}>
            Clear Selection
          </button>
        </div>
      )}

      {loading ? (
        <div className={styles.loadingContainer}>
          {renderSkeletonCards()}
        </div>
      ) : applicants.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyStateIcon}>
            <Users size={32} />
          </div>
          <p>No applicants yet.</p>
          <p className={styles.emptyStateSubtext}>Once candidates apply for your jobs, they will appear here.</p>
        </div>
      ) : (
        <>
          <div className={styles.applicantsList}>
            {applicants.map((applicant) => (
              <div
                key={applicant._id}
                className={`${styles.applicantCard} ${selectedIds.includes(applicant._id) ? styles.applicantCardSelected : ''}`}
              >
                <div className={styles.applicantHeader}>
                  <div className={styles.applicantInfo}>
                    <input
                      type="checkbox"
                      className={styles.checkbox}
                      checked={selectedIds.includes(applicant._id)}
                      onChange={() => toggleSelect(applicant._id)}
                    />
                    {applicant.studentData?.avatar ? (
                      <img src={applicant.studentData.avatar} alt="" className={styles.avatar} />
                    ) : (
                      <div className={styles.avatarPlaceholder}>
                        {applicant.studentData?.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className={styles.applicantDetails}>
                      <h3 className={styles.applicantName}>{applicant.studentData?.name}</h3>
                      <p className={styles.applicantHeadline}>{applicant.profileData?.headline || 'No headline'}</p>
                      <div className={styles.applicantMeta}>
                        {applicant.profileData?.locationString && (
                          <span className={styles.metaItem}>
                            <MapPin size={14} />
                            {applicant.profileData.locationString}
                          </span>
                        )}
                        <span className={styles.metaItem}>
                          <Briefcase size={14} />
                          {applicant.jobData?.title}
                        </span>
                        <span className={styles.metaItem}>
                          <Clock size={14} />
                          Applied {formatDate(applicant.createdAt)}
                        </span>
                      </div>
                      {applicant.profileData?.skills?.length > 0 && (
                        <div className={styles.skillsList}>
                          {applicant.profileData.skills.slice(0, 5).map((skill, idx) => (
                            <span key={idx} className={styles.skillTag}>{skill.name}</span>
                          ))}
                          {applicant.profileData.skills.length > 5 && (
                            <span className={styles.skillTag}>+{applicant.profileData.skills.length - 5}</span>
                          )}
                        </div>
                      )}
                      {applicant.profileData?.education?.length > 0 && (
                        <div className={styles.educationInfo}>
                          <GraduationCap size={14} />
                          {applicant.profileData.education[0].degree} - {applicant.profileData.education[0].school}
                        </div>
                      )}
                      {applicant.profileData?.experience?.length > 0 && (
                        <div className={styles.experienceInfo}>
                          <Briefcase size={14} />
                          {applicant.profileData.experience[0].title} at {applicant.profileData.experience[0].company}
                        </div>
                      )}
                      {(applicant.profileData?.portfolioLinks?.length > 0 || applicant.profileData?.github || applicant.profileData?.linkedin) && (
                        <div className={styles.portfolioLinks}>
                          {applicant.profileData?.github && (
                            <a href={applicant.profileData.github} target="_blank" rel="noopener noreferrer" className={styles.portfolioLink}>
                              <Globe size={14} /> GitHub
                            </a>
                          )}
                          {applicant.profileData?.linkedin && (
                            <a href={applicant.profileData.linkedin} target="_blank" rel="noopener noreferrer" className={styles.portfolioLink}>
                              <Globe size={14} /> LinkedIn
                            </a>
                          )}
                          {applicant.profileData?.portfolioLinks?.map((link, idx) => (
                            <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer" className={styles.portfolioLink}>
                              <LinkIcon size={14} /> {link.label || link.platform}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className={styles.applicantActions}>
                    {getStatusBadge(applicant.status)}
                    <div className={`dropdown ${styles.dropdown}`}>
                      <button
                        className={styles.actionButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDropdown(activeDropdown === applicant._id ? null : applicant._id);
                        }}
                      >
                        <MoreVertical size={16} />
                      </button>
                      {activeDropdown === applicant._id && (
                        <div className={styles.dropdownMenu}>
                          <button onClick={() => { setSelectedApplicant(applicant); setShowProfileModal(true); setActiveDropdown(null); }}>
                            <Eye size={16} /> View Profile
                          </button>
                          {applicant.status !== 'shortlisted' && (
                            <button onClick={() => { handleStatusChange(applicant._id, 'shortlisted'); setActiveDropdown(null); }}>
                              <CheckCircle2 size={16} /> Shortlist
                            </button>
                          )}
                          {applicant.status !== 'rejected' && (
                            <button onClick={() => { setSelectedApplicant(applicant); setShowRejectModal(true); setActiveDropdown(null); }}>
                              <XCircle size={16} /> Reject
                            </button>
                          )}
                          <button onClick={() => { handleMessage(applicant._id); setActiveDropdown(null); }}>
                            <MessageSquare size={16} /> Message
                          </button>
                          <button onClick={() => { setSelectedApplicant(applicant); setShowInterviewModal(true); setActiveDropdown(null); }}>
                            <Calendar size={16} /> Schedule Interview
                          </button>
                          <button onClick={() => { setSelectedApplicant(applicant); setShowNoteModal(true); setActiveDropdown(null); }}>
                            <ClipboardList size={16} /> Add Note
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className={styles.applicantFooter}>
                  <div className={styles.footerLeft}>
                    <div className={styles.completionBar}>
                      <span>{getCompletionPercentage(applicant.profileData)}% Complete</span>
                      <div className={styles.completionBarInner}>
                        <div className={styles.completionBarFill} style={{ width: `${getCompletionPercentage(applicant.profileData)}%` }} />
                      </div>
                    </div>
                    {applicant.profileData?.resume && (
                      <div className={styles.resumeInfo}>
                        <FileText size={14} />
                        <span className={styles.resumeType}>{getFileType(applicant.profileData.resume)}</span>
                        <span className={styles.resumeUpdated}>Updated {formatDate(applicant.profileData.updatedAt)}</span>
                      </div>
                    )}
                  </div>
                  <div className={styles.footerRight}>
                    {applicant.profileData?.resume && (
                      <button className={styles.actionButton} onClick={(e) => handleDownloadResume(e, applicant.profileData.resume)}>
                        <Download size={16} />
                        Resume
                      </button>
                    )}
                    <button className={styles.actionButton} onClick={() => { setSelectedApplicant(applicant); setShowProfileModal(true); }}>
                      <Eye size={16} />
                      View Profile
                    </button>
                    {applicant.status !== 'shortlisted' && (
                      <button className={`${styles.actionButton} ${styles.actionButtonPrimary}`} onClick={() => handleStatusChange(applicant._id, 'shortlisted')}>
                        <CheckCircle2 size={16} />
                        Shortlist
                      </button>
                    )}
                    {applicant.status !== 'rejected' && (
                      <button className={`${styles.actionButton} ${styles.actionButtonDanger}`} onClick={() => { setSelectedApplicant(applicant); setShowRejectModal(true); }}>
                        <XCircle size={16} />
                        Reject
                      </button>
                    )}
                    <button className={styles.actionButton} onClick={() => handleMessage(applicant._id)}>
                      <MessageSquare size={16} />
                      Message
                    </button>
                    <button className={styles.actionButton} onClick={() => { setSelectedApplicant(applicant); setShowInterviewModal(true); }}>
                      <Calendar size={16} />
                      Interview
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                disabled={pagination.page === 1}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                className={styles.paginationButton}
              >
                <ChevronLeft size={18} />
              </button>
              <span className={styles.paginationInfo}>
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                disabled={pagination.page === pagination.totalPages}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                className={styles.paginationButton}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}

      {/* Profile Modal */}
      {showProfileModal && selectedApplicant && (
        <div className={styles.modalOverlay} onClick={() => setShowProfileModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Applicant Profile</h2>
              <button className={styles.modalClose} onClick={() => setShowProfileModal(false)}>
                <XCircle size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                {selectedApplicant.profileData?.avatar ? (
                  <img src={selectedApplicant.profileData.avatar} alt="" className={styles.avatar} style={{ width: 64, height: 64 }} />
                ) : (
                  <div className={styles.avatarPlaceholder} style={{ width: 64, height: 64, fontSize: '1.5rem' }}>
                    {selectedApplicant.studentData?.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>{selectedApplicant.studentData?.name}</h3>
                  <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{selectedApplicant.profileData?.headline || 'No headline'}</p>
                  <div style={{ marginTop: '8px' }}>{getStatusBadge(selectedApplicant.status)}</div>
                </div>
              </div>

              <div className={styles.profileDetailsGrid}>
                <div className={styles.profileDetailItem}>
                  <span className={styles.profileDetailLabel}>Applied Job</span>
                  <span className={styles.profileDetailValue}>{selectedApplicant.jobData?.title}</span>
                </div>
                <div className={styles.profileDetailItem}>
                  <span className={styles.profileDetailLabel}>Applied Date</span>
                  <span className={styles.profileDetailValue}>{formatDate(selectedApplicant.createdAt)}</span>
                </div>
                <div className={styles.profileDetailItem}>
                  <span className={styles.profileDetailLabel}>Last Updated</span>
                  <span className={styles.profileDetailValue}>{formatDate(selectedApplicant.updatedAt)}</span>
                </div>
                <div className={styles.profileDetailItem}>
                  <span className={styles.profileDetailLabel}>Current Status</span>
                  <span className={styles.profileDetailValue}>{selectedApplicant.profileData?.currentStatus || 'N/A'}</span>
                </div>
              </div>

              {selectedApplicant.profileData?.summary && (
                <div>
                  <h4 style={{ margin: '0 0 8px', fontSize: '1rem', fontWeight: 600 }}>Summary</h4>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{selectedApplicant.profileData.summary}</p>
                </div>
              )}

              {selectedApplicant.profileData?.education?.length > 0 && (
                <div>
                  <h4 style={{ margin: '0 0 12px', fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <GraduationCap size={18} /> Education
                  </h4>
                  {selectedApplicant.profileData.education.map((edu, idx) => (
                    <div key={idx} style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', marginBottom: '8px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{edu.degree}</div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{edu.school}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {edu.startDate && new Date(edu.startDate).getFullYear()} - {edu.endDate ? new Date(edu.endDate).getFullYear() : 'Present'}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedApplicant.profileData?.experience?.length > 0 && (
                <div>
                  <h4 style={{ margin: '0 0 12px', fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Briefcase size={18} /> Experience
                  </h4>
                  {selectedApplicant.profileData.experience.map((exp, idx) => (
                    <div key={idx} style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', marginBottom: '8px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{exp.title}</div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{exp.company}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {exp.startDate && new Date(exp.startDate).getFullYear()} - {exp.endDate ? new Date(exp.endDate).getFullYear() : 'Present'}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedApplicant.profileData?.skills?.length > 0 && (
                <div>
                  <h4 style={{ margin: '0 0 12px', fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Award size={18} /> Skills
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {selectedApplicant.profileData.skills.map((skill, idx) => (
                      <span key={idx} className={styles.skillTag}>{skill.name}</span>
                    ))}
                  </div>
                </div>
              )}

              {selectedApplicant.profileData?.resume && (
                <div>
                  <h4 style={{ margin: '0 0 12px', fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={18} /> Resume
                  </h4>
                  <a href={selectedApplicant.profileData.resume} target="_blank" rel="noopener noreferrer" className={styles.resumeLink}>
                    Download Resume ({getFileType(selectedApplicant.profileData.resume)})
                  </a>
                </div>
              )}

              {selectedApplicant.profileData?.portfolioLinks?.length > 0 && (
                <div>
                  <h4 style={{ margin: '0 0 12px', fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Globe size={18} /> Portfolio
                  </h4>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {selectedApplicant.profileData.portfolioLinks.map((link, idx) => (
                      <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer" className={styles.portfolioLink}>
                        <LinkIcon size={14} /> {link.label || link.platform}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {selectedApplicant.timeline?.length > 0 && (
                <div>
                  <h4 style={{ margin: '0 0 12px', fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={18} /> Timeline
                  </h4>
                  <div className={styles.timeline}>
                    {selectedApplicant.timeline.map((entry, idx) => (
                      <div key={idx} className={styles.timelineItem}>
                        <div className={styles.timelineDate}>{formatDate(entry.timestamp)}</div>
                        <div className={styles.timelineStatus}>{entry.status}</div>
                        {entry.reason && <div className={styles.timelineReason}>{entry.reason}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedApplicant.notes?.length > 0 && (
                <div>
                  <h4 style={{ margin: '0 0 12px', fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ClipboardList size={18} /> Notes
                  </h4>
                  <div className={styles.notesList}>
                    {selectedApplicant.notes.map((note, idx) => (
                      <div key={idx} className={styles.noteItem}>
                        <p className={styles.noteText}>{note.text}</p>
                        <div className={styles.noteDate}>{formatDate(note.createdAt)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Interview Modal */}
      {showInterviewModal && selectedApplicant && (
        <div className={styles.modalOverlay} onClick={() => setShowInterviewModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Schedule Interview</h2>
              <button className={styles.modalClose} onClick={() => setShowInterviewModal(false)}>
                <XCircle size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Interview Type</label>
                <select
                  value={interviewForm.type}
                  onChange={(e) => setInterviewForm(prev => ({ ...prev, type: e.target.value }))}
                  className={styles.select}
                >
                  <option value="online">Online</option>
                  <option value="on-site">On-site</option>
                  <option value="phone">Phone</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Date</label>
                <input
                  type="date"
                  value={interviewForm.date}
                  onChange={(e) => setInterviewForm(prev => ({ ...prev, date: e.target.value }))}
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Time</label>
                <input
                  type="time"
                  value={interviewForm.time}
                  onChange={(e) => setInterviewForm(prev => ({ ...prev, time: e.target.value }))}
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Interviewer</label>
                <input
                  type="text"
                  value={interviewForm.interviewer}
                  onChange={(e) => setInterviewForm(prev => ({ ...prev, interviewer: e.target.value }))}
                  className={styles.input}
                  placeholder="Interviewer name"
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Meeting Link</label>
                <input
                  type="url"
                  value={interviewForm.meetingLink}
                  onChange={(e) => setInterviewForm(prev => ({ ...prev, meetingLink: e.target.value }))}
                  className={styles.input}
                  placeholder="https://..."
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Notes</label>
                <textarea
                  value={interviewForm.notes}
                  onChange={(e) => setInterviewForm(prev => ({ ...prev, notes: e.target.value }))}
                  className={styles.textarea}
                  placeholder="Additional notes..."
                />
              </div>
            </div>
            <div className={styles.modalActions}>
              <button className={`${styles.modalButton} ${styles.modalButtonSecondary}`} onClick={() => setShowInterviewModal(false)}>
                Cancel
              </button>
              <button className={`${styles.modalButton} ${styles.modalButtonPrimary}`} onClick={handleScheduleInterview} disabled={saving}>
                {saving ? 'Sending...' : 'Send Invitation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Note Modal */}
      {showNoteModal && selectedApplicant && (
        <div className={styles.modalOverlay} onClick={() => setShowNoteModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Add Note</h2>
              <button className={styles.modalClose} onClick={() => setShowNoteModal(false)}>
                <XCircle size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Note</label>
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  className={styles.textarea}
                  placeholder="Add a private note..."
                />
              </div>
            </div>
            <div className={styles.modalActions}>
              <button className={`${styles.modalButton} ${styles.modalButtonSecondary}`} onClick={() => setShowNoteModal(false)}>
                Cancel
              </button>
              <button className={`${styles.modalButton} ${styles.modalButtonPrimary}`} onClick={handleAddNote} disabled={saving}>
                {saving ? 'Adding...' : 'Add Note'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedApplicant && (
        <div className={styles.modalOverlay} onClick={() => setShowRejectModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Reject Applicant</h2>
              <button className={styles.modalClose} onClick={() => setShowRejectModal(false)}>
                <XCircle size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                Are you sure you want to reject this applicant? They will be notified.
              </p>
              <div className={styles.formGroup}>
                <label className={styles.label}>Reason (optional, visible only to recruiters)</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className={styles.textarea}
                  placeholder="Reason for rejection..."
                />
              </div>
            </div>
            <div className={styles.modalActions}>
              <button className={`${styles.modalButton} ${styles.modalButtonSecondary}`} onClick={() => { setShowRejectModal(false); setRejectReason(''); }}>
                Cancel
              </button>
              <button className={`${styles.modalButton} ${styles.modalButtonDanger}`} onClick={() => { handleStatusChange(selectedApplicant._id, 'rejected', rejectReason); setShowRejectModal(false); setRejectReason(''); }}>
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicantManagement;
