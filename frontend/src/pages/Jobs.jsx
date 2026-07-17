import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import Loader from '../components/Loader';
import Modal from '../components/Modal';
import InputField from '../components/InputField';
import {
  Briefcase,
  MapPin,
  DollarSign,
  Search,
  CheckCircle,
  FileText,
  Plus,
  Send,
  Building
} from 'lucide-react';

const Jobs = () => {
  const { user } = useAuth();
  const { emitNotificationAlert } = useSocket();

  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Search states
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [jobType, setJobType] = useState('');
  const [remote, setRemote] = useState(false);

  // Application details
  const [applications, setApplications] = useState([]);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [profileResume, setProfileResume] = useState('');
  const [useProfileResume, setUseProfileResume] = useState(true);
  const [coverLetter, setCoverLetter] = useState('');
  const [newResumeFile, setNewResumeFile] = useState(null);
  const [applying, setApplying] = useState(false);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);
      if (location) queryParams.append('location', location);
      if (jobType) queryParams.append('jobType', jobType);
      if (remote) queryParams.append('remote', 'true');

      const res = await api.get(`/jobs?${queryParams.toString()}`);
      setJobs(res.data);
      if (res.data.length > 0) {
        setSelectedJob(res.data[0]);
      } else {
        setSelectedJob(null);
      }
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      const res = await api.get('/jobs/applications/me');
      setApplications(res.data);
    } catch (err) {
      console.error('Failed to fetch applications:', err);
    }
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

  useEffect(() => {
    fetchJobs();
    if (user && user.role === 'student') {
      fetchApplications();
      fetchProfileResume();
    }
  }, [user]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchJobs();
  };

  const openApplyModal = () => {
    setApplyModalOpen(true);
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
      fetchApplications();

      // Trigger socket alert
      emitNotificationAlert(selectedJob.recruiter, {
        type: 'job-application',
        content: `A student has applied for your job opening: ${selectedJob.title}`
      });
    } catch (err) {
      alert('Application failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setApplying(false);
    }
  };

  // Helper check if already applied
  const hasApplied = (jobId) => {
    return applications.some((app) => app.job?._id === jobId || app.job === jobId);
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      
      {/* Search Header Container */}
      <div className="card" style={{ marginBottom: '20px', padding: '20px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
          <div style={{ flex: 2, minWidth: '200px', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0 12px' }}>
            <Search size={18} style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Job title, keywords, or company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', padding: '12px 0', border: 'none', backgroundColor: 'transparent', fontSize: '0.9rem', color: 'var(--text-primary)', outline: 'none' }}
            />
          </div>

          <div style={{ flex: 1, minWidth: '150px', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0 12px' }}>
            <MapPin size={18} style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="City, state, or country..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              style={{ width: '100%', padding: '12px 0', border: 'none', backgroundColor: 'transparent', fontSize: '0.9rem', color: 'var(--text-primary)', outline: 'none' }}
            />
          </div>

          <select
            value={jobType}
            onChange={(e) => setJobType(e.target.value)}
            className="form-input"
            style={{ flex: 1, minWidth: '130px', padding: '12px 16px' }}
          >
            <option value="">All Types</option>
            <option value="Internship">Internship</option>
            <option value="Part-time">Part-time</option>
            <option value="Full-time">Full-time</option>
            <option value="Contract">Contract</option>
          </select>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 8px' }}>
            <input
              type="checkbox"
              id="remote-checkbox"
              checked={remote}
              onChange={(e) => setRemote(e.target.checked)}
              style={{ width: '18px', height: '18px' }}
            />
            <label htmlFor="remote-checkbox" className="form-label" style={{ margin: 0, userSelect: 'none' }}>Remote</label>
          </div>

          <button type="submit" className="btn btn-primary" style={{ padding: '12px 24px' }}>
            Search
          </button>
        </form>
      </div>

      {/* Main Board Pane */}
      {loading && jobs.length === 0 ? (
        <Loader />
      ) : (
        <div className="jobs-split-container" style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '20px', minHeight: '500px' }}>
          
          {/* LEFT COLUMN: MASTER LIST */}
          <div className="jobs-master-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxHeight: '70vh', paddingRight: '4px' }}>
            {jobs.length > 0 ? (
              jobs.map((job) => (
                <div
                  key={job._id}
                  onClick={() => setSelectedJob(job)}
                  className="card"
                  style={{
                    padding: '16px',
                    cursor: 'pointer',
                    borderColor: selectedJob?._id === job._id ? 'var(--primary)' : 'var(--border-color)',
                    backgroundColor: selectedJob?._id === job._id ? 'var(--primary-light)' : 'var(--bg-secondary)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                      <Building size={20} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>{job.title}</h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{job.company}</p>
                      
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
                        <span className="badge badge-info" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>{job.jobType}</span>
                        {job.remote && <span className="badge badge-success" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>Remote</span>}
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                          <MapPin size={10} /> {job.location}
                        </span>
                        {hasApplied(job._id) && (
                          <span style={{ color: 'var(--success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}>
                            <CheckCircle size={12} /> Applied
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                No jobs match your search parameters.
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: DETAIL PANE */}
          <div className="jobs-detail-pane">
            {selectedJob ? (
              <div className="card" style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContext: 'space-between', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '20px', marginBottom: '20px' }}>
                  <div>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{selectedJob.title}</h2>
                    <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 500, marginTop: '2px' }}>{selectedJob.company}</p>
                    
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '12px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        <MapPin size={14} /> {selectedJob.location}
                      </span>
                      {selectedJob.salaryRange && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          <DollarSign size={14} /> {selectedJob.salaryRange}
                        </span>
                      )}
                      <span className="badge badge-info" style={{ padding: '2px 8px', fontSize: '0.75rem' }}>{selectedJob.jobType}</span>
                    </div>
                  </div>

                  {user && user.role === 'student' && (
                    <button
                      onClick={openApplyModal}
                      disabled={hasApplied(selectedJob._id)}
                      className="btn btn-primary"
                      style={{ padding: '10px 24px', borderRadius: 'var(--radius-sm)' }}
                    >
                      {hasApplied(selectedJob._id) ? 'Applied' : 'Apply Now'}
                    </button>
                  )}
                </div>

                <div style={{ overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '10px' }}>Job Description</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', lineHeight: '1.6', whiteSpace: 'pre-wrap', marginBottom: '24px' }}>
                    {selectedJob.description}
                  </p>

                  {selectedJob.requirements && selectedJob.requirements.length > 0 && (
                    <div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '10px' }}>Requirements</h3>
                      <ul style={{ paddingLeft: '20px', color: 'var(--text-secondary)', fontSize: '0.925rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {selectedJob.requirements.map((req, idx) => (
                          <li key={idx}>{req}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', textAlign: 'center' }}>
                <div>
                  <Briefcase size={48} style={{ color: 'var(--border-hover)', marginBottom: '16px' }} />
                  <p>Select a job posting from the left to view details and apply.</p>
                </div>
              </div>
            )}
          </div>

        </div>
      )}

      {/* --- APPLICATION MODAL --- */}
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

              {/* Resume Selection */}
              <div className="form-group" style={{ backgroundColor: 'var(--bg-tertiary)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <label className="form-label" style={{ fontWeight: 600, marginBottom: '12px', display: 'block' }}>
                  Choose Resume PDF
                </label>

                {profileResume ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="radio"
                        id="resume-profile"
                        name="resume-source"
                        checked={useProfileResume}
                        onChange={() => setUseProfileResume(true)}
                        style={{ width: '18px', height: '18px' }}
                      />
                      <label htmlFor="resume-profile" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', cursor: 'pointer' }}>
                        <FileText size={16} style={{ color: 'var(--primary)' }} />
                        Use resume saved on my profile
                      </label>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="radio"
                        id="resume-upload"
                        name="resume-source"
                        checked={!useProfileResume}
                        onChange={() => setUseProfileResume(false)}
                        style={{ width: '18px', height: '18px' }}
                      />
                      <label htmlFor="resume-upload" style={{ fontSize: '0.9rem', cursor: 'pointer' }}>
                        Upload a different resume
                      </label>
                    </div>
                  </div>
                ) : (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    No saved resume found on your profile. Please upload one below.
                  </p>
                )}

                {(!profileResume || !useProfileResume) && (
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setNewResumeFile(e.target.files[0])}
                    style={{
                      marginTop: '12px',
                      padding: '8px',
                      width: '100%',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--text-primary)'
                    }}
                  />
                )}
              </div>

              {/* Cover Letter Input */}
              <InputField
                label="Message / Cover Letter (Optional)"
                name="coverLetter"
                type="textarea"
                placeholder="Explain why you are a great fit for this position..."
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                rows={4}
              />
            </div>
          </form>
        </Modal>
      )}

      {/* Split Responsive CSS Layout */}
      <style>{`
        @media (max-width: 768px) {
          .jobs-split-container {
            grid-template-columns: 1fr !important;
          }
          .jobs-detail-pane {
            display: none !important; /* Hide detail pane on lists mobile, or open full modal */
          }
        }
      `}</style>
    </div>
  );
};

export default Jobs;
