import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Loader from '../components/Loader';
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
    <div style={{ maxWidth: '800px', margin: '0 auto', animation: 'fadeIn 0.3s ease' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '4px' }}>My Applications</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.9rem' }}>
        Track all your job applications ({applications.length})
      </p>

      {applications.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          <Briefcase size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
          <p>No applications yet. Start applying to jobs!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {applications.map((app) => {
            const job = app.job;
            const statusIdx = getStatusIndex(app.status);
            
            return (
              <div key={app._id} className="card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 700, fontSize: '1rem' }}>
                      {job?.company?.charAt(0) || '?'}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{job?.title || 'Unknown Position'}</h3>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{job?.company || 'Unknown Company'}</p>
                      <div style={{ display: 'flex', gap: '12px', marginTop: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <span><MapPin size={11} /> {job?.location}</span>
                        <span><Clock size={11} /> Applied {new Date(app.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <span style={{
                    backgroundColor: STATUS_COLORS[app.status] + '20',
                    color: STATUS_COLORS[app.status],
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    textTransform: 'uppercase'
                  }}>
                    {app.status}
                  </span>
                </div>

                {/* Status Timeline */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '12px 0', borderTop: '1px solid var(--border-color)' }}>
                  {STATUS_FLOW.slice(0, 5).map((status, idx) => (
                    <React.Fragment key={status}>
                      <div style={{
                        width: '16px', height: '16px', borderRadius: '50%',
                        backgroundColor: idx <= statusIdx ? STATUS_COLORS[STATUS_FLOW[statusIdx]] : 'var(--bg-tertiary)',
                        border: idx <= statusIdx ? 'none' : '2px solid var(--border-color)',
                        transition: 'all 0.3s'
                      }} />
                      {idx < 4 && (
                        <div style={{
                          flex: 1, height: '2px',
                          backgroundColor: idx < statusIdx ? STATUS_COLORS[app.status] : 'var(--border-color)',
                          transition: 'all 0.3s'
                        }} />
                      )}
                    </React.Fragment>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)', padding: '0 4px' }}>
                  <span>Applied</span><span>Review</span><span>Shortlist</span><span>Interview</span><span>Offer</span>
                </div>

                {/* Withdraw Button */}
                {!['accepted', 'rejected', 'offer'].includes(app.status) && (
                  <button
                    onClick={() => handleWithdraw(app._id)}
                    style={{
                      marginTop: '12px', padding: '6px 14px', borderRadius: '6px',
                      border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444',
                      backgroundColor: 'transparent', fontSize: '0.75rem', cursor: 'pointer'
                    }}>
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