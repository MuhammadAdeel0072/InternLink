import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../services/api';
import TalentStats from '../../../components/talent/TalentStats';
import TalentSkeleton from '../../../components/talent/TalentSkeleton';
import EmptyTalentState from '../../../components/talent/EmptyTalentState';
import CandidateCard from '../../../components/talent/CandidateCard';
import CollectionSidebar from '../../../components/talent/CollectionSidebar';
import InviteCandidateModal from '../../../components/talent/InviteCandidateModal';
import Modal from '../../../components/Modal/Modal';
import Toast from '../../../components/Toast/Toast';
import Loader from '../../../components/Loader/Loader';
import {
  Search, Filter, Download, Trash2, Archive, UserPlus,
  Grid, List, Users, X, ChevronLeft, ChevronRight, Bell
} from 'lucide-react';
import NotificationBell from '../../../components/notifications/NotificationBell';
import {
  getTalentPool,
  getTalentPoolStats,
  toggleFavorite,
  toggleArchive,
  rateCandidate,
  addNote,
  deleteNote,
  addTag,
  removeFromTalentPool,
  inviteCandidate,
  getCollections,
  exportTalentPool,
  startConversation,
  addToTalentPool
} from '../../../services/talentPoolService';
import styles from './TalentPool.module.css';

const TalentPool = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [collections, setCollections] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 12 });
  const [filters, setFilters] = useState({
    search: '',
    skills: '',
    location: '',
    experience: '',
    education: '',
    availability: '',
    rating: '',
    tags: '',
    status: '',
    sort: 'newest',
    collectionId: '',
    isFavorite: '',
    archived: 'false',
  });
  const [selectedIds, setSelectedIds] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteCandidateData, setInviteCandidateData] = useState(null);
  const [toast, setToast] = useState({ message: '', type: 'success', isVisible: false });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [searchInput, setSearchInput] = useState(filters.search);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const searchTimeoutRef = useRef(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await getTalentPoolStats();
      if (res.success) setStats(res.data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  }, []);

  const fetchCollections = useCallback(async () => {
    try {
      const res = await getCollections();
      if (res.success) setCollections(res.data);
    } catch (err) {
      console.error('Failed to load collections:', err);
    }
  }, []);

  const fetchCandidates = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        sort: filters.sort,
        archived: filters.archived,
        isFavorite: filters.isFavorite,
        rating: filters.rating,
        tags: filters.tags,
        collectionId: filters.collectionId,
        status: filters.status,
      };
      if (filters.search) params.search = filters.search;
      if (filters.skills) params.skills = filters.skills;
      if (filters.location) params.location = filters.location;
      if (filters.experience) params.experience = filters.experience;
      if (filters.education) params.education = filters.education;
      if (filters.availability) params.availability = filters.availability;

      const res = await getTalentPool(params);
      if (res.success) {
        setCandidates(res.data);
        setPagination(res.pagination);
      }
    } catch (err) {
      console.error('Failed to load talent pool:', err);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  useEffect(() => {
    fetchStats();
    fetchCollections();
    fetchUnreadNotifications();
  }, [fetchStats, fetchCollections]);

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
    fetchCandidates();
  }, [fetchCandidates]);

  const handleSearch = useCallback((search) => {
    setFilters(prev => ({ ...prev, search }));
    setPagination(prev => ({ ...prev, page: 1 }));
    setSearchInput(search);
  }, []);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      handleSearch(value);
    }, 300);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      skills: '',
      location: '',
      experience: '',
      education: '',
      availability: '',
      rating: '',
      tags: '',
      status: '',
      sort: 'newest',
      collectionId: '',
      isFavorite: '',
      archived: 'false',
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleViewProfile = (candidateEntry) => {
    navigate(`/recruiter/talent-pool/candidate/${candidateEntry._id}`);
  };

  const handleToggleFavorite = async (id) => {
    try {
      const res = await toggleFavorite(id);
      if (res.success) {
        setCandidates(prev => prev.map(c => c._id === id ? res.data : c));
        setStats(prev => ({ ...prev, favoriteCandidates: res.data.isFavorite ? prev.favoriteCandidates + 1 : prev.favoriteCandidates - 1 }));
        showToast(res.message, 'success');
      }
    } catch (err) {
      showToast('Failed to update favorite', 'error');
    }
  };

  const handleToggleArchive = async (id) => {
    try {
      const res = await toggleArchive(id);
      if (res.success) {
        setCandidates(prev => prev.map(c => c._id === id ? res.data : c));
        showToast(res.message, 'success');
        setTimeout(fetchCandidates, 500);
      }
    } catch (err) {
      showToast('Failed to update archive status', 'error');
    }
  };

  const handleRate = async (id, rating) => {
    try {
      const res = await rateCandidate(id, rating);
      if (res.success) {
        setCandidates(prev => prev.map(c => c._id === id ? res.data : c));
        showToast(res.message, 'success');
      }
    } catch (err) {
      showToast('Failed to rate candidate', 'error');
    }
  };

  const handleAddNote = async (id, text) => {
    try {
      const res = await addNote(id, text);
      if (res.success) {
        setCandidates(prev => prev.map(c => c._id === id ? res.data : c));
        showToast('Note added', 'success');
      }
    } catch (err) {
      showToast('Failed to add note', 'error');
    }
  };

  const handleDeleteNote = async (id, index) => {
    try {
      const res = await deleteNote(id, index);
      if (res.success) {
        setCandidates(prev => prev.map(c => c._id === id ? res.data : c));
        showToast('Note deleted', 'success');
      }
    } catch (err) {
      showToast('Failed to delete note', 'error');
    }
  };

  const handleAddTag = async (id, newTags) => {
    try {
      const res = await addTag(id, newTags);
      if (res.success) {
        setCandidates(prev => prev.map(c => c._id === id ? res.data : c));
        showToast('Tags added', 'success');
      }
    } catch (err) {
      showToast('Failed to add tags', 'error');
    }
  };

  const handleRemoveTag = async (id, tag) => {
    const entry = candidates.find(c => c._id === id);
    if (!entry) return;
    const newTags = entry.tags.filter(t => t !== tag);
    try {
      const res = await addTag(id, newTags);
      if (res.success) {
        setCandidates(prev => prev.map(c => c._id === id ? res.data : c));
        showToast('Tag removed', 'success');
      }
    } catch (err) {
      showToast('Failed to remove tag', 'error');
    }
  };

  const handleRemove = async (id) => {
    if (!window.confirm('Are you sure you want to remove this candidate from your talent pool?')) return;
    try {
      const res = await removeFromTalentPool(id);
      if (res.success) {
        setCandidates(prev => prev.filter(c => c._id !== id));
        setPagination(prev => ({ ...prev, total: prev.total - 1 }));
        showToast(res.message, 'success');
      }
    } catch (err) {
      showToast('Failed to remove candidate', 'error');
    }
  };

  const handleSave = async (entry) => {
    try {
      const res = await addToTalentPool(entry.candidate._id);
      if (res.success) {
        showToast(res.message, 'success');
      } else {
        showToast(res.message, 'error');
      }
    } catch (err) {
      showToast('Failed to save candidate', 'error');
    }
  };

  const handleMessage = async (entry) => {
    try {
      const res = await startConversation(entry.candidate._id);
      if (res.success) {
        navigate(`/messages/${res.data._id}`);
      } else {
        navigate('/messages');
      }
    } catch (err) {
      navigate('/messages');
    }
  };

  const handleInvite = (entry) => {
    setInviteCandidateData(entry.candidate);
    setShowInviteModal(true);
  };

  const handleDownloadResume = (entry) => {
    const profile = entry.profileData;
    if (profile?.resume) {
      window.open(profile.resume, '_blank');
      showToast('Resume opened', 'success');
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type, isVisible: true });
    setTimeout(() => setToast({ message: '', type: 'success', isVisible: false }), 3000);
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectCollection = (collectionId) => {
    setFilters(prev => ({ ...prev, collectionId: collectionId || '' }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleBulkExport = async (format) => {
    if (selectedIds.length === 0) return;
    try {
      const blob = await exportTalentPool(selectedIds, format);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `talent-pool-export.${format === 'excel' ? 'xls' : format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      showToast('Export downloaded', 'success');
    } catch (err) {
      showToast('Failed to export', 'error');
    }
  };

  const handleBulkRemove = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Remove ${selectedIds.length} candidates from talent pool?`)) return;
    try {
      await Promise.all(selectedIds.map(id => removeFromTalentPool(id)));
      setCandidates(prev => prev.filter(c => !selectedIds.includes(c._id)));
      setSelectedIds([]);
      setPagination(prev => ({ ...prev, total: prev.total - selectedIds.length }));
      showToast('Candidates removed', 'success');
    } catch (err) {
      showToast('Failed to remove candidates', 'error');
    }
  };

  const toggleSelectId = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === candidates.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(candidates.map(c => c._id));
    }
  };

  const showArchived = filters.archived === 'true';

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerTitle}>
            <div>
              <h1 className={styles.headerTitleText}>Talent Pool</h1>
              <p className={styles.headerSubtitle}>Build and manage your private database of talented professionals.</p>
            </div>
          </div>
        </div>
        <div className={styles.headerActions}>
          <NotificationBell unreadCount={unreadNotifications} />
          <button className={styles.primaryBtn} onClick={() => setShowInviteModal(true)}>
            <UserPlus size={18} />
            Invite Candidate
          </button>
        </div>
      </div>

      {stats && <TalentStats stats={stats} />}

      <div className={styles.mainLayout}>
        <div className={styles.contentArea}>
          <div className={styles.toolbar}>
            <div className={styles.searchBox}>
              <Search size={18} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search candidates by name, skills, company, university..."
                value={searchInput}
                onChange={handleSearchChange}
                className={styles.searchInput}
              />
              {searchInput && (
                <button onClick={() => handleSearch('')} className={styles.clearBtn}>
                  <X size={16} />
                </button>
              )}
            </div>
            <button
              className={`${styles.filterButton} ${showFilters ? styles.filterButtonActive : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={18} />
              Filters
            </button>
            <div className={styles.toolbarWrapper}>
              <select
                value={filters.sort}
                onChange={(e) => { setFilters(prev => ({ ...prev, sort: e.target.value })); setPagination(prev => ({ ...prev, page: 1 })); }}
                className={styles.sortSelect}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="recently-updated">Recently Updated</option>
                <option value="rating">Highest Rated</option>
                <option value="name">Name (A-Z)</option>
              </select>
              <select
                value={pagination.limit}
                onChange={(e) => setPagination(prev => ({ ...prev, limit: parseInt(e.target.value), page: 1 }))}
                className={`${styles.sortSelect} ${styles.pageSizeSelect}`}
              >
                <option value="12">12 / page</option>
                <option value="24">24 / page</option>
                <option value="48">48 / page</option>
              </select>
            </div>
            <div className={styles.toolbarRight}>
              <div className={styles.viewToggle}>
                <button
                  className={`${styles.viewBtn} ${viewMode === 'grid' ? styles.viewBtnActive : ''}`}
                  onClick={() => setViewMode('grid')}
                  aria-label="Grid view"
                >
                  <Grid size={18} />
                </button>
                <button
                  className={`${styles.viewBtn} ${viewMode === 'list' ? styles.viewBtnActive : ''}`}
                  onClick={() => setViewMode('list')}
                  aria-label="List view"
                >
                  <List size={18} />
                </button>
              </div>
              <button
                className={`${styles.sidebarToggle} ${sidebarOpen ? styles.sidebarToggleActive : ''}`}
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-label="Toggle collections sidebar"
              >
                <Users size={18} />
              </button>
            </div>
          </div>

          {showFilters && (
            <div className={styles.filtersPanel}>
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => { setFilters(prev => ({ ...prev, status: e.target.value })); setPagination(prev => ({ ...prev, page: 1 })); }}
                  className={styles.filterSelect}
                >
                  <option value="">All Candidates</option>
                  <option value="false">Active</option>
                  <option value="true">Archived</option>
                  <option value="isFavorite">Favorites</option>
                </select>
              </div>
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Rating</label>
                <select
                  value={filters.rating}
                  onChange={(e) => { setFilters(prev => ({ ...prev, rating: e.target.value })); setPagination(prev => ({ ...prev, page: 1 })); }}
                  className={styles.filterSelect}
                >
                  <option value="">All Ratings</option>
                  <option value="4">4+ Stars</option>
                  <option value="3">3+ Stars</option>
                  <option value="2">2+ Stars</option>
                  <option value="1">1+ Stars</option>
                </select>
              </div>
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Availability</label>
                <select
                  value={filters.availability}
                  onChange={(e) => { setFilters(prev => ({ ...prev, availability: e.target.value })); setPagination(prev => ({ ...prev, page: 1 })); }}
                  className={styles.filterSelect}
                >
                  <option value="">All Availability</option>
                  <option value="open-to-work">Open to Work</option>
                  <option value="actively-looking">Actively Looking</option>
                  <option value="not-looking">Not Looking</option>
                  <option value="available-later">Available Later</option>
                </select>
              </div>
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Location</label>
                <select
                  value={filters.location}
                  onChange={(e) => { setFilters(prev => ({ ...prev, location: e.target.value })); setPagination(prev => ({ ...prev, page: 1 })); }}
                  className={styles.filterSelect}
                >
                  <option value="">All Locations</option>
                  <option value="remote">Remote</option>
                  <option value="usa">United States</option>
                  <option value="uk">United Kingdom</option>
                  <option value="india">India</option>
                  <option value="canada">Canada</option>
                  <option value="germany">Germany</option>
                  <option value="australia">Australia</option>
                  <option value="singapore">Singapore</option>
                  <option value="uae">UAE</option>
                </select>
              </div>
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Experience</label>
                <select
                  value={filters.experience}
                  onChange={(e) => { setFilters(prev => ({ ...prev, experience: e.target.value })); setPagination(prev => ({ ...prev, page: 1 })); }}
                  className={styles.filterSelect}
                >
                  <option value="">All Experience</option>
                  <option value="0">Internship / Fresher</option>
                  <option value="1">1+ years</option>
                  <option value="2">2+ years</option>
                  <option value="3">3+ years</option>
                  <option value="5">5+ years</option>
                  <option value="10">10+ years</option>
                </select>
              </div>
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Education</label>
                <select
                  value={filters.education}
                  onChange={(e) => { setFilters(prev => ({ ...prev, education: e.target.value })); setPagination(prev => ({ ...prev, page: 1 })); }}
                  className={styles.filterSelect}
                >
                  <option value="">All Education</option>
                  <option value="bachelor">Bachelor's</option>
                  <option value="master">Master's</option>
                  <option value="phd">PhD</option>
                  <option value="diploma">Diploma</option>
                  <option value="certification">Certification</option>
                </select>
              </div>
              {(filters.search || filters.location || filters.rating || filters.availability || filters.status || filters.experience || filters.education) && (
                <button type="button" onClick={handleResetFilters} className={styles.resetBtn}>
                  Reset Filters
                </button>
              )}
            </div>
          )}

          {selectedIds.length > 0 && (
            <div className={styles.bulkActions}>
              <span className={styles.bulkActionsText}>{selectedIds.length} selected</span>
              <button className={styles.bulkButton} onClick={() => handleBulkExport('csv')}>
                <Download size={16} /> Export CSV
              </button>
              <button className={styles.bulkButton} onClick={() => handleBulkExport('excel')}>
                <Download size={16} /> Export Excel
              </button>
              <button className={styles.bulkButton} onClick={() => handleBulkExport('json')}>
                <Download size={16} /> Export JSON
              </button>
              <button className={`${styles.bulkButton} ${styles.bulkButtonDanger}`} onClick={handleBulkRemove}>
                <Trash2 size={16} /> Remove
              </button>
              <button className={styles.bulkButton} onClick={() => setSelectedIds([])}>
                Clear
              </button>
            </div>
          )}

          {loading ? (
            <TalentSkeleton count={pagination.limit} />
          ) : candidates.length === 0 ? (
            <EmptyTalentState type={showArchived ? 'archived' : 'main'} />
          ) : (
            <>
              <div className={viewMode === 'grid' ? styles.grid : styles.list}>
                {candidates.map((entry) => (
                  <CandidateCard
                    key={entry._id}
                    entryId={entry._id}
                    candidate={entry.candidateData}
                    profile={entry.profileData}
                    isFavorite={entry.isFavorite}
                    rating={entry.rating}
                    tags={entry.tags}
                    collections={entry.collections}
                    archived={entry.archived}
                    notes={entry.notes}
                    onViewProfile={() => handleViewProfile(entry)}
                    onToggleFavorite={() => handleToggleFavorite(entry._id)}
                    onToggleArchive={() => handleToggleArchive(entry._id)}
                    onRate={(r) => handleRate(entry._id, r)}
                    onAddNote={(text) => handleAddNote(entry._id, text)}
                    onDeleteNote={(id, index) => handleDeleteNote(id, index)}
                    onAddTag={(tags) => handleAddTag(entry._id, tags)}
                    onRemoveTag={(tag) => handleRemoveTag(entry._id, tag)}
                    onInvite={() => handleInvite(entry)}
                    onMessage={() => handleMessage(entry)}
                    onDownloadResume={() => handleDownloadResume(entry)}
                    onRemove={() => handleRemove(entry._id)}
                    onSave={() => handleSave(entry)}
                  />
                ))}
              </div>

              {pagination.totalPages > 1 && (
                <div className={styles.pagination}>
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className={styles.pageButton}
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <span className={styles.pageInfo}>
                    Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
                  </span>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                    className={styles.pageButton}
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {sidebarOpen && (
          <CollectionSidebar
            collections={collections}
            selectedCollectionId={filters.collectionId}
            onSelectCollection={handleSelectCollection}
            onRefresh={fetchCollections}
          />
        )}
      </div>

      {showInviteModal && inviteCandidateData && (
        <InviteCandidateModal
          isOpen={showInviteModal}
          onClose={() => { setShowInviteModal(false); setInviteCandidateData(null); }}
          candidate={inviteCandidateData}
        />
      )}

      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast({ ...toast, isVisible: false })}
      />
    </div>
  );
};

export default TalentPool;
