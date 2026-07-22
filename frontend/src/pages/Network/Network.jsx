import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import api from '../../services/api';
import Loader from '../../components/Loader/Loader';
import styles from './Network.module.css';
import { Users, UserPlus, Check, X, UserMinus, Sparkles } from 'lucide-react';

const Network = () => {
  const { emitNotificationAlert } = useSocket();
  const [connections, setConnections] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('connections');

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

  const handleConnect = async (userId) => {
    try {
      setSuggestions((prev) => prev.filter((u) => u._id !== userId));
      const res = await api.post(`/connections/request/${userId}`);
      emitNotificationAlert(userId, {
        type: 'connection-request',
        content: 'You received a new connection request.'
      });
    } catch (err) {
      alert(err.response?.data?.message || err.message);
      fetchData();
    }
  };

  const handleAccept = async (requestId, requesterId) => {
    try {
      setPendingRequests((prev) => prev.filter((r) => r._id !== requestId));
      await api.put(`/connections/accept/${requestId}`);
      emitNotificationAlert(requesterId, {
        type: 'connection-accept',
        content: 'Your connection request was accepted.'
      });
      const connRes = await api.get('/connections');
      setConnections(connRes.data);
    } catch (err) {
      alert(err.message);
      fetchData();
    }
  };

  const handleReject = async (requestId) => {
    try {
      setPendingRequests((prev) => prev.filter((r) => r._id !== requestId));
      await api.delete(`/connections/reject/${requestId}`);
    } catch (err) {
      alert(err.message);
      fetchData();
    }
  };

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
    <div className={styles.networkContainer}>
      
      <div className={styles.networkHeader}>
        <Users size={28} className={styles.headerIcon} />
        <h1 className={styles.headerTitle}>
          My Network
        </h1>
      </div>

      {/* Network Navigation Tabs */}
      <div className={styles.tabBar}>
        <button
          onClick={() => setActiveTab('connections')}
          className={`${styles.tabBtn} ${activeTab === 'connections' ? styles.tabBtnActive : ''}`}
        >
          Connections ({connections.length})
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`${styles.tabBtn} ${activeTab === 'requests' ? styles.tabBtnActive : ''}`}
        >
          Received Requests
          {pendingRequests.length > 0 && (
            <span className={styles.requestBadge}>
              {pendingRequests.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('suggestions')}
          className={`${styles.tabBtn} ${activeTab === 'suggestions' ? styles.tabBtnActive : ''}`}
        >
          Suggested Peers
          <Sparkles size={14} className={styles.suggestIcon} />
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'connections' && (
        <div>
          {connections.length > 0 ? (
            <div className={styles.gridContainer}>
              {connections.map((conn) => (
                <div key={conn._id} className={`card ${styles.connectionCard}`}>
                  <div className={styles.avatarLarge}>
                    {conn.avatar ? (
                      <img src={conn.avatar} alt={conn.name} className={styles.avatarImage} />
                    ) : (
                      <div className={styles.avatarFallbackLarge}>
                        {conn.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <h3 className={styles.userName}>{conn.name}</h3>
                  <p className={styles.userHeadline}>
                    {conn.headline || 'Student at InternLink'}
                  </p>
                  
                  <div className={styles.cardActions}>
                    <button 
                      onClick={() => (window.location.href = `/profile/${conn._id}`)}
                      className={`btn btn-secondary ${styles.profileBtn}`}
                    >
                      Profile
                    </button>
                    <button
                      onClick={() => handleRemoveConnection(conn.connectionId, conn._id)}
                      className={`btn btn-danger ${styles.removeBtn}`}
                      title="Remove connection"
                    >
                      <UserMinus size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <p>You haven't added any connections yet. Check suggested peers to grow your network!</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'requests' && (
        <div className={styles.requestsList}>
          {pendingRequests.length > 0 ? (
            pendingRequests.map((req) => (
              <div key={req._id} className={`card ${styles.requestCard}`}>
                <div className={styles.requestUserInfo}>
                  <div className={styles.avatarMedium}>
                    {req.requester.avatar ? (
                      <img src={req.requester.avatar} alt={req.requester.name} className={styles.avatarImage} />
                    ) : (
                      <div className={styles.avatarFallbackMedium}>
                        {req.requester.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className={styles.requestName}>{req.requester.name}</h4>
                    <p className={styles.requestHeadline}>
                      {req.requester.headline || 'Student / Job Seeker'}
                    </p>
                  </div>
                </div>

                <div className={styles.requestActions}>
                  <button
                    onClick={() => handleAccept(req._id, req.requester._id)}
                    className={`btn btn-primary ${styles.acceptBtn}`}
                  >
                    <Check size={14} /> Accept
                  </button>
                  <button
                    onClick={() => handleReject(req._id)}
                    className={`btn btn-secondary ${styles.ignoreBtn}`}
                  >
                    <X size={14} /> Ignore
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className={styles.emptyState}>
              <p>No pending connection requests received.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'suggestions' && (
        <div>
          {suggestions.length > 0 ? (
            <div className={styles.gridContainer}>
              {suggestions.map((userSug) => (
                <div key={userSug._id} className={`card ${styles.suggestionCard}`}>
                  <div className={styles.avatarLarge}>
                    {userSug.avatar ? (
                      <img src={userSug.avatar} alt={userSug.name} className={styles.avatarImage} />
                    ) : (
                      <div className={styles.avatarFallbackLarge}>
                        {userSug.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <h3 className={styles.userName}>{userSug.name}</h3>
                  <p className={styles.userHeadline}>
                    {userSug.headline || 'Student at InternLink'}
                  </p>
                  
                  <div className={styles.cardActions}>
                    <button
                      onClick={() => handleConnect(userSug._id)}
                      className={`btn btn-primary ${styles.connectBtn}`}
                    >
                      <UserPlus size={14} /> Connect
                    </button>
                    <button
                      onClick={() => (window.location.href = `/profile/${userSug._id}`)}
                      className={`btn btn-secondary ${styles.viewBtn}`}
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <p>No new peer suggestions at the moment. Try checking back later!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Network;