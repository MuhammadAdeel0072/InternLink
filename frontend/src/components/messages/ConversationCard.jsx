import React from 'react';
import { MoreHorizontal, Archive, Pin, Volume2, VolumeX, Trash2, Flag, UserX } from 'lucide-react';
import styles from './ConversationCard.module.css';

const ConversationCard = ({ conversation, isActive, unreadCount, onClick }) => {
  const { otherUser } = conversation;
  const hasUnread = unreadCount > 0;

  return (
    <div
      onClick={onClick}
      className={`${styles.conversationCard} ${isActive ? styles.conversationCardActive : ''}`}
    >
      <div className={styles.avatarWrapper}>
        {otherUser.avatar ? (
          <img src={otherUser.avatar} alt="" className={styles.avatarImage} />
        ) : (
          <div className={styles.avatarFallback}>
            {otherUser.name?.charAt(0).toUpperCase()}
          </div>
        )}
        <span className={styles.onlineIndicator} />
      </div>

      <div className={styles.conversationContent}>
        <div className={styles.conversationHeader}>
          <h4 className={`${styles.conversationName} ${hasUnread ? styles.conversationNameUnread : ''}`}>
            {otherUser.name}
          </h4>
          <span className={styles.conversationTime}>
            {new Date(conversation.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <p className={`${styles.conversationPreview} ${hasUnread ? styles.conversationPreviewUnread : ''}`}>
          {conversation.lastMessage}
        </p>
        {conversation.isMuted && <span className={styles.mutedBadge}>Muted</span>}
      </div>

      {hasUnread && (
        <span className={styles.unreadBadge}>{unreadCount > 99 ? '99+' : unreadCount}</span>
      )}

      {conversation.isPinned && <span className={styles.pinnedBadge}>Pinned</span>}
    </div>
  );
};

export default ConversationCard;
