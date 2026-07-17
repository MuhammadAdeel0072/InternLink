import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Loader from '../components/Loader';
import { Bell, Trash2, CheckSquare, Eye, MessageSquare, UserCheck, Heart, FileText, Calendar } from 'lucide-react';

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleNotificationClick = async (notif) => {
    try {
      if (!notif.isRead) {
        await api.put(`/notifications/${notif._id}/read`);
        // Update local state list
        setNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
        );
      }
      if (notif.link) {
        navigate(notif.link);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation(); // Avoid triggering click redirect
    try {
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      await api.delete(`/notifications/${id}`);
    } catch (err) {
      console.error(err);
      fetchNotifications(); // rollback
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      await api.put('/notifications/read-all');
    } catch (err) {
      console.error(err);
      fetchNotifications();
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'connection-request':
        return <Bell size={18} style={{ color: 'var(--warning)' }} />;
      case 'connection-accept':
        return <UserCheck size={18} style={{ color: 'var(--success)' }} />;
      case 'message':
        return <MessageSquare size={18} style={{ color: 'var(--info)' }} />;
      case 'like':
        return <Heart size={18} style={{ color: 'var(--danger)' }} />;
      case 'comment':
        return <MessageSquare size={18} style={{ color: 'var(--primary)' }} />;
      case 'job-application':
        return <FileText size={18} style={{ color: 'var(--success)' }} />;
      default:
        return <Bell size={18} style={{ color: 'var(--text-muted)' }} />;
    }
  };

  if (loading && notifications.length === 0) return <Loader fullPage />;

  return (
    <div style={{ maxWidth: '650px', margin: '0 auto', animation: 'fadeIn 0.3s ease' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Bell size={28} style={{ color: 'var(--primary)' }} />
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>
            Notifications
          </h1>
        </div>

        {notifications.some((n) => !n.isRead) && (
          <button
            onClick={handleMarkAllRead}
            className="btn btn-secondary"
            style={{ padding: '8px 16px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <CheckSquare size={14} /> Mark all read
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {notifications.length > 0 ? (
          notifications.map((notif) => (
            <div
              key={notif._id}
              onClick={() => handleNotificationClick(notif)}
              className="card"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px',
                cursor: 'pointer',
                borderLeft: notif.isRead ? '1px solid var(--border-color)' : '4px solid var(--primary)',
                backgroundColor: notif.isRead ? 'var(--bg-secondary)' : 'rgba(99, 102, 241, 0.05)',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: 0 }}>
                {/* Icon indicator */}
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {getIcon(notif.type)}
                </div>

                {/* Avatar of actor */}
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--bg-tertiary)', overflow: 'hidden', flexShrink: 0 }}>
                  {notif.sender.avatar ? (
                    <img src={notif.sender.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 700 }}>
                      {notif.sender.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: '1.4', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {notif.content}
                  </p>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    <Calendar size={10} />
                    {new Date(notif.createdAt).toLocaleDateString()} at{' '}
                    {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '12px' }}>
                {!notif.isRead && (
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--primary)'
                    }}
                    title="Unread"
                  />
                )}
                <button
                  onClick={(e) => handleDelete(notif._id, e)}
                  style={{
                    color: 'var(--text-muted)',
                    padding: '6px',
                    borderRadius: '50%'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--danger)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                >
                  <Trash2 size={16} />
                </button>
              </div>

            </div>
          ))
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            <p>You have no notifications yet.</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default Notifications;
