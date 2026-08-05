import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Smile, X, CornerDownRight } from 'lucide-react';
import EmojiPicker from './EmojiPicker';
import AttachmentUploader from './AttachmentUploader';
import styles from './MessageInput.module.css';

const MessageInput = ({
  onSend,
  sending,
  replyingTo,
  onCancelReply,
  onTyping,
  placeholder = 'Type your message...'
}) => {
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [preview, setPreview] = useState('');
  const inputRef = useRef();
  const emojiRef = useRef();
  const typingTimerRef = useRef();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target)) {
        setShowEmoji(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTextChange = (e) => {
    setText(e.target.value);
    if (onTyping) {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      onTyping();
      typingTimerRef.current = setTimeout(() => {}, 2000);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim() && !attachment) return;
    onSend(text.trim(), attachment, replyingTo);
    setText('');
    setAttachment(null);
    setPreview('');
    setShowEmoji(false);
    if (inputRef.current) inputRef.current.focus();
  };

  const handleFileChange = (file) => {
    setAttachment(file);
    if (file.type.startsWith('image/')) {
      setPreview(URL.createObjectURL(file));
    } else {
      setPreview('');
    }
  };

  const handleEmoji = (emoji) => {
    setText((prev) => prev + emoji);
    if (inputRef.current) inputRef.current.focus();
  };

  const clearAttachment = () => {
    setAttachment(null);
    setPreview('');
  };

  return (
    <div className={styles.inputContainer}>
      {replyingTo && (
        <div className={styles.replyPreview}>
          <div className={styles.replyPreviewBar} />
          <div className={styles.replyPreviewContent}>
            <div className={styles.replyPreviewHeader}>
              <span className={styles.replyLabel}>
                <CornerDownRight size={14} />
                Replying to {replyingTo.sender?.name || 'message'}
              </span>
              <button onClick={onCancelReply} className={styles.replyCancel}>
                <X size={14} />
              </button>
            </div>
            <p className={styles.replyText}>
              {replyingTo.text?.substring(0, 80)}
              {replyingTo.text?.length > 80 && '...'}
            </p>
          </div>
        </div>
      )}

      {attachment && (
        <div className={styles.attachmentPreview}>
          <div className={styles.attachmentPreviewContent}>
            {preview ? (
              <img src={preview} alt="" className={styles.attachmentThumb} />
            ) : (
              <div className={styles.attachmentIcon}>
                <Paperclip size={18} />
              </div>
            )}
            <span className={styles.attachmentName}>{attachment.name}</span>
          </div>
          <button onClick={clearAttachment} className={styles.attachmentRemove}>
            <X size={16} />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.inputForm}>
        <div className={styles.inputActions}>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className={styles.actionBtn}
            title="Attach file"
          >
            <Paperclip size={18} />
          </button>

          <div className={styles.emojiWrapper} ref={emojiRef}>
            <button
              type="button"
              onClick={() => setShowEmoji(!showEmoji)}
              className={`${styles.actionBtn} ${showEmoji ? styles.actionBtnActive : ''}`}
              title="Emoji"
            >
              <Smile size={18} />
            </button>
            {showEmoji && <EmojiPicker onEmojiClick={handleEmoji} onClose={() => setShowEmoji(false)} />}
          </div>
        </div>

        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={handleTextChange}
          placeholder={placeholder}
          className={styles.textInput}
          disabled={sending}
        />

        <button
          type="submit"
          disabled={sending || (!text.trim() && !attachment)}
          className={styles.sendButton}
          title="Send message"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
