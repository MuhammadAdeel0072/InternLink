import React, { useState, useRef, useEffect } from 'react';
import {
  Reply, Smile, Edit3, Trash2, MoreVertical,
  CheckCheck, Check, Clock, Download, Copy
} from 'lucide-react';
import { formatMessageTime } from '../../utils/formatters';
import styles from './MessageBubble.module.css';

const REACTION_EMOJIS = ['👍', '❤️', '🎉', '😂', '😮', '😢', '👏', '🔥'];

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

  const getStatusIcon = () => {
    if (!isMine) return null;
    const status = message.status || 'sent';
    if (status === 'sent') return <Check size={14} className={styles.statusSent} />;
    if (status === 'delivered') return <CheckCheck size={14} className={styles.statusDelivered} />;
    if (status === 'read') return <CheckCheck size={14} className={styles.statusRead} />;
    if (status === 'sending') return <Clock size={14} className={styles.statusDefault} />;
    return <Clock size={14} className={styles.statusDefault} />;
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

  const handleDelete = async () => {
    await onDelete(message._id, false);
    setShowMenu(false);
  };

  const handleDeleteForEveryone = async () => {
    if (window.confirm('Delete this message for everyone?')) {
      await onDelete(message._id, true);
      setShowMenu(false);
    }
  };

  const handleCopy = () => {
    if (message.message) {
      navigator.clipboard.writeText(message.message);
    }
  };

  const isDeleted = message.deleted;
  const isDeletedForMe = message.deletedFor?.includes(currentUserId);
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

  const userReaction = message.reactions?.find((r) => r.userId === currentUserId);

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
                      <Download size={18} />
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
          </>
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
      </div>

      {message.reactions?.length > 0 && !showActions && (
        <div className={styles.reactionsDisplay}>
          {message.reactions.map((reaction, idx) => (
            <span key={idx} className={styles.reactionBadge}>
              {reaction.emoji}
            </span>
          ))}
        </div>
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
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="12" y2="9" />
                  <polyline points="22 2 15 22 12 12 2 15 22 2" />
                </svg>
              </button>
              <div className={styles.reactionWrapper}>
                <button
                  onClick={() => setShowReactions(!showReactions)}
                  className={styles.actionButton}
                  title="React"
                  aria-label="React"
                >
                  <Smile size={14} />
                </button>
                {showReactions && (
                  <div className={styles.reactionPicker}>
                    {REACTION_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => handleReact(emoji)}
                        className={styles.reactionOption}
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

      {userReaction && !showActions && (
        <div className={styles.myReaction}>
          {userReaction.emoji}
        </div>
      )}
    </div>
  );
};

export default MessageBubble;
