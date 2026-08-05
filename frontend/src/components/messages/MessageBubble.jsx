import React, { useState } from 'react';
import {
  Reply, Smile, Edit3, Trash2, MoreVertical,
  CheckCheck, Check, Clock, Download
} from 'lucide-react';
import styles from './MessageBubble.module.css';

const REACTION_EMOJIS = ['👍', '❤️', '🎉', '😂', '😮', '😢', '👏', '🔥'];

const MessageBubble = ({
  message,
  isMine,
  onReply,
  onReact,
  onEdit,
  onDelete,
  currentUserId,
  showActions
}) => {
  const [showReactions, setShowReactions] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.message);

  const getStatusIcon = () => {
    if (!isMine) return null;
    const status = message.status || 'sent';
    if (status === 'sent') return <Check size={14} className={styles.statusSent} />;
    if (status === 'delivered') return <CheckCheck size={14} className={styles.statusDelivered} />;
    if (status === 'read') return <CheckCheck size={14} className={styles.statusRead} />;
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
    if (editText.trim() && editText !== message.message) {
      await onEdit(message._id, editText.trim());
    }
    setIsEditing(false);
  };

  const handleDelete = async () => {
    await onDelete(message._id, false);
    setShowMenu(false);
  };

  const isDeleted = message.deleted;
  const isDeletedForMe = message.deletedFor?.includes(currentUserId);

  if (isDeletedForMe || isDeleted) {
    return (
      <div className={`${styles.messageWrapper} ${isMine ? styles.messageWrapperMine : styles.messageWrapperOther}`}>
        <div className={`${styles.messageBubble} ${styles.messageBubbleDeleted}`}>
          <p className={styles.deletedText}>This message was deleted</p>
        </div>
      </div>
    );
  }

  const userReaction = message.reactions?.find((r) => r.userId === currentUserId);

  return (
    <div
      className={`${styles.messageWrapper} ${isMine ? styles.messageWrapperMine : styles.messageWrapperOther}`}
      onMouseEnter={() => showActions && setShowMenu(true)}
      onMouseLeave={() => showActions && setShowMenu(false)}
    >
      <div className={`${styles.messageBubble} ${isMine ? styles.messageBubbleMine : styles.messageBubbleOther}`}>
        {message.replyTo && (
          <div className={styles.replyContainer}>
            <div className={styles.replyBar} />
            <div className={styles.replyContent}>
              <span className={styles.replySender}>{message.replyTo.senderName}</span>
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
            />
            <div className={styles.editActions}>
              <button onClick={handleSaveEdit} className={styles.editSave}>Save</button>
              <button onClick={() => setIsEditing(false)} className={styles.editCancel}>Cancel</button>
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
          <span className={styles.messageTime}>
            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
        <div className={styles.actionsContainer}>
          <button onClick={() => onReply(message)} className={styles.actionButton} title="Reply">
            <Reply size={14} />
          </button>
          <div className={styles.reactionWrapper}>
            <button onClick={() => setShowReactions(!showReactions)} className={styles.actionButton} title="React">
              <Smile size={14} />
            </button>
            {showReactions && (
              <div className={styles.reactionPicker}>
                {REACTION_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleReact(emoji)}
                    className={styles.reactionOption}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
          {isMine && (
            <>
              <button onClick={handleEdit} className={styles.actionButton} title="Edit">
                <Edit3 size={14} />
              </button>
              <button onClick={handleDelete} className={`${styles.actionButton} ${styles.actionButtonDanger}`} title="Delete">
                <Trash2 size={14} />
              </button>
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
