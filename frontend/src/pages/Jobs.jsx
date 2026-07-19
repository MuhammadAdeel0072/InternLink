import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Loader from '../components/Loader';
import Modal from '../components/Modal';
import InputField from '../components/InputField';
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
    <div style={{ animation: 'fadeIn 0.3s ease', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Search Header - KEPT AS IS */}
      <div className="card" style={{ marginBottom: '24px', padding: '20px 24px' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          <div style={{ flex: 2, minWidth: '200px', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '0 14px' }}>
            <Search size={18} style={{ color: 'var(--text-muted)' }} />
            <input type="text" placeholder="Job title, keywords, or company..." value={search} onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', padding: '12px 0', border: 'none', backgroundColor: 'transparent', fontSize: '0.9rem', color: 'var(--text-primary)', outline: 'none' }} />
          </div>
          <div style={{ flex: 1, minWidth: '150px', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '0 14px' }}>
            <MapPin size={18} style={{ color: 'var(--text-muted)' }} />
            <input type="text" placeholder="Location..." value={location} onChange={(e) => setLocation(e.target.value)}
              style={{ width: '100%', padding: '12px 0', border: 'none', backgroundColor: 'transparent', fontSize: '0.9rem', color: 'var(--text-primary)', outline: 'none' }} />
          </div>
          <select value={jobType} onChange={(e) => setJobType(e.target.value)}
            className="form-input" style={{ flex: 1, minWidth: '130px', padding: '12px 14px', borderRadius: '12px' }}>
            <option value="">All Types</option>
            <option value="Internship">Internship</option>
            <option value="Part-time">Part-time</option>
            <option value="Full-time">Full-time</option>
            <option value="Contract">Contract</option>
          </select>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input type="checkbox" id="remote-check" checked={remote} onChange={(e) => setRemote(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }} />
            <label htmlFor="remote-check" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', cursor: 'pointer', userSelect: 'none' }}>Remote</label>
          </div>
          <button type="submit" className="btn btn-primary" style={{ padding: '12px 28px', borderRadius: '12px', fontWeight: 600 }}>
            Search
          </button>
        </form>
      </div>

      {/* JOB CARDS GRID */}
      {loading ? (
        <Loader />
      ) : jobs.length > 0 ? (
        <>
          <div className="jobs-grid">
            {jobs.map((job) => (
              <div
                key={job._id}
                className="job-card"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '18px',
                  padding: '22px',
                  cursor: 'default',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '280px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.3)';
                  e.currentTarget.style.borderColor = 'var(--primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                }}
              >
                {/* Top Row: Badge + Save */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span style={{
                    backgroundColor: getJobTypeColor(job.jobType) + '20',
                    color: getJobTypeColor(job.jobType),
                    padding: '5px 12px',
                    borderRadius: '20px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    letterSpacing: '0.3px',
                    textTransform: 'uppercase'
                  }}>
                    {job.workMode === 'remote' ? '🔥 ' : ''}{job.jobType}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleSave(job._id); }}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer', padding: '6px',
                      color: savedJobs.includes(job._id) ? '#ef4444' : 'var(--text-muted)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Heart size={20} fill={savedJobs.includes(job._id) ? '#ef4444' : 'none'} />
                  </button>
                </div>

                {/* Company + Title */}
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '10px',
                      backgroundColor: 'var(--primary-light)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--primary)', fontWeight: 700, fontSize: '0.9rem'
                    }}>
                      {job.company?.charAt(0)}
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{job.company}</span>
                  </div>
                  <h3 style={{
                    fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)',
                    lineHeight: '1.3', marginBottom: '4px'
                  }}>
                    {job.title}
                  </h3>
                </div>

                {/* Info Row */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <MapPin size={13} /> {job.location}
                  </div>
                  {job.salaryRange && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      <DollarSign size={13} /> {job.salaryRange}
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}>
                    <Globe size={13} style={{ color: getWorkModeColor(job.workMode) }} />
                    <span style={{
                      color: getWorkModeColor(job.workMode),
                      fontWeight: 600,
                      textTransform: 'capitalize'
                    }}>
                      {job.workMode || 'On-site'}
                    </span>
                  </div>
                </div>

                {/* Skills */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                  {(job.skills || job.requirements || []).slice(0, 3).map((skill, idx) => (
                    <span key={idx} style={{
                      backgroundColor: 'var(--bg-tertiary)',
                      color: 'var(--text-secondary)',
                      padding: '4px 10px',
                      borderRadius: '14px',
                      fontSize: '0.7rem',
                      fontWeight: 500,
                      border: '1px solid var(--border-color)'
                    }}>
                      {skill}
                    </span>
                  ))}
                </div>

                {/* Footer */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  paddingTop: '14px', borderTop: '1px solid var(--border-color)',
                  marginTop: 'auto'
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    <Clock size={12} /> {getTimeAgo(job.createdAt)}
                  </span>
                  <button
                    onClick={() => openDetail(job)}
                    style={{
                      backgroundColor: 'var(--primary)',
                      color: '#fff',
                      border: 'none',
                      padding: '8px 18px',
                      borderRadius: '10px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--primary-hover)'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--primary)'}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          <Briefcase size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
          <p style={{ fontSize: '1.1rem' }}>No jobs found. Try adjusting your search filters.</p>
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
          <div style={{ maxWidth: '600px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div style={{ display: 'flex', gap: '14px' }}>
                <div style={{
                  width: '52px', height: '52px', borderRadius: '14px',
                  backgroundColor: 'var(--primary-light)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--primary)', fontWeight: 800, fontSize: '1.3rem'
                }}>
                  {selectedJob.company?.charAt(0)}
                </div>
                <div>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>{selectedJob.title}</h2>
                  <p style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{selectedJob.company}</p>
                </div>
              </div>
              
            </div>

            {/* Quick Info Badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '24px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-tertiary)', padding: '6px 12px', borderRadius: '8px' }}>
                <MapPin size={14} /> {selectedJob.location}
              </span>
              {selectedJob.salaryRange && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-tertiary)', padding: '6px 12px', borderRadius: '8px' }}>
                  <DollarSign size={14} /> {selectedJob.salaryRange}
                </span>
              )}
              <span style={{ backgroundColor: getWorkModeColor(selectedJob.workMode) + '20', color: getWorkModeColor(selectedJob.workMode), padding: '6px 12px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 600, textTransform: 'capitalize' }}>
                {selectedJob.workMode || 'On-site'}
              </span>
              <span style={{ backgroundColor: getJobTypeColor(selectedJob.jobType) + '20', color: getJobTypeColor(selectedJob.jobType), padding: '6px 12px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 600 }}>
                {selectedJob.jobType}
              </span>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', marginBottom: '20px' }} />

            {/* Description */}
            <h4 style={{ fontWeight: 600, marginBottom: '8px', fontSize: '0.95rem' }}>Description</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: '1.7', marginBottom: '20px', whiteSpace: 'pre-wrap' }}>
              {selectedJob.description}
            </p>

            {/* Requirements */}
            {selectedJob.requirements?.length > 0 && (
              <>
                <h4 style={{ fontWeight: 600, marginBottom: '8px', fontSize: '0.95rem' }}>Requirements</h4>
                <ul style={{ paddingLeft: '18px', color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {selectedJob.requirements.map((req, idx) => <li key={idx}>{req}</li>)}
                </ul>
              </>
            )}

            {/* Responsibilities */}
            {selectedJob.responsibilities?.length > 0 && (
              <>
                <h4 style={{ fontWeight: 600, marginBottom: '8px', fontSize: '0.95rem' }}>Responsibilities</h4>
                <ul style={{ paddingLeft: '18px', color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {selectedJob.responsibilities.map((resp, idx) => <li key={idx}>{resp}</li>)}
                </ul>
              </>
            )}

            {/* Benefits */}
            {selectedJob.benefits?.length > 0 && (
              <>
                <h4 style={{ fontWeight: 600, marginBottom: '8px', fontSize: '0.95rem' }}>Benefits</h4>
                <ul style={{ paddingLeft: '18px', color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {selectedJob.benefits.map((benefit, idx) => <li key={idx}>{benefit}</li>)}
                </ul>
              </>
            )}

            {/* Skills */}
            <h4 style={{ fontWeight: 600, marginBottom: '8px', fontSize: '0.95rem' }}>Skills</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
              {(selectedJob.skills || []).map((skill, idx) => (
                <span key={idx} style={{
                  backgroundColor: 'var(--primary-light)', color: 'var(--primary)',
                  padding: '6px 14px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 500
                }}>{skill}</span>
              ))}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => handleSave(selectedJob._id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '10px 20px', borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: savedJobs.includes(selectedJob._id) ? 'rgba(239,68,68,0.1)' : 'var(--bg-tertiary)',
                  color: savedJobs.includes(selectedJob._id) ? '#ef4444' : 'var(--text-secondary)',
                  cursor: 'pointer', fontWeight: 500, fontSize: '0.85rem'
                }}>
                <Heart size={16} fill={savedJobs.includes(selectedJob._id) ? '#ef4444' : 'none'} />
                {savedJobs.includes(selectedJob._id) ? 'Saved' : 'Save Job'}
              </button>
              <button
  disabled={hasApplied(selectedJob._id)}
  onClick={() => {
    setDetailModalOpen(false);
    fetchProfileResume();
    setApplyModalOpen(true);
  }}
  style={{
    display: 'flex', alignItems: 'center', gap: '6px',
    padding: '10px 24px', borderRadius: '10px',
    border: 'none',
    backgroundColor: hasApplied(selectedJob._id) ? 'var(--success)' : 'var(--primary)',
    color: '#fff', cursor: hasApplied(selectedJob._id) ? 'default' : 'pointer',
    fontWeight: 600, fontSize: '0.85rem', marginLeft: 'auto'
  }}>
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Applying to:</span>
          <span style={{ fontWeight: 600 }}>{selectedJob.title} at {selectedJob.company}</span>
        </div>

        <div className="form-group" style={{ backgroundColor: 'var(--bg-tertiary)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
          <label className="form-label" style={{ fontWeight: 600, marginBottom: '12px' }}>Choose Resume</label>
          {profileResume ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="radio" checked={useProfileResume} onChange={() => setUseProfileResume(true)} style={{ width: '18px', height: '18px' }} />
                <span style={{ fontSize: '0.9rem' }}>Use profile resume</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="radio" checked={!useProfileResume} onChange={() => setUseProfileResume(false)} style={{ width: '18px', height: '18px' }} />
                <span style={{ fontSize: '0.9rem' }}>Upload new resume</span>
              </label>
            </div>
          ) : (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No resume on profile. Please upload one.</p>
          )}
          {(!profileResume || !useProfileResume) && (
            <input type="file" accept=".pdf" onChange={(e) => setNewResumeFile(e.target.files[0])}
              style={{ marginTop: '12px', padding: '8px', width: '100%', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
          )}
        </div>

        <InputField label="Cover Letter (Optional)" name="coverLetter" type="textarea" placeholder="Why are you a great fit?" value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)} rows={4} />
      </div>
    </form>
  </Modal>
)}

            <style>{`
        .job-card {
          animation: fadeInUp 0.4s ease forwards;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .jobs-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        @media (max-width: 1024px) {
          .jobs-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 640px) {
          .jobs-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default Jobs;