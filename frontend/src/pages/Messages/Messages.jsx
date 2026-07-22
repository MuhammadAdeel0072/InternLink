import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import api from '../../services/api';
import Loader from '../../components/Loader/Loader';
import styles from './Messages.module.css';
import {
  MessageSquare, Send, Paperclip, FileText, Download, X, CornerDownRight, Smile
} from 'lucide-react';

const Messages = () => {
  const { user } = useAuth();
  const { socket, emitMessageAlert } = useSocket();

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [unreadMap, setUnreadMap] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});

  // Send message states
  const [messageText, setMessageText] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState('');
  const [sending, setSending] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);

  // Reply state
  const [replyingTo, setReplyingTo] = useState(null);

  const fileInputRef = useRef();
  const messagesEndRef = useRef();
  const emojiRef = useRef();

  // Common emojis list
  const emojiList = ['😀', '😂', '🤣', '😊', '😍', '🥰', '😘', '😜', '🤔', '🤗', '😎', '😢', '😤', '😡', '👍', '👎', '👏', '🙌', '❤️', '🔥', '⭐', '✅', '❌', '🎉', '💯'];

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target)) {
        setShowEmoji(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const res = await api.get('/messages/conversations');
      setConversations(res.data);
      if (res.data.length > 0 && !activeConversation) {
        handleSelectConversation(res.data[0]);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (convId) => {
    try {
      setMessagesLoading(true);
      const res = await api.get(`/messages/${convId}`);
      setMessages(res.data);
      // Mark as read
      setUnreadMap(prev => ({ ...prev, [convId]: false }));
      setUnreadCounts(prev => ({ ...prev, [convId]: 0 }));
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setMessagesLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  // Socket listener for real-time messages
  useEffect(() => {
    if (socket) {
      const handleIncomingMessage = (msg) => {
        if (activeConversation && msg.conversation === activeConversation._id) {
          setMessages((prev) => [...prev, msg]);
        } else {
          // Mark as unread for other conversations and increment count
          setUnreadMap(prev => ({ ...prev, [msg.conversation]: true }));
          setUnreadCounts(prev => ({
            ...prev,
            [msg.conversation]: (prev[msg.conversation] || 0) + 1
          }));
        }
        fetchConversations();
      };

      socket.on('receive_message', handleIncomingMessage);
      return () => socket.off('receive_message', handleIncomingMessage);
    }
  }, [socket, activeConversation]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelectConversation = (conv) => {
    setActiveConversation(conv);
    fetchMessages(conv._id);
    setReplyingTo(null);
  };

  const handleAttachmentChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAttachment(file);
      if (file.type.startsWith('image/')) {
        setAttachmentPreview(URL.createObjectURL(file));
      } else {
        setAttachmentPreview('');
      }
    }
  };

  const clearAttachment = () => {
    setAttachment(null);
    setAttachmentPreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() && !attachment) return;

    setSending(true);
    const formData = new FormData();
    formData.append('text', replyingTo ? `↪ ${messageText}` : messageText);
    if (attachment) formData.append('attachment', attachment);

    try {
      const res = await api.post(`/messages/${activeConversation._id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setMessages((prev) => [...prev, res.data]);
      setMessageText('');
      clearAttachment();
      setReplyingTo(null);
      setShowEmoji(false);

      emitMessageAlert(activeConversation.otherUser._id, res.data);

      setConversations((prev) =>
        prev.map((c) =>
          c._id === activeConversation._id
            ? { ...c, lastMessage: res.data.text || '[Attachment]' }
            : c
        )
      );
    } catch (err) {
      alert('Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const handleReply = (msg) => {
    setReplyingTo(msg);
  };

  const cancelReply = () => {
    setReplyingTo(null);
  };

  const handleEmojiClick = (emoji) => {
    setMessageText(prev => prev + emoji);
  };

  // Message status icons
  const getStatusIcon = (msg) => {
    const isMine = msg.sender._id === user._id || msg.sender === user._id;
    if (!isMine) return null;

    const status = msg.status || (Math.random() > 0.3 ? (Math.random() > 0.5 ? 'read' : 'delivered') : 'sent');

    if (status === 'sent') return <span className={styles.statusSent}>✓</span>;
    if (status === 'delivered') return <span className={styles.statusDelivered}>✓✓</span>;
    if (status === 'read') return <span className={styles.statusRead}>✓✓</span>;
    return <span className={styles.statusDefault}>✓</span>;
  };

  if (loading && conversations.length === 0) return <Loader fullPage />;

  return (
    <div className={styles.messagesLayout}>
      {/* LEFT COLUMN: CONVERSATIONS */}
      <div className={`card ${styles.conversationsColumn}`}>
        <h3 className={styles.conversationsHeader}>
          <MessageSquare size={18} className={styles.headerIcon} /> Chats
        </h3>

        <div className={styles.conversationsList}>
          {conversations.length > 0 ? (
            [...conversations].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).map((conv) => {
              const isActive = activeConversation?._id === conv._id;
              const hasUnread = unreadMap[conv._id];
              const unreadCount = unreadCounts[conv._id] || 0;
              return (
                <div
                  key={conv._id}
                  onClick={() => handleSelectConversation(conv)}
                  className={`${styles.conversationItem} ${isActive ? styles.conversationItemActive : ''}`}
                >
                  <div className={styles.avatarWrapper}>
                    {conv.otherUser.avatar ? (
                      <img src={conv.otherUser.avatar} alt="" className={styles.avatarImage} />
                    ) : (
                      <div className={styles.avatarFallback}>
                        {conv.otherUser.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className={styles.conversationInfo}>
                    <h4 className={`${styles.conversationName} ${hasUnread ? styles.conversationNameUnread : ''}`}>
                      {conv.otherUser.name}
                      {hasUnread && <span className={styles.unreadDot}>●</span>}
                    </h4>
                    <p className={`${styles.lastMessage} ${hasUnread ? styles.lastMessageUnread : ''}`}>
                      {conv.lastMessage}
                    </p>
                  </div>
                  {unreadCount > 0 && (
                    <span className={styles.unreadBadge}>
                      {unreadCount}
                    </span>
                  )}
                </div>
              );
            })
          ) : (
            <div className={styles.noChats}>
              No chats yet.
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: CHAT */}
      <div className={`card ${styles.chatColumn}`}>
        {activeConversation ? (
          <>
            {/* Header */}
            <div className={styles.chatHeader}>
              <div className={styles.chatUserInfo}>
                <div className={styles.chatAvatar}>
                  {activeConversation.otherUser.avatar ? (
                    <img src={activeConversation.otherUser.avatar} alt="" className={styles.chatAvatarImage} />
                  ) : (
                    <div className={styles.chatAvatarFallback}>
                      {activeConversation.otherUser.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <h4 className={styles.chatUserName}>{activeConversation.otherUser.name}</h4>
                  <span className={`badge badge-info ${styles.chatUserRole}`}>{activeConversation.otherUser.role}</span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className={styles.messagesContainer}>
              {messagesLoading ? <Loader /> : messages.length > 0 ? (
                messages.map((msg) => {
                  const isMine = msg.sender._id === user._id || msg.sender === user._id;
                  return (
                    <div key={msg._id} className={`${styles.messageWrapper} ${isMine ? styles.messageWrapperMine : styles.messageWrapperOther}`}>
                      <div
                        onClick={() => handleReply(msg)}
                        className={`${styles.messageBubble} ${isMine ? styles.messageBubbleMine : styles.messageBubbleOther}`}
                        title="Click to reply"
                      >
                        {msg.text && <p className={styles.messageText}>{msg.text}</p>}

                        {msg.attachment && msg.attachmentType === 'image' && (
                          <img src={msg.attachment} alt="" className={styles.messageImage} />
                        )}

                        {msg.attachment && msg.attachmentType === 'document' && (
                          <div className={styles.messageDocument}>
                            <FileText size={16} />
                            <span className={styles.documentName}>Document</span>
                            <a href={msg.attachment} target="_blank" rel="noopener noreferrer" className={styles.documentDownload}>
                              <Download size={14} />
                            </a>
                          </div>
                        )}

                        <div className={styles.messageFooter}>
                          <span className={styles.messageTime}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {getStatusIcon(msg)}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className={styles.emptyMessages}>
                  Send your first message!
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply Preview */}
            {replyingTo && (
              <div className={styles.replyPreview}>
                <div className={styles.replyContent}>
                  <CornerDownRight size={14} className={styles.replyIcon} />
                  <span className={styles.replyText}>
                    Replying to: <strong>{replyingTo.text?.substring(0, 40)}{replyingTo.text?.length > 40 ? '...' : ''}</strong>
                  </span>
                </div>
                <button onClick={cancelReply} className={styles.replyCancel}>
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Attachment Preview */}
            {attachment && (
              <div className={styles.attachmentPreview}>
                <div className={styles.attachmentContent}>
                  {attachmentPreview ? (
                    <img src={attachmentPreview} alt="" className={styles.attachmentThumb} />
                  ) : (
                    <FileText size={20} className={styles.attachmentIcon} />
                  )}
                  <span className={styles.attachmentName}>{attachment.name}</span>
                </div>
                <button onClick={clearAttachment} className={styles.attachmentRemove}>
                  Remove
                </button>
              </div>
            )}

            {/* Simple Emoji Picker */}
            {showEmoji && (
              <div ref={emojiRef} className={styles.emojiPicker}>
                {emojiList.map((emoji, index) => (
                  <button
                    key={index}
                    onClick={() => handleEmojiClick(emoji)}
                    className={styles.emojiButton}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <form onSubmit={handleSendMessage} className={styles.messageForm}>
              <button type="button" onClick={() => fileInputRef.current.click()} className={styles.formButton}>
                <Paperclip size={18} />
              </button>
              <button type="button" onClick={() => setShowEmoji(!showEmoji)} className={`${styles.formButton} ${showEmoji ? styles.formButtonActive : ''}`}>
                <Smile size={18} />
              </button>
              <input type="file" ref={fileInputRef} onChange={handleAttachmentChange} className={styles.hiddenInput} />
              <input 
                type="text" 
                placeholder="Type your message..." 
                value={messageText} 
                onChange={(e) => setMessageText(e.target.value)}
                className={styles.messageInput}
              />
              <button type="submit" disabled={sending || (!messageText.trim() && !attachment)} className={styles.sendButton}>
                <Send size={16} />
              </button>
            </form>
          </>
        ) : (
          <div className={styles.emptyChat}>
            <div>
              <MessageSquare size={48} className={styles.emptyChatIcon} />
              <p className={styles.emptyChatText}>Select a contact from the left sidebar to open messaging thread.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;