import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Loader from '../../components/Loader/Loader';
import styles from './Notifications.module.css';
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
    e.stopPropagation();
    try {
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      await api.delete(`/notifications/${id}`);
    } catch (err) {
      console.error(err);
      fetchNotifications();
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
        return <Bell size={18} className={styles.iconWarning} />;
      case 'connection-accept':
        return <UserCheck size={18} className={styles.iconSuccess} />;
      case 'message':
        return <MessageSquare size={18} className={styles.iconInfo} />;
      case 'like':
        return <Heart size={18} className={styles.iconDanger} />;
      case 'comment':
        return <MessageSquare size={18} className={styles.iconPrimary} />;
      case 'job-application':
        return <FileText size={18} className={styles.iconSuccess} />;
      default:
        return <Bell size={18} className={styles.iconMuted} />;
    }
  };

  if (loading && notifications.length === 0) return <Loader fullPage />;

  return (
    <div className={styles.notificationsContainer}>
      
      <div className={styles.notificationsHeader}>
        <div className={styles.headerLeft}>
          <Bell size={28} className={styles.headerIcon} />
          <h1 className={styles.headerTitle}>
            Notifications
          </h1>
        </div>

        {notifications.some((n) => !n.isRead) && (
          <button
            onClick={handleMarkAllRead}
            className={`btn btn-secondary ${styles.markAllBtn}`}
          >
            <CheckSquare size={14} /> Mark all read
          </button>
        )}
      </div>

      <div className={styles.notificationsList}>
        {notifications.length > 0 ? (
          notifications.map((notif) => (
            <div
              key={notif._id}
              onClick={() => handleNotificationClick(notif)}
              className={`card ${styles.notificationItem} ${notif.isRead ? styles.notificationRead : styles.notificationUnread}`}
            >
              <div className={styles.notificationContent}>
                {/* Icon indicator */}
                <div className={styles.iconContainer}>
                  {getIcon(notif.type)}
                </div>

                {/* Avatar of actor */}
                <div className={styles.avatarContainer}>
                  {notif.sender.avatar ? (
                    <img src={notif.sender.avatar} alt="avatar" className={styles.avatarImage} />
                  ) : (
                    <div className={styles.avatarFallback}>
                      {notif.sender.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                <div className={styles.notificationTextContainer}>
                  <p className={styles.notificationText}>
                    {notif.content}
                  </p>
                  <span className={styles.notificationTime}>
                    <Calendar size={10} />
                    {new Date(notif.createdAt).toLocaleDateString()} at{' '}
                    {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              <div className={styles.notificationActions}>
                {!notif.isRead && (
                  <div
                    className={styles.unreadDot}
                    title="Unread"
                  />
                )}
                <button
                  onClick={(e) => handleDelete(notif._id, e)}
                  className={styles.deleteBtn}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className={styles.emptyState}>
            <p>You have no notifications yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;