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
    // Guard against invalid/missing createdAt to prevent crashes
    if (isNaN(msgDate.getTime())) return;
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
  if (index === 0) return true;
  const prev = allMessages[index - 1];
  if (prev?.isMine) return true;
  const prevSenderId = prev?.sender?._id?.toString() || prev?.sender?.toString();
  const currSenderId = msg?.sender?._id?.toString() || msg?.sender?.toString();
  if (prevSenderId && currSenderId && prevSenderId !== currSenderId) return true;
  const prevTime = new Date(prev?.createdAt).getTime();
  const currTime = new Date(msg?.createdAt).getTime();
  // Guard against invalid dates to avoid NaN comparisons
  if (isNaN(prevTime) || isNaN(currTime)) return true;
  return currTime - prevTime > DATE_SEPARATOR_THRESHOLD * 60 * 1000;
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
  onDelete,
  onRetry,
  hasMore = false,
  onLoadOlder
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
    if (!containerRef.current) return;
    const container = containerRef.current;
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    const isNearBottom = distanceFromBottom < 150;

    if (messages.length && messages.length > prevMessageCountRef.current && isNearBottom) {
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
      {hasMore && (
        <button
          type="button"
          className={styles.loadOlderButton}
          onClick={onLoadOlder}
        >
          Load older messages
        </button>
      )}
      {groupedMessages.map((group, gIdx) => (
        <div key={gIdx}>
          <div className={styles.dateSeparator}>
            <span className={styles.dateSeparatorText}>
              {formatDateSeparator(group.dateObj)}
            </span>
          </div>

          {group.messages.map((msg, idx) => {
            const prev = idx > 0 ? group.messages[idx - 1] : null;
            const isConsecutive = prev &&
              (prev.sender?._id?.toString() || prev.sender?.toString()) === (msg.sender?._id?.toString() || msg.sender?.toString()) &&
              msg.isMine === prev.isMine;
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
                  onRetry={onRetry}
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
