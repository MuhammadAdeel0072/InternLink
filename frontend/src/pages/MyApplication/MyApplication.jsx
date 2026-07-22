import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../services/api';
import Loader from '../../../components/Loader/Loader';
import styles from './MyApplication.module.css';
import { Briefcase, MapPin, Clock, Building2 } from 'lucide-react';

const STATUS_FLOW = ['applied', 'viewed', 'under-review', 'shortlisted', 'interview', 'offer', 'accepted', 'rejected'];

const STATUS_COLORS = {
  'applied': '#3b82f6',
  'viewed': '#8b5cf6',
  'under-review': '#f59e0b',
  'shortlisted': '#10b981',
  'interview': '#06b6d4',
  'offer': '#22c55e',
  'accepted': '#16a34a',
  'rejected': '#ef4444'
};

const MyApplications = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchApplications = async () => {
    try {
      const res = await api.get('/jobs/applications/me');
      setApplications(res.data);
    } catch (err) {
      console.error('Failed to fetch applications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchApplications(); }, []);

  const getStatusIndex = (status) => STATUS_FLOW.indexOf(status);

  const handleWithdraw = async (appId) => {
    if (!window.confirm('Withdraw this application?')) return;
    try {
      await api.delete(`/jobs/applications/${appId}`);
      setApplications(prev => prev.filter(a => a._id !== appId));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to withdraw');
    }
  };

  if (loading) return <Loader />;

  return (
    <div className={styles.applicationsContainer}>
      <h2 className={styles.pageTitle}>My Applications</h2>
      <p className={styles.pageSubtitle}>
        Track all your job applications ({applications.length})
      </p>

      {applications.length === 0 ? (
        <div className={`card ${styles.emptyState}`}>
          <Briefcase size={48} className={styles.emptyIcon} />
          <p className={styles.emptyText}>No applications yet. Start applying to jobs!</p>
        </div>
      ) : (
        <div className={styles.applicationsList}>
          {applications.map((app) => {
            const job = app.job;
            const statusIdx = getStatusIndex(app.status);
            
            return (
              <div key={app._id} className={`card ${styles.applicationCard}`}>
                <div className={styles.applicationHeader}>
                  <div className={styles.applicationInfo}>
                    <div className={styles.companyLogo}>
                      {job?.company?.charAt(0) || '?'}
                    </div>
                    <div>
                      <h3 className={styles.jobTitle}>{job?.title || 'Unknown Position'}</h3>
                      <p className={styles.companyName}>{job?.company || 'Unknown Company'}</p>
                      <div className={styles.jobMeta}>
                        <span className={styles.metaItem}>
                          <MapPin size={11} /> {job?.location}
                        </span>
                        <span className={styles.metaItem}>
                          <Clock size={11} /> Applied {new Date(app.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span 
                    className={styles.statusBadge}
                    style={{
                      backgroundColor: STATUS_COLORS[app.status] + '20',
                      color: STATUS_COLORS[app.status]
                    }}
                  >
                    {app.status}
                  </span>
                </div>

                {/* Status Timeline */}
                <div className={styles.timelineContainer}>
                  <div className={styles.timelineDots}>
                    {STATUS_FLOW.slice(0, 5).map((status, idx) => (
                      <React.Fragment key={status}>
                        <div 
                          className={`${styles.timelineDot} ${idx <= statusIdx ? styles.timelineDotActive : ''}`}
                          style={idx <= statusIdx ? { backgroundColor: STATUS_COLORS[STATUS_FLOW[statusIdx]] } : {}}
                        />
                        {idx < 4 && (
                          <div 
                            className={`${styles.timelineLine} ${idx < statusIdx ? styles.timelineLineActive : ''}`}
                            style={idx < statusIdx ? { backgroundColor: STATUS_COLORS[app.status] } : {}}
                          />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                  <div className={styles.timelineLabels}>
                    <span>Applied</span>
                    <span>Review</span>
                    <span>Shortlist</span>
                    <span>Interview</span>
                    <span>Offer</span>
                  </div>
                </div>

                {/* Withdraw Button */}
                {!['accepted', 'rejected', 'offer'].includes(app.status) && (
                  <button
                    onClick={() => handleWithdraw(app._id)}
                    className={styles.withdrawBtn}
                  >
                    Withdraw
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyApplications;