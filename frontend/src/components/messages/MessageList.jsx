import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import MessageSkeleton from './MessageSkeleton';
import { formatDateSeparator } from '../../utils/formatters';
import styles from './MessageList.module.css';

const DATE_SEPARATOR_THRESHOLD = 10;

const groupMessagesByDate = (messages) => {
  const groups = [];
  let currentGroup = { date: null, messages: [] };

  messages.forEach((msg) => {
    const msgDate = new Date(msg.createdAt);
    const dateKey = msgDate.toDateString();

    if (currentGroup.date !== dateKey) {
      if (currentGroup.messages.length > 0) {
        groups.push(currentGroup);
      }
      currentGroup = { date: dateKey, dateObj: msgDate, messages: [msg] };
    } else {
      currentGroup.messages.push(msg);
    }
  });

  if (currentGroup.messages.length > 0) {
    groups.push(currentGroup);
  }

  return groups;
};

const shouldShowAvatar = (msg, allMessages, index) => {
  if (msg.isMine) return false;
  if (index > 0 && allMessages[index - 1]?.isMine === false) {
    const prev = allMessages[index - 1];
    const prevTime = new Date(prev.createdAt).getTime();
    const currTime = new Date(msg.createdAt).getTime();
    return currTime - prevTime > DATE_SEPARATOR_THRESHOLD * 60 * 1000;
  }
  return true;
};

const MessageList = ({
  messages,
  loading,
  currentUserId,
  typingUsers,
  activeConversation,
  onReply,
  onReact,
  onEdit,
  onDelete
}) => {
  const containerRef = useRef(null);
  const bottomRef = useRef(null);
  const [showNewMessageButton, setShowNewMessageButton] = useState(false);
  const [highlightedMessageId, setHighlightedMessageId] = useState(null);
  const prevMessageCountRef = useRef(0);

  const groupedMessages = groupMessagesByDate(messages);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const scrollToMessage = useCallback((messageId) => {
    const element = document.getElementById(`message-${messageId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedMessageId(messageId);
      setTimeout(() => setHighlightedMessageId(null), 2000);
    }
  }, []);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    setShowNewMessageButton(distanceFromBottom > 200);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    if (messages.length && messages.length > prevMessageCountRef.current) {
      scrollToBottom();
    }
    prevMessageCountRef.current = messages.length;
  }, [messages, scrollToBottom]);

  const scrollToNewMessages = () => {
    scrollToBottom();
    setShowNewMessageButton(false);
  };

  const isTyping = activeConversation && typingUsers[activeConversation._id];

  if (loading) {
    return (
      <div className={styles.messageList} ref={containerRef}>
        <MessageSkeleton />
        <div ref={bottomRef} />
      </div>
    );
  }

  return (
    <div className={styles.messageList} ref={containerRef}>
      {groupedMessages.map((group, gIdx) => (
        <div key={gIdx}>
          <div className={styles.dateSeparator}>
            <span className={styles.dateSeparatorText}>
              {formatDateSeparator(group.dateObj)}
            </span>
          </div>

          {group.messages.map((msg, idx) => {
            const isConsecutive = idx > 0 &&
              group.messages[idx - 1]?.sender?.toString() === msg.sender?.toString() &&
              msg.isMine === group.messages[idx - 1]?.isMine;
            const showAvatar = shouldShowAvatar(msg, group.messages, idx);
            const isHighlighted = highlightedMessageId === msg._id;

            return (
              <div 
                key={msg._id}
                id={`message-${msg._id}`}
                className={isHighlighted ? styles.highlightedMessage : ''}
              >
                <MessageBubble
                  message={msg}
                  isMine={msg.isMine}
                  onReply={onReply}
                  onReact={onReact}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onScrollToMessage={scrollToMessage}
                  currentUserId={currentUserId}
                  showAvatar={showAvatar}
                  isGrouped={isConsecutive}
                  showActions
                />
              </div>
            );
          })}
        </div>
      ))}

      {typingUsers[activeConversation?._id] && (
        <TypingIndicator name={activeConversation?.otherUser?.name} />
      )}

      <div ref={bottomRef} />

      {showNewMessageButton && (
        <button
          className={styles.newMessageButton}
          onClick={scrollToNewMessages}
          aria-label="Scroll to latest messages"
          title="New messages"
        >
          ↓ New message
        </button>
      )}
    </div>
  );
};

export default memo(MessageList);
