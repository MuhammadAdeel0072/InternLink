import React from 'react';
import { useOnlineStatus } from '../../context/OnlineStatusContext';
import { formatTimeAgo } from '../../utils/formatters';
import styles from './ConversationCard.module.css';

const ConversationCard = ({ conversation, isActive, unreadCount, onClick }) => {
  const { isOnline } = useOnlineStatus();
  const { otherUser } = conversation;
  const hasUnread = unreadCount > 0;
  const online = isOnline(otherUser?._id);

  return (
    <div
      onClick={onClick}
      className={`${styles.conversationCard} ${isActive ? styles.conversationCardActive : ''}`}
      role="button"
      tabIndex={0}
      aria-label={`Open conversation with ${otherUser?.name}`}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}
    >
      <div className={styles.avatarWrapper}>
        {otherUser.avatar ? (
          <img src={otherUser.avatar} alt={otherUser.name} className={styles.avatarImage} loading="lazy" />
        ) : (
          <div className={styles.avatarFallback}>
            {otherUser.name?.charAt(0).toUpperCase()}
          </div>
        )}
        <span
          className={`${styles.onlineIndicator} ${online ? styles.online : styles.offline}`}
          aria-label={online ? 'Online' : 'Offline'}
        />
      </div>

      <div className={styles.conversationContent}>
        <div className={styles.conversationHeader}>
          <h4 className={`${styles.conversationName} ${hasUnread ? styles.conversationNameUnread : ''}`}>
            {otherUser.name}
          </h4>
          <span className={styles.conversationTime} aria-label={`Last message at ${formatTimeAgo(conversation.lastMessageAt)}`}>
            {formatTimeAgo(conversation.lastMessageAt)}
          </span>
        </div>
        <p className={`${styles.conversationPreview} ${hasUnread ? styles.conversationPreviewUnread : ''}`} title={conversation.lastMessage}>
          {conversation.lastMessage || 'Start a conversation...'}
        </p>
        {conversation.isMuted && <span className={styles.mutedBadge}>Muted</span>}
      </div>

      {hasUnread && (
        <span className={styles.unreadBadge} aria-label={`${unreadCount} unread messages`}>
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}

      {conversation.isPinned && <span className={styles.pinnedBadge} title="Pinned conversation">📌</span>}
    </div>
  );
};

export default ConversationCard;
