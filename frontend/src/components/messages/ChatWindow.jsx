import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useMessages } from '../../context/MessageContext';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import MessageSkeleton from './MessageSkeleton';
import TypingIndicator from './TypingIndicator';
import EmptyChat from './EmptyChat';
import ConversationInfo from './ConversationInfo';
import { MoreVertical, Info, Search, ArrowLeft } from 'lucide-react';
import styles from './ChatWindow.module.css';

const ChatWindow = ({ conversation, onBack, showInfo, onToggleInfo }) => {
  const {
    messages,
    messagesLoading,
    typingUsers,
    sendMessage,
    markAsRead,
    editMessage,
    deleteMessage,
    reactToMessage,
    pinConversation,
    muteConversation,
    archiveConversation,
    deleteConversation
  } = useMessages();
  const { socket } = useSocket();
  const { user } = useAuth();
  const [replyingTo, setReplyingTo] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef();
  const containerRef = useRef();
  const typingTimeoutRef = useRef();

  const emitTyping = useCallback(() => {
    if (!socket || !conversation || !user) return;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socket.emit('message:typing', {
      conversationId: conversation._id,
      userId: user._id,
      recipientId: conversation.otherUser._id
    });
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('message:stopTyping', {
        conversationId: conversation._id,
        userId: user._id,
        recipientId: conversation.otherUser._id
      });
    }, 2000);
  }, [socket, conversation, user]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!socket || !conversation || !user) return;

    const handleTyping = () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      socket.emit('message:typing', {
        conversationId: conversation._id,
        userId: user._id,
        recipientId: conversation.otherUser._id
      });
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('message:stopTyping', {
          conversationId: conversation._id,
          userId: user._id,
          recipientId: conversation.otherUser._id
        });
      }, 2000);
    };

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [socket, conversation, user]);

  useEffect(() => {
    if (!conversation || !messages.length) return;
    const unreadMessageIds = messages
      .filter((msg) => msg.sender?._id?.toString() !== user?._id?.toString() && msg.sender?.toString() !== user?._id?.toString() && msg.status !== 'read')
      .map((msg) => msg._id);

    if (unreadMessageIds.length > 0) {
      markAsRead(conversation._id, unreadMessageIds);
    }
  }, [conversation, messages, user, markAsRead]);

  const handleSend = async (text, attachment, replyTo) => {
    if (!conversation) return;
    try {
      await sendMessage(conversation._id, text, attachment, replyTo);
      setReplyingTo(null);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleReply = (msg) => {
    setReplyingTo(msg);
  };

  const handleConversationAction = async (actionType, conversationId) => {
    try {
      switch (actionType) {
        case 'pin':
          await pinConversation(conversationId);
          break;
        case 'mute':
          await muteConversation(conversationId);
          break;
        case 'archive':
          await archiveConversation(conversationId);
          break;
        case 'delete':
          if (window.confirm('Are you sure you want to delete this conversation?')) {
            await deleteConversation(conversationId);
          }
          break;
        default:
          break;
      }
    } catch (error) {
      console.error(`Failed to ${actionType}:`, error);
    }
  };

  const filteredMessages = searchQuery
    ? messages.filter((msg) => msg.message?.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  const isTyping = conversation && typingUsers[conversation._id];

  if (!conversation) {
    return <EmptyChat />;
  }

  return (
    <div className={styles.chatWindow}>
      <div className={styles.chatHeader}>
        <div className={styles.headerLeft}>
          {onBack && (
            <button onClick={onBack} className={styles.backButton}>
              <ArrowLeft size={20} />
            </button>
          )}
          <div className={styles.headerUserInfo}>
            <div className={styles.headerAvatar}>
              {conversation.otherUser.avatar ? (
                <img src={conversation.otherUser.avatar} alt="" />
              ) : (
                <div className={styles.headerAvatarFallback}>
                  {conversation.otherUser.name?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className={styles.headerDetails}>
              <h3 className={styles.headerName}>{conversation.otherUser.name}</h3>
              <p className={styles.headerStatus}>
                {isTyping ? 'typing...' : (conversation.otherUser.currentStatus || conversation.otherUser.role)}
              </p>
            </div>
          </div>
        </div>
        <div className={styles.headerRight}>
          <button onClick={onToggleInfo} className={`${styles.headerBtn} ${showInfo ? styles.headerBtnActive : ''}`} title="Conversation info">
            <Info size={18} />
          </button>
        </div>
      </div>

      <div className={styles.messagesArea} ref={containerRef}>
        {messagesLoading ? (
          <MessageSkeleton />
        ) : (
          <>
            {searchQuery && (
              <div className={styles.searchHeader}>
                <Search size={14} />
                <span>Search results for "{searchQuery}"</span>
              </div>
            )}
            <div className={styles.messagesList}>
              {filteredMessages.map((msg) => (
                <MessageBubble
                  key={msg._id}
                  message={msg}
                  isMine={msg.isMine}
                  onReply={handleReply}
                  onReact={reactToMessage}
                  onEdit={editMessage}
                  onDelete={deleteMessage}
                  currentUserId={user._id}
                  showActions
                />
              ))}
            </div>
            {isTyping && <TypingIndicator name={conversation.otherUser.name} />}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <MessageInput
        onSend={handleSend}
        sending={false}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
        onTyping={emitTyping}
      />
    </div>
  );
};

export default ChatWindow;
