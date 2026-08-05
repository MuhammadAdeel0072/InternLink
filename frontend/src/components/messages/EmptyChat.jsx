import React from 'react';
import { MessageSquare } from 'lucide-react';
import styles from './EmptyChat.module.css';

const EmptyChat = () => {
  return (
    <div className={styles.emptyChat}>
      <div className={styles.emptyChatContent}>
        <div className={styles.emptyChatIcon}>
          <MessageSquare size={48} />
        </div>
        <h3 className={styles.emptyChatTitle}>Your Messages</h3>
        <p className={styles.emptyChatText}>
          Connect professionally with your network. Start a conversation to collaborate, share opportunities, and build relationships.
        </p>
      </div>
    </div>
  );
};

export default EmptyChat;
