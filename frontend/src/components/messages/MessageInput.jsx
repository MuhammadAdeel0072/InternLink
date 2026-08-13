import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Paperclip, Smile, X, CornerDownRight } from 'lucide-react';
import EmojiPicker from './EmojiPicker';
import styles from './MessageInput.module.css';

const MessageInput = ({
  onSend,
  sending,
  replyingTo,
  onCancelReply,
  onTyping,
  placeholder = 'Type a message...'
}) => {
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [preview, setPreview] = useState('');
  const textareaRef = useRef(null);
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
    const trimmed = text.trim();
    if (!trimmed && !attachment) return;
    onSend(trimmed, attachment, replyingTo);
    setText('');
    setAttachment(null);
    setPreview('');
    setShowEmoji(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachment(file);
      if (file.type.startsWith('image/')) {
        setPreview(URL.createObjectURL(file));
      } else {
        setPreview('');
      }
    }
  };

  const handleEmoji = (emoji) => {
    const cursorPos = textareaRef.current?.selectionStart || 0;
    const before = text.substring(0, cursorPos);
    const after = text.substring(cursorPos);
    setText(`${before}${emoji}${after}`);
    setTimeout(() => {
      const newPos = cursorPos + emoji.length;
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(newPos, newPos);
    }, 0);
  };

  const clearAttachment = () => {
    setAttachment(null);
    setPreview('');
  };

  const hasContent = text.trim().length > 0 || attachment;

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
              <button
                onClick={onCancelReply}
                className={styles.replyCancel}
                aria-label="Cancel reply"
              >
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
              <img src={preview} alt="" className={styles.attachmentThumb} loading="lazy" />
            ) : (
              <div className={styles.attachmentIcon}>
                <Paperclip size={18} />
              </div>
            )}
            <span className={styles.attachmentName} title={attachment.name}>
              {attachment.name}
            </span>
          </div>
          <button
            onClick={clearAttachment}
            className={styles.attachmentRemove}
            aria-label="Remove attachment"
            title="Remove attachment"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.inputForm}>
        <label className={styles.attachmentBtn} title="Attach file" aria-label="Attach file">
          <input
            type="file"
            onChange={handleFileChange}
            accept="image/*,.pdf,.doc,.docx,.zip"
            className={styles.hiddenFileInput}
            aria-hidden="true"
          />
          <Paperclip size={20} />
        </label>

        <div className={styles.inputBox}>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={styles.textInput}
            disabled={sending}
            rows={1}
            aria-label="Message input"
            style={{ resize: 'none' }}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
          />

          <div className={styles.emojiWrapper} ref={emojiRef}>
            <button
              type="button"
              onClick={() => setShowEmoji(!showEmoji)}
              className={`${styles.emojiBtn} ${showEmoji ? styles.emojiBtnActive : ''}`}
              title="Emoji"
              aria-label="Insert emoji"
            >
              <Smile size={20} />
            </button>
            {showEmoji && <EmojiPicker onEmojiClick={handleEmoji} onClose={() => setShowEmoji(false)} />}
          </div>
        </div>

        <button
          type="submit"
          disabled={sending || !hasContent}
          className={`${styles.sendButton} ${!hasContent ? styles.sendButtonDisabled : ''}`}
          aria-label="Send message"
          title={hasContent ? 'Send message' : 'Send'}
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
