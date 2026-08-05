import React, { useState, useEffect } from 'react';
import { X, Send, Briefcase } from 'lucide-react';
import { inviteCandidate, getRecruiterJobs } from '../../services/talentPoolService';
import styles from './InviteCandidateModal.module.css';

const InviteCandidateModal = ({ isOpen, onClose, candidate }) => {
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingJobs, setFetchingJobs] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });

  useEffect(() => {
    if (isOpen) {
      fetchJobs();
      setSelectedJobId('');
      setMessage('');
      setToast({ show: false, message: '', type: 'info' });
    }
  }, [isOpen]);

  const fetchJobs = async () => {
    try {
      setFetchingJobs(true);
      const res = await getRecruiterJobs();
      if (res.success) {
        const published = res.data.filter(j => j.status === 'published' && j.isActive);
        setJobs(published);
      }
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
    } finally {
      setFetchingJobs(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedJobId) return;

    setLoading(true);
    try {
      const res = await inviteCandidate(candidate._id, selectedJobId, message);
      if (res.success) {
        setToast({ show: true, message: 'Invitation sent successfully!', type: 'success' });
        setTimeout(() => {
          onClose && onClose();
        }, 1200);
      } else {
        setToast({ show: true, message: res.message || 'Failed to send invitation', type: 'error' });
      }
    } catch (err) {
      setToast({ show: true, message: 'Failed to send invitation', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !candidate) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>Invite Candidate</h3>
          <button onClick={onClose} className={styles.closeBtn} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className={styles.candidateInfo}>
          <div className={styles.candidateAvatar}>
            {candidate.avatar ? (
              <img src={candidate.avatar} alt="" />
            ) : (
              <span>{candidate.name?.charAt(0)?.toUpperCase()}</span>
            )}
          </div>
          <div>
            <p className={styles.candidateName}>{candidate.name}</p>
            <p className={styles.candidateHeadline}>{candidate.headline || 'Candidate'}</p>
          </div>
        </div>

        {toast.show && (
          <div className={`${styles.toast} ${styles[toast.type]}`}>
            {toast.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formField}>
            <label className={styles.formLabel}>Select Job</label>
            {fetchingJobs ? (
              <div className={styles.loading}>Loading jobs...</div>
            ) : jobs.length === 0 ? (
              <p className={styles.noJobs}>No published jobs available. Publish a job first.</p>
            ) : (
              <select
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                className={styles.select}
              >
                <option value="">Choose a job...</option>
                {jobs.map((job) => (
                  <option key={job._id} value={job._id}>
                    {job.title} - {job.company} ({job.location})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className={styles.formField}>
            <label className={styles.formLabel}>Message (optional)</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Hi ${candidate.name?.split(' ')[0]}, we have an exciting opportunity...`}
              rows={3}
              className={styles.textarea}
            />
          </div>

          <div className={styles.actions}>
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={loading}>Cancel</button>
            <button
              type="submit"
              disabled={!selectedJobId || loading}
              className="btn btn-primary"
            >
              <Send size={16} />
              {loading ? 'Sending...' : 'Send Invitation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InviteCandidateModal;
