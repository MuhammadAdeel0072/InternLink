import React from 'react';
import { MessageCircle } from 'lucide-react';
import styles from './EmptyChat.module.css';

const EmptyChat = ({ onStartNew }) => {
  return (
    <div className={styles.emptyChat} role="status" aria-label="No conversation selected">
      <div className={styles.emptyChatContent}>
        <div className={styles.emptyChatIcon}>
          <MessageCircle size={48} />
        </div>
        <h3 className={styles.emptyChatTitle}>Your Messages</h3>
        <p className={styles.emptyChatText}>
          Select a conversation to start chatting.
        </p>
        {onStartNew && (
          <button
            className={styles.startButton}
            onClick={onStartNew}
            aria-label="Start a new conversation"
          >
            Start a new conversation
          </button>
        )}
      </div>
    </div>
  );
};

export default EmptyChat;
