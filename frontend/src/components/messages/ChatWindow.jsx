import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useMessages } from '../../context/MessageContext';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { useOnlineStatus } from '../../context/OnlineStatusContext';
import { useNavigate } from 'react-router-dom';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import ConversationInfo from './ConversationInfo';
import { Phone, Video, MoreVertical, Search, ArrowLeft, X } from 'lucide-react';
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
     deleteConversation,
     sendMessageError
   } = useMessages();
  const { socket } = useSocket();
  const { user } = useAuth();
  const { isOnline } = useOnlineStatus();
  const navigate = useNavigate();
  const [replyingTo, setReplyingTo] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const typingTimeoutRef = useRef();

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    setReplyingTo(null);
  }, [conversation?._id]);

  // Mark unread incoming messages as read whenever the active conversation
  // contains messages the current user has not yet read. This fires once per
  // conversation load AND for every new message that arrives while the
  // conversation is open, so senders receive read receipts for all messages.
  // The backend call is idempotent (already-read messages are no-ops) and only
  // runs when there is at least one unread incoming message, so it does not
  // "hammer" the API or mark the user's own messages as read.
  useEffect(() => {
    if (!conversation || !messages.length) return;

    const unreadMessageIds = messages
      .filter((msg) => {
        const senderId = msg.sender?._id?.toString() || msg.sender?.toString();
        return senderId !== user?._id?.toString() && msg.status !== 'read';
      })
      .map((msg) => msg._id);

    if (unreadMessageIds.length > 0) {
      markAsRead(conversation._id, unreadMessageIds);
    }
  }, [conversation, messages, user, markAsRead]);


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
    setReplyingTo({
      _id: msg._id,
      message: msg.message || msg.text || '',
      sender: msg.sender,
      text: msg.message || msg.text || ''
    });
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

  const handleProfileClick = () => {
    const otherUserId = conversation.otherUser?._id;
    if (otherUserId) {
      navigate(`/profile/${otherUserId}`);
    }
  };

  const online = isOnline(conversation?.otherUser?._id);
  const isTyping = conversation && typingUsers[conversation._id];

  if (!conversation) {
    return null;
  }

  return (
    <div className={`${styles.chatWindow} ${showInfo ? styles.showInfo : ''}`}>
      <div className={styles.chatHeader}>
        <div className={styles.headerLeft}>
          {onBack && (
            <button
              onClick={onBack}
              className={styles.backButton}
              aria-label="Back to conversations"
              title="Back"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <div
            className={styles.headerUserInfo}
            onClick={handleProfileClick}
            role="button"
            tabIndex={0}
            aria-label={`View profile of ${conversation.otherUser?.name}`}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleProfileClick(); }}
          >
            <div className={`${styles.headerAvatar} ${online ? styles.headerAvatarOnline : ''}`}>
              {conversation.otherUser.avatar ? (
                <img src={conversation.otherUser.avatar} alt={conversation.otherUser.name} loading="lazy" />
              ) : (
                <div className={styles.headerAvatarFallback}>
                  {conversation.otherUser.name?.charAt(0).toUpperCase()}
                </div>
              )}
              <span
                className={`${styles.statusDot} ${online ? styles.statusOnline : styles.statusOffline}`}
                aria-label={online ? 'Online' : 'Offline'}
              />
            </div>
            <div className={styles.headerDetails}>
              <h3 className={styles.headerName}>{conversation.otherUser.name}</h3>
        <p className={`${styles.headerStatus} ${isTyping ? styles.typing : ''}`}>
          {isTyping ? 'typing...' : (online ? 'Online' : (conversation.otherUser.currentStatus || conversation.otherUser.role))}
        </p>
            </div>
          </div>
        </div>

        <div className={styles.headerRight}>
          <button
            onClick={() => setShowSearch(!showSearch)}
            className={`${styles.headerBtn} ${showSearch ? styles.headerBtnActive : ''}`}
            aria-label="Search messages"
            title="Search"
          >
            <Search size={18} />
          </button>
          <button className={styles.headerBtn} aria-label="Voice call" title="Voice call">
            <Phone size={18} />
          </button>
          <button className={styles.headerBtn} aria-label="Video call" title="Video call">
            <Video size={18} />
          </button>
          <button
            onClick={onToggleInfo}
            className={`${styles.headerBtn} ${showInfo ? styles.headerBtnActive : ''}`}
            aria-label="Conversation info"
            title="Conversation info"
          >
            <MoreVertical size={18} />
          </button>
        </div>
      </div>

      {showSearch && (
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="Search messages in this conversation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
            autoFocus
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className={styles.searchClearBtn}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>
      )}

      <MessageList
        messages={searchQuery ? messages.filter((m) => m.message?.toLowerCase().includes(searchQuery.toLowerCase())) : messages}
        loading={messagesLoading}
        currentUserId={user._id}
        typingUsers={typingUsers}
        activeConversation={conversation}
        onReply={handleReply}
        onReact={reactToMessage}
        onEdit={editMessage}
        onDelete={deleteMessage}
      />

      {showInfo && (
        <ConversationInfo
          conversation={conversation}
          onAction={handleConversationAction}
          onClose={() => onToggleInfo()}
        />
      )}

      <MessageInput
        onSend={handleSend}
        sending={false}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
        onTyping={emitTyping}
        placeholder={`Message ${conversation.otherUser.name}...`}
      />
      {sendMessageError && (
        <div className={styles.sendMessageError} role="alert" aria-live="polite">
          {sendMessageError}
        </div>
      )}
    </div>
  );
};

export default ChatWindow;
