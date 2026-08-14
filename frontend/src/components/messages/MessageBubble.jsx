import React, { useState, useRef, useEffect } from 'react';
import {
  Smile, Edit3, Trash2,
  CheckCheck, Check, Clock, Download, Copy, AlertCircle, CornerDownLeft
} from 'lucide-react';
import { formatMessageTime } from '../../utils/formatters';
import styles from './MessageBubble.module.css';

const REACTION_EMOJIS = ['👍', '❤️', '😂', '🎉', '😮', '😢', '👏', '🔥'];

const MessageBubble = ({
  message,
  isMine,
  onReply,
  onReact,
  onEdit,
  onDelete,
  onScrollToMessage,
  currentUserId,
  showAvatar = true,
  isGrouped = false,
  isTail = true,
  showActions = true
}) => {
  const [showReactions, setShowReactions] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.message || '');
  const menuRef = useRef(null);
  const reactionRefs = useRef({});

  // Close actions menu and reaction picker on outside click / Escape
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
      if (showReactions && reactionRefs.current.picker && !reactionRefs.current.picker.contains(e.target)) {
        setShowReactions(false);
      }
    };
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setShowMenu(false);
        setShowReactions(false);
      }
    };
    if (showMenu || showReactions) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showMenu, showReactions]);

  // Group reactions by emoji and include whether the current user reacted
  const groupedReactions = (() => {
    if (!message.reactions?.length) return [];
    const map = new Map();
    const myId = currentUserId?.toString();
    message.reactions.forEach((r) => {
      const key = r.emoji;
      const userId = r.userId?.toString?.() || r.userId?.toString?.();
      if (!map.has(key)) {
        map.set(key, { emoji: key, count: 0, users: [] });
      }
      const entry = map.get(key);
      entry.count += 1;
      if (userId && myId && userId === myId) {
        entry.users.push('me');
      } else {
        entry.users.push(userId);
      }
    });
    return Array.from(map.values());
  })();

  const getStatusIcon = () => {
    if (!isMine) return null;
    const status = message.status || 'sent';
    if (status === 'sent') return <Clock size={14} className={styles.statusIcon} />;
    if (status === 'delivered') return <Check size={14} className={styles.statusIcon} />;
    if (status === 'read') return <CheckCheck size={14} className={styles.statusIcon} />;
    if (status === 'sending') return <Clock size={14} className={`${styles.statusIcon} ${styles.statusSending}`} />;
    if (status === 'failed') return <AlertCircle size={14} className={`${styles.statusIcon} ${styles.statusFailed}`} />;
    return <Clock size={14} className={styles.statusIcon} />;
  };

  const handleReact = (emoji) => {
    onReact(message._id, emoji);
    setShowReactions(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setShowMenu(false);
  };

  const handleSaveEdit = async () => {
    const trimmed = editText.trim();
    if (trimmed && trimmed !== message.message) {
      await onEdit(message._id, trimmed);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    }
    if (e.key === 'Escape') {
      setEditText(message.message || '');
      setIsEditing(false);
    }
  };

  const handleCopy = () => {
    if (message.message) {
      navigator.clipboard.writeText(message.message);
    }
  };

  const handleDeleteForEveryone = async () => {
    if (window.confirm('Delete this message for everyone?')) {
      await onDelete(message._id, true);
      setShowMenu(false);
    }
  };

  // Build a tooltip title showing who reacted
  const getReactionTitle = (group) => {
    const meIdx = group.users.indexOf('me');
    const others = group.users.filter((u) => u !== 'me');
    let text = '';
    if (meIdx !== -1) text += 'You';
    if (others.length > 0) {
      text += (text ? ', ' : '') + (others.length === 1 ? '1 other' : `${others.length} others`);
    }
    if (!text) text = `${group.count} reaction${group.count > 1 ? 's' : ''}`;
    return text;
  };

  const isDeleted = message.deleted;
  const isDeletedForMe = message.deletedFor?.some((id) => id?.toString() === currentUserId?.toString());
  const bubbleClass = isMine ? styles.messageBubbleMine : styles.messageBubbleOther;
  const wrapperClass = isMine ? styles.messageWrapperMine : styles.messageWrapperOther;

  const bubbleRadiusClass = isGrouped
    ? (isMine ? styles.bubbleRadiusMine : styles.bubbleRadiusOther)
    : '';

  const shouldShowMenu = showActions && !isEditing && (isMine || !isGrouped);

  if (isDeletedForMe || isDeleted) {
    return (
      <div className={`${styles.messageWrapper} ${wrapperClass} ${isGrouped ? styles.grouped : ''}`}>
        <div className={`${styles.messageBubble} ${bubbleClass} ${styles.messageBubbleDeleted} ${bubbleRadiusClass}`}>
          <p className={styles.deletedText}>This message was deleted</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${styles.messageWrapper} ${wrapperClass} ${isGrouped ? styles.grouped : ''}`}
    >
      {!isMine && showAvatar && (
        <div className={styles.avatarPlaceholder}>
          {message.sender?.name?.charAt(0).toUpperCase() || '?'}
        </div>
      )}

      <div
        className={`${styles.messageBubble} ${bubbleClass} ${bubbleRadiusClass}`}
        onMouseEnter={() => shouldShowMenu && setShowMenu(true)}
        onMouseLeave={() => shouldShowMenu && setShowMenu(false)}
        onDoubleClick={() => onReply(message)}
        role="button"
        tabIndex={0}
        aria-label={`Message from ${message.sender?.name || 'Unknown'}. Double-click to reply.`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            const tag = (e.target.tagName || '').toLowerCase();
            if (tag === 'a' || tag === 'button' || tag === 'input' || tag === 'textarea' || tag === 'img') {
              return;
            }
            e.preventDefault();
            onReply(message);
          }
        }}
      >
        {message.replyTo && (
          <div
            className={styles.replyContainer}
            onClick={() => onScrollToMessage?.(message.replyTo.messageId)}
            role="button"
            tabIndex={0}
            aria-label={`Jump to original message from ${message.replyTo.senderName}`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onScrollToMessage?.(message.replyTo.messageId);
              }
            }}
          >
            <div className={styles.replyBar} />
            <div className={styles.replyContent}>
              <span className={styles.replySender}>{message.replyTo.senderName || 'Unknown'}</span>
              <p className={styles.replyText}>
                {message.replyTo.text?.substring(0, 80)}
                {message.replyTo.text?.length > 80 && '...'}
              </p>
            </div>
          </div>
        )}

        {isEditing ? (
          <div className={styles.editContainer}>
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className={styles.editInput}
              autoFocus
              onKeyDown={handleKeyDown}
              rows={Math.max(1, (editText.match(/\n/g) || []).length + 1)}
            />
            <div className={styles.editActions}>
              <button onClick={handleSaveEdit} className={styles.editSave} aria-label="Save edit">
                Save
              </button>
              <button
                onClick={() => {
                  setEditText(message.message || '');
                  setIsEditing(false);
                }}
                className={styles.editCancel}
                aria-label="Cancel edit"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            {message.message && <p className={styles.messageText}>{message.message}</p>}

            {message.attachments?.map((attachment, idx) => (
              <div key={idx} className={styles.attachmentContainer}>
                {attachment.type === 'image' ? (
                  <img
                    src={attachment.url}
                    alt={attachment.name}
                    className={styles.messageImage}
                    onClick={() => window.open(attachment.url, '_blank')}
                    loading="lazy"
                  />
                ) : (
                  <a
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.documentLink}
                  >
                    <div className={styles.documentIcon}>
                      <Download size={20} />
                    </div>
                    <div className={styles.documentInfo}>
                      <span className={styles.documentName}>{attachment.name}</span>
                      <span className={styles.documentMeta}>
                        {attachment.size ? `${(attachment.size / 1024).toFixed(1)} KB` : 'File'}
                      </span>
                    </div>
                  </a>
                )}
              </div>
            ))}

            {/* Reactions Display */}
            {groupedReactions.length > 0 && (
              <div className={styles.reactionsDisplay}>
                {groupedReactions.map((group, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`${styles.reactionBadge} ${group.users.includes('me') ? styles.myReaction : ''}`}
                    onClick={() => onReact(message._id, group.emoji)}
                    title={getReactionTitle(group)}
                    aria-label={`${group.emoji}, ${getReactionTitle(group)}`}
                  >
                    <span className={styles.reactionEmoji}>{group.emoji}</span>
                    <span className={styles.reactionCount}>{group.count}</span>
                  </button>
                ))}
              </div>
            )}

            <div className={styles.messageFooter}>
              <span
                className={styles.messageTime}
                aria-label={`Sent at ${formatMessageTime(message.createdAt)}`}
              >
                {formatMessageTime(message.createdAt)}
                {message.edited && <span className={styles.editedBadge}> (edited)</span>}
              </span>
              {getStatusIcon()}
            </div>
          </>
        )}

        {showActions && !isEditing && (
          <div
            className={`${styles.actionsContainer} ${showMenu ? styles.actionsVisible : ''}`}
            ref={menuRef}
          >
            {shouldShowMenu && (
              <>
                <button
                  onClick={() => onReply(message)}
                  className={styles.actionButton}
                  title="Reply"
                  aria-label="Reply"
                >
                  <CornerDownLeft size={16} />
                </button>
                <div className={styles.reactionWrapper}>
                  <button
                    type="button"
                    onClick={() => setShowReactions(!showReactions)}
                    className={styles.actionButton}
                    title="React"
                    aria-label="React"
                    aria-expanded={showReactions}
                  >
                    <Smile size={14} />
                  </button>
                  {showReactions && (
                    <div
                      className={styles.reactionPicker}
                      ref={(el) => {
                        if (el) reactionRefs.current.picker = el;
                      }}
                    >
                      {REACTION_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => handleReact(emoji)}
                          className={styles.reactionOption}
                          type="button"
                          aria-label={`React with ${emoji}`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={handleCopy}
                  className={styles.actionButton}
                  title="Copy"
                  aria-label="Copy message"
                >
                  <Copy size={14} />
                </button>
                {isMine && (
                  <>
                    <button
                      onClick={handleEdit}
                      className={styles.actionButton}
                      title="Edit"
                      aria-label="Edit message"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={handleDeleteForEveryone}
                      className={`${styles.actionButton} ${styles.actionButtonDanger}`}
                      title="Delete for everyone"
                      aria-label="Delete for everyone"
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
