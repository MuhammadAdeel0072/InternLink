import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import { Bell, Settings, RefreshCw, CheckSquare, Trash2 } from 'lucide-react';
import NotificationCard from './NotificationCard';
import NotificationSkeleton from './NotificationSkeleton';
import EmptyNotificationState from './EmptyNotificationState';
import styles from './NotificationCenter.module.css';

const NotificationCenter = ({ onClose }) => {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    stats,
    loading,
    refreshing,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    markBulkAsRead,
    bulkDeleteNotifications,
    deleteReadNotifications
  } = useNotifications();

  const [statusFilter, setStatusFilter] = React.useState('all');
  const [categoryFilter, setCategoryFilter] = React.useState('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedIds, setSelectedIds] = React.useState([]);
  const [showBulkActions, setShowBulkActions] = React.useState(false);

  React.useEffect(() => {
    fetchNotifications({ status: statusFilter, category: categoryFilter, search: searchQuery });
  }, [statusFilter, categoryFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchNotifications({ status: statusFilter, category: categoryFilter, search: searchQuery });
  };

  const handleNotificationOpen = (notification) => {
    if (notification.entityId && notification.entityType) {
      navigate(`/${notification.entityType}/${notification.entityId}`);
      onClose?.();
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
    setShowBulkActions(true);
  };

  const handleBulkMarkRead = async () => {
    await markBulkAsRead(selectedIds);
    setSelectedIds([]);
    setShowBulkActions(false);
  };

  const handleBulkDelete = async () => {
    await bulkDeleteNotifications(selectedIds);
    setSelectedIds([]);
    setShowBulkActions(false);
  };

  const handleDeleteRead = async () => {
    await deleteReadNotifications();
  };

  const filteredNotifications = React.useMemo(() => {
    if (statusFilter === 'unread') return notifications.filter(n => !n.isRead);
    if (statusFilter === 'read') return notifications.filter(n => n.isRead);
    return notifications;
  }, [notifications, statusFilter]);

  return (
    <div className={styles.center}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Notifications</h1>
          <span className={styles.subtitle}>
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
          </span>
        </div>
        <div className={styles.headerActions}>
          <button
            className={styles.iconBtn}
            onClick={() => fetchNotifications({ status: statusFilter, category: categoryFilter, search: searchQuery })}
            disabled={refreshing}
            title="Refresh"
          >
            <RefreshCw size={16} className={refreshing ? styles.spinning : ''} />
          </button>
          <button className={styles.iconBtn} onClick={() => navigate('/settings')} title="Notification Settings">
            <Settings size={16} />
          </button>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{stats?.total || 0}</span>
          <span className={styles.statLabel}>Total</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue} style={{ color: 'var(--primary)' }}>{stats?.unread || 0}</span>
          <span className={styles.statLabel}>Unread</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue} style={{ color: 'var(--success)' }}>{stats?.readToday || 0}</span>
          <span className={styles.statLabel}>Today</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue} style={{ color: 'var(--info)' }}>{stats?.thisWeek || 0}</span>
          <span className={styles.statLabel}>This Week</span>
        </div>
      </div>

      <form className={styles.toolbar} onSubmit={handleSearch}>
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="Search notifications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="all">All</option>
          <option value="unread">Unread</option>
          <option value="read">Read</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="all">All Categories</option>
          <option value="system">System</option>
          <option value="network">Network</option>
          <option value="message">Messages</option>
          <option value="job">Jobs</option>
          <option value="application">Applications</option>
          <option value="interview">Interviews</option>
          <option value="offer">Offers</option>
          <option value="hiring">Hiring</option>
          <option value="company">Company</option>
          <option value="post">Posts</option>
          <option value="security">Security</option>
        </select>
        <button type="submit" className={styles.searchBtn}>Search</button>
      </form>

      {(unreadCount > 0 || notifications.some(n => n.isRead)) && (
        <div className={styles.quickActions}>
          {unreadCount > 0 && (
            <button className={styles.quickActionBtn} onClick={markAllAsRead}>
              <CheckSquare size={14} /> Mark All Read
            </button>
          )}
          {notifications.some(n => n.isRead) && (
            <button className={styles.quickActionBtn} onClick={handleDeleteRead}>
              <Trash2 size={14} /> Delete Read
            </button>
          )}
        </div>
      )}

      {showBulkActions && selectedIds.length > 0 && (
        <div className={styles.bulkBar}>
          <span>{selectedIds.length} selected</span>
          <button onClick={handleBulkMarkRead}>Mark Read</button>
          <button onClick={handleBulkDelete}>Delete</button>
          <button onClick={() => { setSelectedIds([]); setShowBulkActions(false); }}>Cancel</button>
        </div>
      )}

      <div className={styles.list}>
        {loading && notifications.length === 0 ? (
          <NotificationSkeleton count={5} />
        ) : filteredNotifications.length === 0 ? (
          <EmptyNotificationState onRefresh={() => fetchNotifications({ status: statusFilter, category: categoryFilter, search: searchQuery })} />
        ) : (
          filteredNotifications.map((notification) => (
            <NotificationCard
              key={notification._id}
              notification={notification}
              onRead={markAsRead}
              onDelete={deleteNotification}
              onOpen={handleNotificationOpen}
              selected={selectedIds.includes(notification._id)}
              showCheckbox={showBulkActions}
              onToggleSelect={handleToggleSelect}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationCenter;
