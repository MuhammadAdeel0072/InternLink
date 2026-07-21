import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import Loader from '../components/Loader';
import { Users, UserPlus, Check, X, UserMinus, Sparkles } from 'lucide-react';

const Network = () => {
  const { emitNotificationAlert } = useSocket();
  const [connections, setConnections] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('connections'); // 'connections', 'requests', 'suggestions'

  const fetchData = async () => {
    try {
      setLoading(true);
      const connRes = await api.get('/connections');
      console.log('Connections:', connRes.data);
      const pendRes = await api.get('/connections/pending');
      const suggRes = await api.get('/connections/suggestions');

      setConnections(connRes.data);
      setPendingRequests(pendRes.data);
      setSuggestions(suggRes.data);
    } catch (err) {
      console.error('Failed to load network data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Connect request sender
  const handleConnect = async (userId) => {
    try {
      // Optimistic UI updates
      setSuggestions((prev) => prev.filter((u) => u._id !== userId));
      
      const res = await api.post(`/connections/request/${userId}`);
      // Notify recipient via socket
      emitNotificationAlert(userId, {
        type: 'connection-request',
        content: 'You received a new connection request.'
      });
    } catch (err) {
      alert(err.response?.data?.message || err.message);
      fetchData(); // Rollback
    }
  };

  // Accept request handler
  const handleAccept = async (requestId, requesterId) => {
    try {
      // Optimistic UI updates
      setPendingRequests((prev) => prev.filter((r) => r._id !== requestId));
      
      await api.put(`/connections/accept/${requestId}`);
      
      // Notify recipient
      emitNotificationAlert(requesterId, {
        type: 'connection-accept',
        content: 'Your connection request was accepted.'
      });

      // Reload lists
      const connRes = await api.get('/connections');
      setConnections(connRes.data);
    } catch (err) {
      alert(err.message);
      fetchData();
    }
  };

  // Reject/Ignore request handler
  const handleReject = async (requestId) => {
    try {
      setPendingRequests((prev) => prev.filter((r) => r._id !== requestId));
      await api.delete(`/connections/reject/${requestId}`);
    } catch (err) {
      alert(err.message);
      fetchData();
    }
  };

  // Remove existing connection
  const handleRemoveConnection = async (connectionId, targetUserId) => {
    if (!window.confirm('Are you sure you want to remove this connection?')) return;
    try {
      setConnections((prev) => prev.filter((c) => c.connectionId !== connectionId));
      await api.delete(`/connections/reject/${connectionId}`);
    } catch (err) {
      alert(err.message);
      fetchData();
    }
  };

  if (loading && connections.length === 0) return <Loader fullPage />;

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto', animation: 'fadeIn 0.3s ease' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <Users size={28} style={{ color: 'var(--primary)' }} />
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>
          My Network
        </h1>
      </div>

      {/* Network Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-color)',
          marginBottom: '24px',
          gap: '24px'
        }}
      >
        <button
          onClick={() => setActiveTab('connections')}
          style={{
            padding: '12px 8px',
            fontSize: '0.95rem',
            fontWeight: 600,
            borderBottom: activeTab === 'connections' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'connections' ? 'var(--primary)' : 'var(--text-secondary)'
          }}
        >
          Connections ({connections.length})
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          style={{
            padding: '12px 8px',
            fontSize: '0.95rem',
            fontWeight: 600,
            borderBottom: activeTab === 'requests' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'requests' ? 'var(--primary)' : 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          Received Requests
          {pendingRequests.length > 0 && (
            <span style={{ fontSize: '0.75rem', backgroundColor: 'var(--danger)', color: '#fff', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {pendingRequests.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('suggestions')}
          style={{
            padding: '12px 8px',
            fontSize: '0.95rem',
            fontWeight: 600,
            borderBottom: activeTab === 'suggestions' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'suggestions' ? 'var(--primary)' : 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          Suggested Peers
          <Sparkles size={14} style={{ color: 'var(--warning)' }} />
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'connections' && (
        <div>
          {connections.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
              {connections.map((conn) => (
                <div key={conn._id} className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '20px' }}>
                  <div style={{ width: '70px', height: '70px', borderRadius: '50%', backgroundColor: 'var(--bg-tertiary)', overflow: 'hidden', marginBottom: '12px' }}>
                    {conn.avatar ? (
                      <img src={conn.avatar} alt={conn.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 700, fontSize: '1.5rem' }}>
                        {conn.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>{conn.name}</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '4px 0 16px', minHeight: '38px', overflow: 'hidden' }}>
                    {conn.headline || 'Student at InternLink'}
                  </p>
                  
                  <div style={{ display: 'flex', gap: '8px', width: '100%', marginTop: 'auto' }}>
                    <button onClick={() => (window.location.href = `/profile/${conn._id}`)}
  className="btn btn-secondary"
  style={{ flex: 1, padding: '8px', fontSize: '0.8rem' }}
>
  Profile
</button>
                    <button
                      onClick={() => handleRemoveConnection(conn.connectionId, conn._id)}
                      className="btn btn-danger"
                      style={{ padding: '8px', display: 'flex', alignItems: 'center' }}
                      title="Remove connection"
                    >
                      <UserMinus size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              <p>You haven't added any connections yet. Check suggested peers to grow your network!</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'requests' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {pendingRequests.length > 0 ? (
            pendingRequests.map((req) => (
              <div key={req._id} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--bg-tertiary)', overflow: 'hidden' }}>
                    {req.requester.avatar ? (
                      <img src={req.requester.avatar} alt={req.requester.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 700 }}>
                        {req.requester.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>{req.requester.name}</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {req.requester.headline || 'Student / Job Seeker'}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleAccept(req._id, req.requester._id)}
                    className="btn btn-primary"
                    style={{ padding: '8px 16px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Check size={14} /> Accept
                  </button>
                  <button
                    onClick={() => handleReject(req._id)}
                    className="btn btn-secondary"
                    style={{ padding: '8px', display: 'flex', alignItems: 'center' }}
                  >
                    <X size={14} /> Ignore
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              <p>No pending connection requests received.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'suggestions' && (
        <div>
          {suggestions.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
              {suggestions.map((userSug) => (
                <div key={userSug._id} className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '20px' }}>
                  <div style={{ width: '70px', height: '70px', borderRadius: '50%', backgroundColor: 'var(--bg-tertiary)', overflow: 'hidden', marginBottom: '12px' }}>
                    {userSug.avatar ? (
                      <img src={userSug.avatar} alt={userSug.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 700, fontSize: '1.5rem' }}>
                        {userSug.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>{userSug.name}</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '4px 0 16px', minHeight: '38px', overflow: 'hidden' }}>
                    {userSug.headline || 'Student at InternLink'}
                  </p>
                  
                  <div style={{ display: 'flex', gap: '8px', width: '100%', marginTop: 'auto' }}>
                    <button
                      onClick={() => handleConnect(userSug._id)}
                      className="btn btn-primary"
                      style={{ flex: 1, padding: '8px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                    >
                      <UserPlus size={14} /> Connect
                    </button>
                    <button
                      onClick={() => (window.location.href = `/profile/${userSug._id}`)}
                      className="btn btn-secondary"
                      style={{ padding: '8px', fontSize: '0.8rem' }}
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              <p>No new peer suggestions at the moment. Try checking back later!</p>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default Network;
