import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import Loader from '../../components/Loader/Loader';
import Modal from '../../components/Modal/Modal';
import InputField from '../../components/InputField/InputField';
import styles from './Jobs.module.css';
import {
  MapPin,
  DollarSign,
  Search,
  Heart,
  Clock,
  Building2,
  Briefcase,
  X,
  Globe,
  Send
} from 'lucide-react';

const Jobs = () => {
  const { user } = useAuth();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [jobType, setJobType] = useState('');
  const [remote, setRemote] = useState(false);
  const [savedJobs, setSavedJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [applications, setApplications] = useState([]);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [profileResume, setProfileResume] = useState('');
  const [useProfileResume, setUseProfileResume] = useState(true);
  const [coverLetter, setCoverLetter] = useState('');
  const [newResumeFile, setNewResumeFile] = useState(null);
  const [applying, setApplying] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const fetchJobsByTab = async (tab) => {
    setActiveTab(tab);
    if (tab === 'all') fetchJobs({});
    else if (tab === 'internships') fetchJobs({ jobType: 'Internship' });
    else if (tab === 'remote') fetchJobs({ remote: true });
    else if (tab === 'saved') {
      try {
        setLoading(true);
        const res = await api.get('/jobs/saved');
        setJobs(res.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    else if (tab === 'recommended') {
      try {
        setLoading(true);
        const res = await api.get('/jobs/recommended');
        setJobs(res.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
  };

  const fetchJobs = async (searchParams = {}) => {
    try {
      setLoading(true);
      const { search: s = '', location: l = '', jobType: jt = '', remote: r = false } = searchParams;
      const queryParams = new URLSearchParams();
      if (s) queryParams.append('search', s);
      if (l) queryParams.append('location', l);
      if (jt) queryParams.append('jobType', jt);
      if (r) queryParams.append('remote', 'true');
      const res = await api.get(`/jobs?${queryParams.toString()}`);
      setJobs(res.data);
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs({ search: '', location: '', jobType: '', remote: false });
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchJobs({ search, location, jobType, remote });
  };

  const handleSave = async (jobId) => {
    try {
      const res = await api.post(`/jobs/${jobId}/save`);
      if (res.data.saved) {
        setSavedJobs([...savedJobs, jobId]);
      } else {
        setSavedJobs(savedJobs.filter(id => id !== jobId));
      }
    } catch (err) {
      console.error('Save failed:', err);
    }
  };

  const openDetail = (job) => {
    setSelectedJob(job);
    setDetailModalOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const hasApplied = (jobId) => {
    return applications.some((app) => app.job?._id === jobId || app.job === jobId);
  };

  const getTimeAgo = (date) => {
    const days = Math.floor((new Date() - new Date(date)) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return '1 day ago';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? 's' : ''} ago`;
    return `${Math.floor(days / 30)} month${Math.floor(days / 30) > 1 ? 's' : ''} ago`;
  };

  const getJobTypeColor = (type) => {
    const colors = {
      'Internship': '#3b82f6',
      'Full-time': '#10b981',
      'Part-time': '#f59e0b',
      'Contract': '#8b5cf6'
    };
    return colors[type] || '#3b82f6';
  };

  const getWorkModeColor = (mode) => {
    const colors = {
      'remote': '#8b5cf6',
      'hybrid': '#f59e0b',
      'onsite': '#10b981'
    };
    return colors[mode] || '#8b5cf6';
  };

  const fetchProfileResume = async () => {
    try {
      const res = await api.get('/profile/me');
      setProfileResume(res.data.resume || '');
      setUseProfileResume(!!res.data.resume);
    } catch (err) {
      console.error(err);
    }
  };

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    if (!useProfileResume && !newResumeFile) {
      alert('Please upload a resume file.');
      return;
    }
    setApplying(true);
    const formData = new FormData();
    formData.append('coverLetter', coverLetter);
    formData.append('useProfileResume', useProfileResume);
    if (useProfileResume) {
      formData.append('profileResumeUrl', profileResume);
    } else {
      formData.append('resume', newResumeFile);
    }
    try {
      const res = await api.post(`/jobs/${selectedJob._id}/apply`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert(res.data.message);
      setApplyModalOpen(false);
      setCoverLetter('');
      setNewResumeFile(null);
    } catch (err) {
      alert('Application failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className={styles.jobsContainer}>
      
      {/* Search Header */}
      <div className={`card ${styles.searchCard}`}>
        <form onSubmit={handleSearch} className={styles.searchForm}>
          <div className={styles.searchInputWrapper}>
            <Search size={18} className={styles.searchIcon} />
            <input 
              type="text" 
              placeholder="Job title, keywords, or company..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          <div className={styles.locationInputWrapper}>
            <MapPin size={18} className={styles.locationIcon} />
            <input 
              type="text" 
              placeholder="Location..." 
              value={location} 
              onChange={(e) => setLocation(e.target.value)}
              className={styles.locationInput}
            />
          </div>
          <select 
            value={jobType} 
            onChange={(e) => setJobType(e.target.value)}
            className={`form-input ${styles.jobTypeSelect}`}
          >
            <option value="">All Types</option>
            <option value="Internship">Internship</option>
            <option value="Part-time">Part-time</option>
            <option value="Full-time">Full-time</option>
            <option value="Contract">Contract</option>
          </select>
          <div className={styles.remoteCheckboxWrapper}>
            <input 
              type="checkbox" 
              id="remote-check" 
              checked={remote} 
              onChange={(e) => setRemote(e.target.checked)}
              className={styles.remoteCheckbox}
            />
            <label htmlFor="remote-check" className={styles.remoteLabel}>
              Remote
            </label>
          </div>
          <button type="submit" className={`btn btn-primary ${styles.searchBtn}`}>
            Search
          </button>
        </form>
      </div>

      {/* Tab Bar */}
      <div className={styles.tabBar}>
        {[
          { key: 'all', label: '🔍 All Jobs' },
          { key: 'internships', label: '🎓 Internships' },
          { key: 'remote', label: '🏠 Remote' },
          { key: 'recommended', label: '⭐ Recommended' },
          { key: 'saved', label: '❤️ Saved' },
        ].map(tab => (
          <button 
            key={tab.key} 
            onClick={() => fetchJobsByTab(tab.key)}
            className={`${styles.tabBtn} ${activeTab === tab.key ? styles.tabBtnActive : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* JOB CARDS GRID */}
      {loading ? (
        <Loader />
      ) : jobs.length > 0 ? (
        <div className={styles.jobsGrid}>
          {jobs.map((job) => (
            <div
              key={job._id}
              className={styles.jobCard}
            >
              {/* Top Row: Badge + Save */}
              <div className={styles.jobCardHeader}>
                <span 
                  className={styles.jobTypeBadge}
                  style={{
                    backgroundColor: getJobTypeColor(job.jobType) + '20',
                    color: getJobTypeColor(job.jobType)
                  }}
                >
                  {job.workMode === 'remote' ? '🔥 ' : ''}{job.jobType}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); handleSave(job._id); }}
                  className={styles.saveBtn}
                >
                  <Heart 
                    size={20} 
                    fill={savedJobs.includes(job._id) ? '#ef4444' : 'none'}
                    className={savedJobs.includes(job._id) ? styles.savedHeart : ''}
                  />
                </button>
              </div>

              {/* Company + Title */}
              <div className={styles.jobCardBody}>
                <div className={styles.companyInfo}>
                  <div className={styles.companyAvatar}>
                    {job.company?.charAt(0)}
                  </div>
                  <span className={styles.companyName}>{job.company}</span>
                </div>
                <h3 className={styles.jobTitle}>
                  {job.title}
                </h3>
              </div>

              {/* Info Row */}
              <div className={styles.jobInfo}>
                <div className={styles.jobInfoItem}>
                  <MapPin size={13} /> {job.location}
                </div>
                {job.salaryRange && (
                  <div className={styles.jobInfoItem}>
                    <DollarSign size={13} /> {job.salaryRange}
                  </div>
                )}
                <div className={styles.jobInfoItem}>
                  <Globe size={13} style={{ color: getWorkModeColor(job.workMode) }} />
                  <span style={{ color: getWorkModeColor(job.workMode) }} className={styles.workMode}>
                    {job.workMode || 'On-site'}
                  </span>
                </div>
              </div>

              {/* Skills */}
              <div className={styles.skillsContainer}>
                {(job.skills || job.requirements || []).slice(0, 3).map((skill, idx) => (
                  <span key={idx} className={styles.skillTag}>
                    {skill}
                  </span>
                ))}
              </div>

              {/* Footer */}
              <div className={styles.jobCardFooter}>
                <span className={styles.jobTime}>
                  <Clock size={12} /> {getTimeAgo(job.createdAt)}
                </span>
                <button
                  onClick={() => openDetail(job)}
                  className={styles.viewDetailsBtn}
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.noJobs}>
          <Briefcase size={48} className={styles.noJobsIcon} />
          <p className={styles.noJobsText}>No jobs found. Try adjusting your search filters.</p>
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedJob && (
        <Modal
          isOpen={detailModalOpen}
          onClose={() => {
            setDetailModalOpen(false);
            document.body.style.overflow = 'auto';
          }}
          title=""
          footer={null}
        >
          <div className={styles.detailModal}>
            {/* Header */}
            <div className={styles.detailHeader}>
              <div className={styles.detailCompany}>
                <div className={styles.detailCompanyAvatar}>
                  {selectedJob.company?.charAt(0)}
                </div>
                <div>
                  <h2 className={styles.detailTitle}>{selectedJob.title}</h2>
                  <p className={styles.detailCompanyName}>{selectedJob.company}</p>
                </div>
              </div>
            </div>

            {/* Quick Info Badges */}
            <div className={styles.detailBadges}>
              <span className={styles.detailBadge}>
                <MapPin size={14} /> {selectedJob.location}
              </span>
              {selectedJob.salaryRange && (
                <span className={styles.detailBadge}>
                  <DollarSign size={14} /> {selectedJob.salaryRange}
                </span>
              )}
              <span 
                className={styles.detailBadge}
                style={{
                  backgroundColor: getWorkModeColor(selectedJob.workMode) + '20',
                  color: getWorkModeColor(selectedJob.workMode)
                }}
              >
                {selectedJob.workMode || 'On-site'}
              </span>
              <span 
                className={styles.detailBadge}
                style={{
                  backgroundColor: getJobTypeColor(selectedJob.jobType) + '20',
                  color: getJobTypeColor(selectedJob.jobType)
                }}
              >
                {selectedJob.jobType}
              </span>
            </div>

            <hr className={styles.detailDivider} />

            {/* Description */}
            <h4 className={styles.detailSectionTitle}>Description</h4>
            <p className={styles.detailText}>{selectedJob.description}</p>

            {/* Requirements */}
            {selectedJob.requirements?.length > 0 && (
              <>
                <h4 className={styles.detailSectionTitle}>Requirements</h4>
                <ul className={styles.detailList}>
                  {selectedJob.requirements.map((req, idx) => <li key={idx}>{req}</li>)}
                </ul>
              </>
            )}

            {/* Responsibilities */}
            {selectedJob.responsibilities?.length > 0 && (
              <>
                <h4 className={styles.detailSectionTitle}>Responsibilities</h4>
                <ul className={styles.detailList}>
                  {selectedJob.responsibilities.map((resp, idx) => <li key={idx}>{resp}</li>)}
                </ul>
              </>
            )}

            {/* Benefits */}
            {selectedJob.benefits?.length > 0 && (
              <>
                <h4 className={styles.detailSectionTitle}>Benefits</h4>
                <ul className={styles.detailList}>
                  {selectedJob.benefits.map((benefit, idx) => <li key={idx}>{benefit}</li>)}
                </ul>
              </>
            )}

            {/* Skills */}
            <h4 className={styles.detailSectionTitle}>Skills</h4>
            <div className={styles.detailSkills}>
              {(selectedJob.skills || []).map((skill, idx) => (
                <span key={idx} className={styles.detailSkill}>{skill}</span>
              ))}
            </div>

            {/* Action Buttons */}
            <div className={styles.detailActions}>
              <button 
                onClick={() => handleSave(selectedJob._id)}
                className={`${styles.detailSaveBtn} ${savedJobs.includes(selectedJob._id) ? styles.detailSavedBtn : ''}`}
              >
                <Heart size={16} fill={savedJobs.includes(selectedJob._id) ? '#ef4444' : 'none'} />
                {savedJobs.includes(selectedJob._id) ? 'Saved' : 'Save Job'}
              </button>

              <button 
                onClick={() => {
                  const url = `${window.location.origin}/jobs`;
                  navigator.clipboard.writeText(url);
                  alert('Job link copied!');
                }}
                className={styles.detailShareBtn}
              >
                📤 Share
              </button>
              
              <button
                disabled={hasApplied(selectedJob._id)}
                onClick={() => {
                  setDetailModalOpen(false);
                  fetchProfileResume();
                  setApplyModalOpen(true);
                }}
                className={`${styles.detailApplyBtn} ${hasApplied(selectedJob._id) ? styles.detailAppliedBtn : ''}`}
              >
                <Send size={16} />
                {hasApplied(selectedJob._id) ? 'Applied' : 'Apply Now'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* APPLY MODAL */}
      {selectedJob && (
        <Modal
          isOpen={applyModalOpen}
          onClose={() => setApplyModalOpen(false)}
          title={`Apply for ${selectedJob.title}`}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setApplyModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleApplySubmit} disabled={applying}>
                {applying ? 'Submitting...' : 'Submit Application'}
              </button>
            </>
          }
        >
          <form onSubmit={handleApplySubmit}>
            <div className={styles.applyModal}>
              <div className={styles.applyInfo}>
                <span className={styles.applyInfoLabel}>Applying to:</span>
                <span className={styles.applyInfoValue}>{selectedJob.title} at {selectedJob.company}</span>
              </div>

              <div className={styles.resumeSection}>
                <label className={styles.resumeLabel}>Choose Resume</label>
                {profileResume ? (
                  <div className={styles.resumeOptions}>
                    <label className={styles.resumeOption}>
                      <input type="radio" checked={useProfileResume} onChange={() => setUseProfileResume(true)} />
                      <span>Use profile resume</span>
                    </label>
                    <label className={styles.resumeOption}>
                      <input type="radio" checked={!useProfileResume} onChange={() => setUseProfileResume(false)} />
                      <span>Upload new resume</span>
                    </label>
                  </div>
                ) : (
                  <p className={styles.noResumeText}>No resume on profile. Please upload one.</p>
                )}
                {(!profileResume || !useProfileResume) && (
                  <input 
                    type="file" 
                    accept=".pdf" 
                    onChange={(e) => setNewResumeFile(e.target.files[0])}
                    className={styles.fileInput}
                  />
                )}
              </div>

              <InputField 
                label="Cover Letter (Optional)" 
                name="coverLetter" 
                type="textarea" 
                placeholder="Why are you a great fit?" 
                value={coverLetter} 
                onChange={(e) => setCoverLetter(e.target.value)} 
                rows={4} 
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Jobs;