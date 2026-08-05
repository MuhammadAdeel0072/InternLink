import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../services/api';
import Loader from '../../../components/Loader/Loader';
import NotificationBell from '../../../components/notifications/NotificationBell';
import styles from './JobList.module.css';
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Copy,
  Power,
  Trash2,
  Briefcase,
  MapPin,
  Calendar,
  Users,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  FileText,
} from 'lucide-react';

const JOB_TYPES = ['Internship', 'Full-time', 'Part-time', 'Contract', 'Freelance', 'Temporary'];
const JOB_STATUSES = ['draft', 'published', 'closed', 'expired', 'archived'];
const DEPARTMENTS = ['Engineering', 'Marketing', 'Sales', 'Human Resources', 'Finance', 'Operations', 'Design', 'Customer Support'];
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'most-viewed', label: 'Most Viewed' },
  { value: 'most-applications', label: 'Most Applications' },
];

const JobList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    jobType: 'all',
    department: 'all',
    location: 'all',
    sort: 'newest',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const fetchUnreadNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      const unread = res.data.filter((n) => !n.isRead).length;
      setUnreadNotifications(unread);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    fetchJobs();
    fetchUnreadNotifications();
  }, [filters, pagination.page]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: '10',
        ...filters,
      });
      const res = await api.get(`/recruiter/jobs?${params.toString()}`);
      if (res.data.success) {
        setJobs(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (jobId) => {
    if (!window.confirm('Delete this job?\n\nThis action cannot be undone.')) return;
    try {
      await api.delete(`/recruiter/jobs/${jobId}`);
      setJobs(prev => prev.filter(job => job._id !== jobId));
    } catch (err) {
      console.error('Delete job failed:', err);
    }
  };

  const handleClose = async (jobId) => {
    if (!window.confirm('Close this job?\n\nNew applications will no longer be accepted.')) return;
    try {
      await api.post(`/recruiter/jobs/${jobId}/close`);
      setJobs(prev => prev.map(job => job._id === jobId ? { ...job, status: 'closed', isActive: false } : job));
    } catch (err) {
      console.error('Close job failed:', err);
    }
  };

  const handleReopen = async (jobId) => {
    try {
      await api.post(`/recruiter/jobs/${jobId}/reopen`);
      setJobs(prev => prev.map(job => job._id === jobId ? { ...job, status: 'published', isActive: true } : job));
    } catch (err) {
      console.error('Reopen job failed:', err);
    }
  };

  const handlePublish = async (jobId) => {
    try {
      await api.post(`/recruiter/jobs/${jobId}/publish`);
      setJobs(prev => prev.map(job => job._id === jobId ? { ...job, status: 'published', isActive: true } : job));
    } catch (err) {
      console.error('Publish job failed:', err);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { label: 'Draft', className: styles.badgeDraft },
      published: { label: 'Published', className: styles.badgePublished },
      closed: { label: 'Closed', className: styles.badgeClosed },
      expired: { label: 'Expired', className: styles.badgeExpired },
      archived: { label: 'Archived', className: styles.badgeArchived },
    };
    const config = statusConfig[status] || statusConfig.draft;
    return <span className={`${styles.badge} ${config.className}`}>{config.label}</span>;
  };

  const getJobCardStatusClass = (status) => {
    const statusMap = {
      draft: styles.jobCardStatusDraft,
      published: styles.jobCardStatusPublished,
      closed: styles.jobCardStatusClosed,
      expired: styles.jobCardStatusExpired,
      archived: styles.jobCardStatusArchived,
    };
    return statusMap[status] || styles.jobCardStatusDraft;
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const totalJobs = jobs.length;
  const publishedJobs = jobs.filter(j => j.status === 'published').length;
  const draftJobs = jobs.filter(j => j.status === 'draft').length;
  const totalViews = jobs.reduce((sum, j) => sum + (j.views || 0), 0);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Job Management</h1>
          <p className={styles.subtitle}>Manage your job postings and track applications</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <NotificationBell unreadCount={unreadNotifications} />
          <button className={styles.createButton} onClick={() => navigate('/recruiter/jobs/create')}>
            <Plus size={20} />
            Create Job
          </button>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary)' }}>
            <Briefcase size={24} />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{totalJobs}</div>
            <div className={styles.statLabel}>Total Jobs</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)' }}>
            <TrendingUp size={24} />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{publishedJobs}</div>
            <div className={styles.statLabel}>Published</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(107, 114, 128, 0.15)', color: 'var(--text-secondary)' }}>
            <FileText size={24} />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{draftJobs}</div>
            <div className={styles.statLabel}>Drafts</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(6, 182, 212, 0.15)', color: 'var(--info)' }}>
            <Eye size={24} />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{totalViews}</div>
            <div className={styles.statLabel}>Total Views</div>
          </div>
        </div>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search jobs..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
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
              <option value="all">All Statuses</option>
              {JOB_STATUSES.map(status => (
                <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
              ))}
            </select>
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Employment Type</label>
            <select
              value={filters.jobType}
              onChange={(e) => setFilters(prev => ({ ...prev, jobType: e.target.value, page: 1 }))}
              className={styles.filterSelect}
            >
              <option value="all">All Types</option>
              {JOB_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Department</label>
            <select
              value={filters.department}
              onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value, page: 1 }))}
              className={styles.filterSelect}
            >
              <option value="all">All Departments</option>
              {DEPARTMENTS.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {loading ? (
        <Loader fullPage />
      ) : jobs.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyStateIcon}>
            <Briefcase size={32} />
          </div>
          <p>No jobs found. Create your first job posting!</p>
          <button className={styles.createButton} onClick={() => navigate('/recruiter/jobs/create')}>
            <Plus size={20} />
            Create Job
          </button>
        </div>
      ) : (
        <>
          <div className={styles.jobsList}>
            {jobs.map((job) => (
              <div key={job._id} className={`${styles.jobCard} ${getJobCardStatusClass(job.status)}`}>
                <div className={styles.jobHeader}>
                  <div className={styles.jobTitleSection}>
                    <h3 className={styles.jobTitle}>{job.title}</h3>
                    <div className={styles.jobMeta}>
                      <span className={styles.jobType}>{job.jobType}</span>
                      <span className={styles.jobLocation}>
                        <MapPin size={14} />
                        {job.location}
                      </span>
                      <span className={styles.jobDate}>
                        <Calendar size={14} />
                        {formatDate(job.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className={styles.jobActions}>
                    {getStatusBadge(job.status)}
                    <div className={styles.dropdown}>
                      <button
                        className={styles.moreButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDropdown(activeDropdown === job._id ? null : job._id);
                        }}
                      >
                        <MoreVertical size={18} />
                      </button>
                      {activeDropdown === job._id && (
                        <div className={styles.dropdownMenu}>
                          <button onClick={() => { navigate(`/recruiter/jobs/${job._id}`); setActiveDropdown(null); }}>
                            <Eye size={16} /> View
                          </button>
                          <button onClick={() => { navigate(`/recruiter/jobs/${job._id}/edit`); setActiveDropdown(null); }}>
                            <Edit size={16} /> Edit
                          </button>
                          <button onClick={() => { navigate(`/recruiter/jobs/${job._id}/duplicate`); setActiveDropdown(null); }}>
                            <Copy size={16} /> Duplicate
                          </button>
                          {job.status === 'published' ? (
                            <button onClick={() => { handleClose(job._id); setActiveDropdown(null); }}>
                              <Power size={16} /> Close
                            </button>
                          ) : job.status === 'closed' ? (
                            <button onClick={() => { handleReopen(job._id); setActiveDropdown(null); }}>
                              <Power size={16} /> Reopen
                            </button>
                          ) : job.status === 'draft' ? (
                            <button onClick={() => { handlePublish(job._id); setActiveDropdown(null); }}>
                              <TrendingUp size={16} /> Publish
                            </button>
                          ) : null}
                          <button onClick={() => { handleDelete(job._id); setActiveDropdown(null); }} className={styles.deleteOption}>
                            <Trash2 size={16} /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className={styles.jobStats}>
                  <div className={styles.statItem}>
                    <Eye size={16} />
                    <span>{job.views || 0} views</span>
                  </div>
                  <div className={styles.statItem}>
                    <Users size={16} />
                    <span>{job.applicationsCount || 0} applications</span>
                  </div>
                  <div className={styles.statItem}>
                    <Calendar size={16} />
                    <span>Updated {formatDate(job.updatedAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {pagination.pages > 1 && (
            <div className={styles.pagination}>
              <button
                disabled={pagination.page === 1}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                className={styles.paginationButton}
              >
                <ChevronLeft size={18} />
              </button>
              <span className={styles.paginationInfo}>
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                disabled={pagination.page === pagination.pages}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                className={styles.paginationButton}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default JobList;