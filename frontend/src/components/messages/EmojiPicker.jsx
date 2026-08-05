import React from 'react';
import styles from './EmojiPicker.module.css';

const EMOJI_LIST = [
  '👍', '❤️', '😂', '😮', '😢', '👏', '🔥', '🎉',
  '💯', '✅', '⭐', '🤔', '😊', '🥰', '😎', '🤗',
  '👀', '🙌', '💪', '🌟', '💡', '🚀', '💬', '👋'
];

const EmojiPicker = ({ onEmojiClick, onClose }) => {
  return (
    <div className={styles.emojiPicker}>
      <div className={styles.emojiGrid}>
        {EMOJI_LIST.map((emoji, index) => (
          <button
            key={index}
            onClick={() => onEmojiClick(emoji)}
            className={styles.emojiButton}
            type="button"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};

export default EmojiPicker;
