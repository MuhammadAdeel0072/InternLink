import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import Loader from '../components/Loader';
import {
  MessageSquare,
  Send,
  Paperclip,
  ImageIcon,
  FileText,
  User as UserIcon,
  Download
} from 'lucide-react';

const Messages = () => {
  const { user } = useAuth();
  const { socket, emitMessageAlert } = useSocket();

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);

  // Send message states
  const [messageText, setMessageText] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState('');
  const [sending, setSending] = useState(false);

  const fileInputRef = useRef();
  const messagesEndRef = useRef();

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
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setMessagesLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  // Set up socket listener for real-time messages
  useEffect(() => {
    if (socket) {
      const handleIncomingMessage = (msg) => {
        // If message belongs to active thread, append it
        if (activeConversation && msg.conversation === activeConversation._id) {
          setMessages((prev) => [...prev, msg]);
        }
        // Refresh conversations list to update previews
        fetchConversations();
      };

      socket.on('receive_message', handleIncomingMessage);

      return () => {
        socket.off('receive_message', handleIncomingMessage);
      };
    }
  }, [socket, activeConversation]);

  // Scroll to bottom of chat log
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelectConversation = (conv) => {
    setActiveConversation(conv);
    fetchMessages(conv._id);
  };

  const handleAttachmentChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAttachment(file);
      if (file.mimetype?.startsWith('image/') || file.type.startsWith('image/')) {
        setAttachmentPreview(URL.createObjectURL(file));
      } else {
        setAttachmentPreview(''); // No preview for documents
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
    formData.append('text', messageText);
    if (attachment) {
      formData.append('attachment', attachment);
    }

    try {
      const res = await api.post(`/messages/${activeConversation._id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setMessages((prev) => [...prev, res.data]);
      setMessageText('');
      clearAttachment();

      // Trigger socket transmission
      emitMessageAlert(activeConversation.otherUser._id, res.data);
      
      // Update local preview list immediately
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

  if (loading && conversations.length === 0) return <Loader fullPage />;

  return (
    <div className="messages-layout-grid" style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px', minHeight: 'calc(100vh - 120px)', animation: 'fadeIn 0.3s ease' }}>
      
      {/* LEFT COLUMN: ACTIVE THREADS */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: '16px', overflowY: 'auto', maxHeight: '75vh' }}>
        <h3 style={{ fontSize: '1.15rem', fontFamily: 'var(--font-display)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MessageSquare size={18} style={{ color: 'var(--primary)' }} /> Chats
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {conversations.length > 0 ? (
            conversations.map((conv) => (
              <div
                key={conv._id}
                onClick={() => handleSelectConversation(conv)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  border: activeConversation?._id === conv._id ? '1px solid var(--primary)' : '1px solid transparent',
                  backgroundColor: activeConversation?._id === conv._id ? 'var(--primary-light)' : 'var(--bg-tertiary)',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--bg-secondary)', overflow: 'hidden', flexShrink: 0 }}>
                  {conv.otherUser.avatar ? (
                    <img src={conv.otherUser.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 700 }}>
                      {conv.otherUser.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {conv.otherUser.name}
                  </h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>
                    {conv.lastMessage}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No chats yet. Visit a peer profile to start messaging!
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: ACTIVE DIALOGUE */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: '20px', height: '100%', maxHeight: '75vh', overflow: 'hidden' }}>
        {activeConversation ? (
          <>
            {/* Thread Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: '16px',
                marginBottom: '16px'
              }}
            >
              <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: 'var(--bg-tertiary)', overflow: 'hidden' }}>
                {activeConversation.otherUser.avatar ? (
                  <img src={activeConversation.otherUser.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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

            {/* Messages Scroll Area */}
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
              {messagesLoading ? (
                <Loader />
              ) : messages.length > 0 ? (
                messages.map((msg) => {
                  const isMine = msg.sender._id === user._id || msg.sender === user._id;
                  return (
                    <div
                      key={msg._id}
                      style={{
                        display: 'flex',
                        justifyContent: isMine ? 'flex-end' : 'flex-start'
                      }}
                    >
                      <div
                        style={{
                          maxWidth: '70%',
                          backgroundColor: isMine ? 'var(--primary)' : 'var(--bg-tertiary)',
                          color: isMine ? '#ffffff' : 'var(--text-primary)',
                          padding: '10px 16px',
                          borderRadius: isMine ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                          boxShadow: 'var(--shadow-sm)'
                        }}
                      >
                        {/* Text */}
                        {msg.text && <p style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>{msg.text}</p>}

                        {/* Attachments */}
                        {msg.attachment && msg.attachmentType === 'image' && (
                          <img
                            src={msg.attachment}
                            alt="attachment"
                            style={{ maxWidth: '100%', borderRadius: 'var(--radius-sm)', marginTop: '8px', maxHeight: '200px', objectFit: 'contain' }}
                          />
                        )}

                        {msg.attachment && msg.attachmentType === 'document' && (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              marginTop: '8px',
                              backgroundColor: 'rgba(0,0,0,0.2)',
                              padding: '8px',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '0.8rem'
                            }}
                          >
                            <FileText size={16} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '120px' }}>
                              Document Attachment
                            </span>
                            <a href={msg.attachment} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', display: 'flex', marginLeft: 'auto' }}>
                              <Download size={14} />
                            </a>
                          </div>
                        )}

                        <span style={{ display: 'block', fontSize: '0.65rem', color: isMine ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)', textAlign: 'right', marginTop: '4px' }}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', margin: 'auto', fontSize: '0.9rem' }}>
                  Send your first message to start the conversation!
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Preview Panel for Attachments */}
            {attachment && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContext: 'space-between', justifyContent: 'space-between', backgroundColor: 'var(--bg-tertiary)', padding: '8px 16px', borderRadius: 'var(--radius-sm)', marginBottom: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {attachmentPreview ? (
                    <img src={attachmentPreview} alt="preview" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                  ) : (
                    <FileText size={20} style={{ color: 'var(--primary)' }} />
                  )}
                  <span style={{ fontSize: '0.8rem', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {attachment.name}
                  </span>
                </div>
                <button onClick={clearAttachment} style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>Remove</button>
              </div>
            )}

            {/* Input Bar Form */}
            <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => fileInputRef.current.click()}
                style={{
                  padding: '10px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--bg-tertiary)',
                  color: 'var(--text-secondary)',
                  display: 'flex'
                }}
              >
                <Paperclip size={18} />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAttachmentChange}
                style={{ display: 'none' }}
              />

              <input
                type="text"
                placeholder="Type your message..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                style={{
                  flex: 1,
                  padding: '12px 18px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />

              <button
                type="submit"
                disabled={sending || (!messageText.trim() && !attachment)}
                style={{
                  padding: '12px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary)',
                  color: '#ffffff',
                  display: 'flex',
                  opacity: (!messageText.trim() && !attachment) ? 0.6 : 1
                }}
              >
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

      {styleAdjustments}
    </div>
  );
};

const styleAdjustments = (
  <style>{`
    @media (max-width: 768px) {
      .messages-layout-grid {
        grid-template-columns: 1fr !important;
      }
      .messages-layout-grid div:first-child {
        display: block !important;
      }
      .messages-layout-grid div:last-child {
        display: none !important; /* switchable in fully responsive layout */
      }
    }
  `}</style>
);

export default Messages;
