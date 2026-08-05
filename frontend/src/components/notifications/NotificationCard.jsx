import React from 'react';
import { Link } from 'react-router-dom';
import styles from './NotificationCard.module.css';
import {
  UserPlus,
  UserCheck,
  MessageSquare,
  Heart,
  FileText,
  Calendar,
  Briefcase,
  Mail,
  Users,
  Shield,
  AlertTriangle,
  Info,
  ExternalLink,
  Eye
} from 'lucide-react';

const TYPE_ICONS = {
  'connection-request': UserPlus,
  'connection-accept': UserCheck,
  'connection-reject': UserCheck,
  'message': MessageSquare,
  'message-reaction': MessageSquare,
  'mention': MessageSquare,
  'like': Heart,
  'comment': MessageSquare,
  'reply': MessageSquare,
  'share': FileText,
  'post-mention': MessageSquare,
  'job-match': Briefcase,
  'job-saved-update': Briefcase,
  'job-closed': Briefcase,
  'job-reopened': Briefcase,
  'job-expiring': Briefcase,
  'job-published': Briefcase,
  'application-deadline': Calendar,
  'application-submitted': FileText,
  'application-viewed': Eye,
  'application-shortlisted': FileText,
  'application-rejected': FileText,
  'application-accepted': FileText,
  'application-withdrawn': FileText,
  'application-resume-updated': FileText,
  'interview-scheduled': Calendar,
  'interview-rescheduled': Calendar,
  'interview-cancelled': Calendar,
  'interview-reminder': Calendar,
  'interview-feedback': Calendar,
  'interview-confirmed': Calendar,
  'interview-completed': Calendar,
  'interview-no-show': Calendar,
  'offer-sent': Mail,
  'offer-viewed': Mail,
  'offer-accepted': Mail,
  'offer-rejected': Mail,
  'offer-negotiation': Mail,
  'offer-withdrawn': Mail,
  'offer-updated': Mail,
  'offer-expiring': Mail,
  'hiring-created': UserPlus,
  'hiring-onboarding-started': UserPlus,
  'document-uploaded': FileText,
  'document-requested': FileText,
  'document-verified': Shield,
  'document-rejected': FileText,
  'welcome-email-sent': Mail,
  'manager-assigned': Users,
  'office-assigned': Briefcase,
  'equipment-assigned': Briefcase,
  'employee-joined': UserCheck,
  'onboarding-completed': Shield,
  'joining-reminder': Calendar,
  'onboarding-status-update': Shield,
  'join-request-received': Users,
  'recruiter-approved': UserCheck,
  'recruiter-removed': Users,
  'login-new-device': Shield,
  'password-changed': Shield,
  'email-changed': Mail,
  'phone-changed': Mail,
  'failed-login': AlertTriangle,
  'maintenance': AlertTriangle,
  'feature-update': Info,
  'platform-announcement': Info
};

const PRIORITY_COLORS = {
  high: { bg: 'var(--danger-light)', color: 'var(--danger)' },
  medium: { bg: 'var(--warning-light)', color: 'var(--warning)' },
  low: { bg: 'var(--info-light)', color: 'var(--info)' }
};

const CATEGORY_COLORS = {
  system: 'var(--text-muted)',
  network: 'var(--success)',
  message: 'var(--info)',
  job: 'var(--primary)',
  application: 'var(--warning)',
  interview: '#8b5cf6',
  offer: '#f59e0b',
  hiring: 'var(--success)',
  company: 'var(--info)',
  post: 'var(--primary)',
  security: 'var(--danger)'
};

const NotificationCard = ({
  notification,
  onRead,
  onDelete,
  onOpen,
  selected = false,
  showCheckbox = false,
  onToggleSelect
}) => {
  const Icon = TYPE_ICONS[notification.type] || Info;
  const priorityStyle = PRIORITY_COLORS[notification.priority] || PRIORITY_COLORS.medium;
  const categoryColor = CATEGORY_COLORS[notification.category] || 'var(--text-muted)';

  const handleClick = async (e) => {
    if (showCheckbox && onToggleSelect) {
      onToggleSelect(notification._id);
      return;
    }
    if (onOpen) {
      onOpen(notification);
    }
    if (!notification.isRead && onRead) {
      await onRead(notification._id);
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (onDelete) {
      await onDelete(notification._id);
    }
  };

  return (
    <div
      className={`${styles.notificationCard} ${notification.isRead ? styles.read : styles.unread}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick(e)}
    >
      <div className={styles.iconWrapper} style={{ background: `${categoryColor}15`, color: categoryColor }}>
        <Icon size={20} />
      </div>

      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.senderInfo}>
            {notification.sender?.avatar ? (
              <img src={notification.sender.avatar} alt="" className={styles.avatar} />
            ) : (
              <div className={styles.avatarFallback}>
                {notification.sender?.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
            )}
            <div className={styles.texts}>
              <span className={styles.title}>{notification.title}</span>
              <span className={styles.message}>{notification.message}</span>
            </div>
          </div>
          <span className={styles.priorityBadge} style={{ background: priorityStyle.bg, color: priorityStyle.color }}>
            {notification.priority}
          </span>
        </div>

        <div className={styles.footer}>
          <span className={styles.time}>
            {formatTimeAgo(new Date(notification.createdAt))}
          </span>
          {notification.entityId && (
            <Link
              to={`/${notification.entityType}/${notification.entityId}`}
              className={styles.linkBtn}
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink size={12} /> Open
            </Link>
          )}
          {!notification.isRead && <span className={styles.unreadBadge} />}
        </div>
      </div>

      {showCheckbox && onToggleSelect && (
        <label className={styles.checkboxWrapper}>
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggleSelect(notification._id)}
            onClick={(e) => e.stopPropagation()}
          />
          <span className={styles.customCheckbox} />
        </label>
      )}

      <button className={styles.deleteBtn} onClick={handleDelete} title="Delete">
        ×
      </button>
    </div>
  );
};

function formatTimeAgo(date) {
  const now = new Date();
  const diff = now - date;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default NotificationCard;
