import React, { useState, useRef, useEffect } from 'react';
import {
  Mail, Briefcase, MoreVertical, Archive, Pin,
  Volume2, VolumeX, Trash2, X
} from 'lucide-react';
import styles from './ConversationInfo.module.css';

const ConversationInfo = ({ conversation, onAction, onClose }) => {
  const [showMenu, setShowMenu] = useState(false);
  const { otherUser } = conversation;
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

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
      <div className={styles.infoPanel} role="complementary" aria-label="Conversation info">
      <div className={styles.infoPanelHeader}>
        <h3 className={styles.infoPanelTitle}>Conversation Info</h3>
        {onClose && (
          <button
            onClick={onClose}
            className={styles.infoPanelClose}
            aria-label="Close info panel"
            title="Close"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className={styles.infoHeader}>
        <div className={styles.userHeader}>
          <div className={styles.avatarSection}>
            {otherUser.avatar ? (
              <img src={otherUser.avatar} alt={otherUser.name} className={styles.avatarImage} loading="lazy" />
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
            ref={menuRef}
            aria-label="More options"
            title="More options"
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
    </div>
  );
};

export default ConversationInfo;
