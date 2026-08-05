import React, { useState } from 'react';
import {
  Mail, Briefcase, MoreVertical, Archive, Pin,
  Volume2, VolumeX, Trash2
} from 'lucide-react';
import styles from './ConversationInfo.module.css';

const ConversationInfo = ({ conversation, onAction }) => {
  const [showMenu, setShowMenu] = useState(false);
  const { otherUser } = conversation;

  const actions = [
    { label: conversation.isPinned ? 'Unpin Chat' : 'Pin Chat', icon: Pin, action: 'pin' },
    { label: conversation.isMuted ? 'Unmute' : 'Mute', icon: conversation.isMuted ? Volume2 : VolumeX, action: 'mute' },
    { label: conversation.isArchived ? 'Unarchive' : 'Archive', icon: Archive, action: 'archive' },
    { label: 'Delete Chat', icon: Trash2, action: 'delete', danger: true },
  ];

  const handleAction = (actionType) => {
    onAction(actionType, conversation._id);
    setShowMenu(false);
  };

  return (
    <div className={styles.conversationInfo}>
      <div className={styles.infoHeader}>
        <div className={styles.userHeader}>
          <div className={styles.avatarSection}>
            {otherUser.avatar ? (
              <img src={otherUser.avatar} alt="" className={styles.avatarImage} />
            ) : (
              <div className={styles.avatarFallback}>
                {otherUser.name?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className={styles.userDetails}>
            <h3 className={styles.userName}>{otherUser.name}</h3>
            <p className={styles.userHeadline}>{otherUser.headline || otherUser.role}</p>
          </div>
        </div>
        <div className={styles.menuWrapper}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className={styles.menuButton}
          >
            <MoreVertical size={18} />
          </button>
          {showMenu && (
            <>
              <div className={styles.menuOverlay} onClick={() => setShowMenu(false)} />
              <div className={styles.dropdownMenu}>
                {actions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.action}
                      onClick={() => handleAction(action.action)}
                      className={`${styles.menuItem} ${action.danger ? styles.menuItemDanger : ''}`}
                    >
                      <Icon size={16} />
                      {action.label}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      <div className={styles.infoBody}>
        <div className={styles.infoRow}>
          <Mail size={14} className={styles.infoIcon} />
          <span className={styles.infoText}>{otherUser.email}</span>
        </div>
        <div className={styles.infoRow}>
          <Briefcase size={14} className={styles.infoIcon} />
          <span className={styles.infoText}>{otherUser.role}</span>
        </div>
      </div>

      <div className={styles.infoSections}>
        <div className={styles.infoSection}>
          <h4 className={styles.sectionTitle}>Shared Files</h4>
          <p className={styles.sectionPlaceholder}>View all files exchanged in this conversation</p>
        </div>
        <div className={styles.infoSection}>
          <h4 className={styles.sectionTitle}>Shared Images</h4>
          <p className={styles.sectionPlaceholder}>View all images exchanged in this conversation</p>
        </div>
        <div className={styles.infoSection}>
          <h4 className={styles.sectionTitle}>Shared Links</h4>
          <p className={styles.sectionPlaceholder}>View all links shared in this conversation</p>
        </div>
      </div>
    </div>
  );
};

export default ConversationInfo;
