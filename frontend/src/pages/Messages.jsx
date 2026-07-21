import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import Loader from '../components/Loader';
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

    // Simulated: newer messages = delivered, some = read
    const status = msg.status || (Math.random() > 0.3 ? (Math.random() > 0.5 ? 'read' : 'delivered') : 'sent');

    if (status === 'sent') return <span style={{ fontSize: '0.6rem', opacity: 0.6 }}>✓</span>;
    if (status === 'delivered') return <span style={{ fontSize: '0.6rem', opacity: 0.7 }}>✓✓</span>;
    if (status === 'read') return <span style={{ fontSize: '0.6rem', color: '#3b82f6', fontWeight: 700 }}>✓✓</span>;
    return <span style={{ fontSize: '0.6rem', opacity: 0.5 }}>✓</span>;
  };

  if (loading && conversations.length === 0) return <Loader fullPage />;

  return (
    <div className="messages-layout-grid" style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px', minHeight: 'calc(100vh - 100px)', height: 'calc(100vh - 100px)', animation: 'fadeIn 0.3s ease' }}>

      {/* LEFT COLUMN: CONVERSATIONS */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: '16px', overflowY: 'auto', height: '100%', maxHeight: 'calc(100vh - 100px)' }}>
        <h3 style={{ fontSize: '1.15rem', fontFamily: 'var(--font-display)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MessageSquare size={18} style={{ color: 'var(--primary)' }} /> Chats
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', flex: 1 }}>
          {conversations.length > 0 ? (
            conversations.map((conv) => {
              const isActive = activeConversation?._id === conv._id;
              const hasUnread = unreadMap[conv._id];
              const unreadCount = unreadCounts[conv._id] || 0;
              return (
                <div
                  key={conv._id}
                  onClick={() => handleSelectConversation(conv)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px', padding: '12px',
                    borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                    border: isActive ? '1px solid var(--primary)' : '1px solid transparent',
                    backgroundColor: isActive ? 'var(--primary-light)' : 'var(--bg-tertiary)',
                    transition: 'all 0.15s ease',
                    position: 'relative'
                  }}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--bg-secondary)', overflow: 'hidden', flexShrink: 0 }}>
                    {conv.otherUser.avatar ? (
                      <img src={conv.otherUser.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 700 }}>
                        {conv.otherUser.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{
                      fontSize: '0.9rem',
                      fontWeight: hasUnread ? 700 : 600,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      color: hasUnread ? 'var(--text-primary)' : 'var(--text-secondary)'
                    }}>
                      {conv.otherUser.name}
                      {hasUnread && <span style={{ marginLeft: '6px', fontSize: '0.6rem', color: 'var(--primary)' }}>●</span>}
                    </h4>
                    <p style={{
                      fontSize: '0.75rem',
                      fontWeight: hasUnread ? 600 : 400,
                      color: hasUnread ? 'var(--text-primary)' : 'var(--text-secondary)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px'
                    }}>
                      {conv.lastMessage}
                    </p>
                  </div>
                  {unreadCount > 0 && (
                    <span style={{
                      backgroundColor: 'var(--primary)',
                      color: '#ffffff',
                      borderRadius: '20px',
                      padding: '2px 6px',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      minWidth: '20px',
                      textAlign: 'center',
                      flexShrink: 0
                    }}>
                      {unreadCount}
                    </span>
                  )}
                </div>
              );
            })
          ) : (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No chats yet.
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: CHAT */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: '20px', height: '100%', maxHeight: 'calc(100vh - 100px)', overflow: 'hidden', position: 'relative' }}>
        {activeConversation ? (
          <>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '16px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: 'var(--bg-tertiary)', overflow: 'hidden' }}>
                {activeConversation.otherUser.avatar ? (
                  <img src={activeConversation.otherUser.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 700 }}>
                    {activeConversation.otherUser.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>{activeConversation.otherUser.name}</h4>
                <span className="badge badge-info" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>{activeConversation.otherUser.role}</span>
              </div>
            </div>

            {/* Messages - Now scrollable */}
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px', minHeight: 0 }}>
              {messagesLoading ? <Loader /> : messages.length > 0 ? (
                messages.map((msg) => {
                  const isMine = msg.sender._id === user._id || msg.sender === user._id;
                  return (
                    <div key={msg._id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: '4px' }}>
                      <div
                        onClick={() => handleReply(msg)}
                        style={{
                          maxWidth: '70%',
                          backgroundColor: isMine ? 'var(--primary)' : 'var(--bg-tertiary)',
                          color: isMine ? '#ffffff' : 'var(--text-primary)',
                          padding: '10px 16px',
                          borderRadius: isMine ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                          boxShadow: 'var(--shadow-sm)',
                          cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                        title="Click to reply"
                      >
                        {msg.text && <p style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>{msg.text}</p>}

                        {msg.attachment && msg.attachmentType === 'image' && (
                          <img src={msg.attachment} alt="" style={{ maxWidth: '100%', borderRadius: 'var(--radius-sm)', marginTop: '8px', maxHeight: '200px', objectFit: 'contain' }} />
                        )}

                        {msg.attachment && msg.attachmentType === 'document' && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', backgroundColor: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem' }}>
                            <FileText size={16} />
                            <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Document</span>
                            <a href={msg.attachment} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', marginLeft: 'auto' }}><Download size={14} /></a>
                          </div>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end', marginTop: '4px' }}>
                          <span style={{ fontSize: '0.6rem', color: isMine ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)' }}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {getStatusIcon(msg)}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', margin: 'auto', fontSize: '0.9rem' }}>
                  Send your first message!
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply Preview */}
            {replyingTo && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--primary-light)', padding: '10px 16px', borderRadius: '8px', marginBottom: '8px', borderLeft: '3px solid var(--primary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <CornerDownRight size={14} style={{ color: 'var(--primary)' }} />
                  <span>Replying to: <strong>{replyingTo.text?.substring(0, 40)}{replyingTo.text?.length > 40 ? '...' : ''}</strong></span>
                </div>
                <button onClick={cancelReply} style={{ color: 'var(--text-muted)', padding: '2px' }}><X size={14} /></button>
              </div>
            )}

            {/* Attachment Preview */}
            {attachment && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--bg-tertiary)', padding: '8px 16px', borderRadius: 'var(--radius-sm)', marginBottom: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {attachmentPreview ? (
                    <img src={attachmentPreview} alt="" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                  ) : (
                    <FileText size={20} style={{ color: 'var(--primary)' }} />
                  )}
                  <span style={{ fontSize: '0.8rem', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{attachment.name}</span>
                </div>
                <button onClick={clearAttachment} style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>Remove</button>
              </div>
            )}

            {/* Simple Emoji Picker */}
            {showEmoji && (
              <div ref={emojiRef} style={{ 
                position: 'absolute', 
                bottom: '80px', 
                right: '20px', 
                zIndex: 1000,
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: '8px',
                maxWidth: '300px'
              }}>
                {emojiList.map((emoji, index) => (
                  <button
                    key={index}
                    onClick={() => handleEmojiClick(emoji)}
                    style={{
                      fontSize: '1.5rem',
                      padding: '8px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      cursor: 'pointer',
                      borderRadius: '8px',
                      transition: 'background-color 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px', alignItems: 'center', position: 'relative' }}>
              <button type="button" onClick={() => fileInputRef.current.click()} style={{ padding: '10px', borderRadius: '50%', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)', display: 'flex' }}>
                <Paperclip size={18} />
              </button>
              <button type="button" onClick={() => setShowEmoji(!showEmoji)} style={{ padding: '10px', borderRadius: '50%', backgroundColor: showEmoji ? 'var(--primary-light)' : 'var(--bg-tertiary)', color: showEmoji ? 'var(--primary)' : 'var(--text-secondary)', display: 'flex' }}>
                <Smile size={18} />
              </button>
              <input type="file" ref={fileInputRef} onChange={handleAttachmentChange} style={{ display: 'none' }} />
              <input type="text" placeholder="Type your message..." value={messageText} onChange={(e) => setMessageText(e.target.value)}
                style={{ flex: 1, padding: '12px 18px', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none' }} />
              <button type="submit" disabled={sending || (!messageText.trim() && !attachment)}
                style={{ padding: '12px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: '#ffffff', display: 'flex', opacity: (!messageText.trim() && !attachment) ? 0.6 : 1 }}>
                <Send size={16} />
              </button>
            </form>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', textAlign: 'center' }}>
            <div>
              <MessageSquare size={48} style={{ color: 'var(--border-hover)', marginBottom: '16px' }} />
              <p>Select a contact from the left sidebar to open messaging thread.</p>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .messages-layout-grid { 
            grid-template-columns: 1fr !important;
            height: calc(100vh - 80px) !important;
            min-height: calc(100vh - 80px) !important;
          }
          .messages-layout-grid .card {
            max-height: calc(100vh - 80px) !important;
          }
        }
        .messages-layout-grid .card {
          overflow-y: auto;
        }
      `}</style>
    </div>
  );
};

export default Messages;