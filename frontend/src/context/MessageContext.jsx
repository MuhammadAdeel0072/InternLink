import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from './SocketContext';
import { messageService } from '../services/messageService';
import { useAuth } from './AuthContext';

const MessageContext = createContext();

export const MessageProvider = ({ children }) => {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const [socketConnected, setSocketConnected] = useState(false);
  const [sendMessageError, setSendMessageError] = useState(null);
  const { socket } = useSocket();
  const { user } = useAuth();
  const pendingMessagesRef = useRef(new Map());

  const computeUnreadCounts = useCallback((convs, msgs = []) => {
    const counts = {};
    convs.forEach((conv) => {
      const count = msgs.filter(
        (m) => m.conversation?.toString() === conv._id?.toString() &&
        !m.isMine &&
        (m.status === 'sent' || m.status === 'delivered')
      ).length;
      counts[conv._id] = count;
    });
    return counts;
  }, []);

  const fetchConversations = useCallback(async (filter = 'all', search = '') => {
    try {
      setLoading(true);
      const data = await messageService.getConversations(filter, search);
      setConversations(data);
      const counts = {};
      data.forEach((conv) => { counts[conv._id] = conv.unreadCount || 0; });
      return data;
    } catch (error) {
      console.error('Failed to load conversations:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMessages = useCallback(async (conversationId, limit = 50, before = null) => {
    try {
      setMessagesLoading(true);
      const response = await messageService.getMessages(conversationId, limit, before);
      const data = response.messages || response;
      setMessages(data);
      return data;
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      return [];
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  const sendMessage = useCallback(async (conversationId, text, attachment = null, replyTo = null) => {
    const trimmedText = text?.trim();
    if (!trimmedText && !attachment) {
      throw new Error('Message cannot be empty');
    }

    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const optimisticMessage = {
      _id: tempId,
      conversation: conversationId,
      sender: user._id,
      message: trimmedText,
      messageType: attachment ? 'image' : 'text',
      attachments: attachment ? [{ url: URL.createObjectURL(attachment), type: attachment.type, name: attachment.name, size: attachment.size }] : [],
      replyTo,
      reactions: [],
      status: 'sending',
      edited: false,
      deleted: false,
      deletedFor: [],
      isMine: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    pendingMessagesRef.current.set(tempId, optimisticMessage);

    setMessages((prev) => [...prev, optimisticMessage]);
    setConversations((prev) => {
      const updated = prev.map((c) =>
        c._id === conversationId
          ? {
              ...c,
              lastMessage: trimmedText || '[Attachment]',
              lastMessageAt: new Date().toISOString()
            }
          : c
      );
      return updated.sort((a, b) => {
        if (a.isPinned !== b.isPinned) return b.isPinned - a.isPinned;
        return new Date(b.lastMessageAt) - new Date(a.lastMessageAt);
      });
    });

    try {
      const data = await messageService.sendMessage(conversationId, trimmedText, attachment, replyTo);

      setMessages((prev) =>
        prev.map((msg) => (msg._id === tempId ? data : msg))
      );

      pendingMessagesRef.current.delete(tempId);
      setSendMessageError(null);
      return data;
    } catch (error) {
      setSendMessageError(error.response?.data?.message || 'Message could not be sent. Please try again.');

      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === tempId
            ? { ...msg, status: 'failed', _id: tempId, error: true }
            : msg
        )
      );

      setTimeout(() => {
        setMessages((prev) => prev.filter((msg) => msg._id !== tempId));
        pendingMessagesRef.current.delete(tempId);
      }, 5000);

      throw error;
    }
  }, [user]);

  const markAsRead = useCallback(async (conversationId, messageIds) => {
    try {
      await messageService.markAsRead(conversationId, messageIds);
      setMessages((prev) =>
        prev.map((msg) =>
          messageIds.includes(msg._id) ? { ...msg, status: 'read' } : msg
        )
      );
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  }, []);

  const editMessage = useCallback(async (messageId, newMessage) => {
    try {
      const data = await messageService.editMessage(messageId, newMessage);
      setMessages((prev) =>
        prev.map((msg) => (msg._id === messageId ? data : msg))
      );
      return data;
    } catch (error) {
      console.error('Failed to edit message:', error);
      throw error;
    }
  }, []);

  const deleteMessage = useCallback(async (messageId, deleteForEveryone = false) => {
    try {
      await messageService.deleteMessage(messageId, deleteForEveryone);
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId
            ? deleteForEveryone
              ? { ...msg, deleted: true, message: 'This message was deleted', attachments: [] }
              : { ...msg, deletedFor: [...msg.deletedFor, user._id] }
            : msg
        )
      );
    } catch (error) {
      console.error('Failed to delete message:', error);
      throw error;
    }
  }, [user]);

  const reactToMessage = useCallback(async (messageId, emoji) => {
    try {
      const data = await messageService.reactToMessage(messageId, emoji);
      setMessages((prev) =>
        prev.map((msg) => (msg._id === messageId ? data : msg))
      );
      return data;
    } catch (error) {
      console.error('Failed to react to message:', error);
      throw error;
    }
  }, []);

  const archiveConversation = useCallback(async (conversationId) => {
    try {
      const data = await messageService.archiveConversation(conversationId);
      setConversations((prev) =>
        prev.map((c) => (c._id === conversationId ? { ...c, isArchived: data.isArchived } : c))
      );
      return data;
    } catch (error) {
      console.error('Failed to archive conversation:', error);
      throw error;
    }
  }, []);

  const pinConversation = useCallback(async (conversationId) => {
    try {
      const data = await messageService.pinConversation(conversationId);
      setConversations((prev) => {
        const updated = prev.map((c) =>
          c._id === conversationId ? { ...c, isPinned: data.isPinned } : c
        );
        return updated.sort((a, b) => {
          if (a.isPinned !== b.isPinned) return b.isPinned - a.isPinned;
          return new Date(b.lastMessageAt) - new Date(a.lastMessageAt);
        });
      });
      return data;
    } catch (error) {
      console.error('Failed to pin conversation:', error);
      throw error;
    }
  }, []);

  const muteConversation = useCallback(async (conversationId, duration = 'forever') => {
    try {
      const data = await messageService.muteConversation(conversationId, duration);
      setConversations((prev) =>
        prev.map((c) =>
          c._id === conversationId
            ? { ...c, isMuted: data.isMuted, mutedUntil: data.mutedUntil }
            : c
        )
      );
      return data;
    } catch (error) {
      console.error('Failed to mute conversation:', error);
      throw error;
    }
  }, []);

  const deleteConversation = useCallback(async (conversationId) => {
    try {
      await messageService.deleteConversation(conversationId);
      setConversations((prev) => prev.filter((c) => c._id !== conversationId));
      if (activeConversation?._id === conversationId) {
        setActiveConversation(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      throw error;
    }
  }, [activeConversation]);

  const unreadCounts = useCallback((conversationId) => {
    const conv = conversations.find((c) => c._id === conversationId);
    if (conv?.unreadCount !== undefined) return conv.unreadCount;
    return messages.filter(
      (m) =>
        m.conversation?.toString() === conversationId?.toString() &&
        !m.isMine &&
        (m.status === 'sent' || m.status === 'delivered')
    ).length;
  }, [conversations, messages]);

  const incrementUnread = useCallback((conversationId) => {
    setConversations((prev) =>
      prev.map((c) =>
        c._id === conversationId ? { ...c, unreadCount: (c.unreadCount || 0) + 1 } : c
      )
    );
  }, []);

  const clearUnread = useCallback((conversationId) => {
    setConversations((prev) =>
      prev.map((c) => (c._id === conversationId ? { ...c, unreadCount: 0 } : c))
    );
  }, []);

  useEffect(() => {
    if (!socket || !user) return;

    setSocketConnected(true);

    const handleNewMessage = ({ conversationId, message }) => {
      setMessages((prev) => {
        if (activeConversation && conversationId === activeConversation._id) {
          return [...prev, message];
        }
        return prev;
      });

      setConversations((prev) => {
        const existing = prev.find((c) => c._id === conversationId);
        if (existing) {
          return prev.map((c) =>
            c._id === conversationId
              ? {
                  ...c,
                  lastMessage: message.message || '[Attachment]',
                  lastMessageAt: message.createdAt,
                  unreadCount: activeConversation?._id === conversationId
                    ? c.unreadCount
                    : (c.unreadCount || 0) + 1
                }
              : c
          ).sort((a, b) => {
            if (a.isPinned !== b.isPinned) return b.isPinned - a.isPinned;
            return new Date(b.lastMessageAt) - new Date(a.lastMessageAt);
          });
        }
        return prev;
      });

      if (activeConversation && conversationId === activeConversation._id) {
        clearUnread(conversationId);
      } else {
        incrementUnread(conversationId);
      }
    };

    const handleTyping = ({ conversationId, userId }) => {
      setTypingUsers((prev) => ({ ...prev, [conversationId]: userId }));
    };

    const handleStopTyping = ({ conversationId, userId }) => {
      setTypingUsers((prev) => {
        const updated = { ...prev };
        if (updated[conversationId] === userId) {
          delete updated[conversationId];
        }
        return updated;
      });
    };

    const handleSeen = ({ conversationId }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.conversation?.toString() === conversationId?.toString() && msg.status !== 'read'
            ? { ...msg, status: 'read' }
            : msg
        )
      );
    };

    const handleReaction = ({ messageId, reactions }) => {
      setMessages((prev) =>
        prev.map((msg) => (msg._id === messageId ? { ...msg, reactions } : msg))
      );
    };

    const handleEdit = ({ messageId, message, edited, editedAt }) => {
      setMessages((prev) =>
        prev.map((msg) => (msg._id === messageId ? { ...msg, message, edited, editedAt } : msg))
      );
    };

    const handleDelete = ({ messageId, deleted }) => {
      setMessages((prev) =>
        prev.map((msg) => (msg._id === messageId ? { ...msg, deleted } : msg))
      );
    };

    const handleConversationUpdate = ({ conversationId, lastMessage, lastMessageAt }) => {
      setConversations((prev) =>
        prev.map((c) =>
          c._id === conversationId
            ? { ...c, lastMessage, lastMessageAt }
            : c
        )
      );
    };

    socket.on('message:new', handleNewMessage);
    socket.on('message:typing', handleTyping);
    socket.on('message:stopTyping', handleStopTyping);
    socket.on('message:seen', handleSeen);
    socket.on('message:reaction', handleReaction);
    socket.on('message:edit', handleEdit);
    socket.on('message:delete', handleDelete);
    socket.on('conversation:update', handleConversationUpdate);

    const handleDisconnect = () => {
      setSocketConnected(false);
    };

    socket.on('disconnect', handleDisconnect);

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('message:typing', handleTyping);
      socket.off('message:stopTyping', handleStopTyping);
      socket.off('message:seen', handleSeen);
      socket.off('message:reaction', handleReaction);
      socket.off('message:edit', handleEdit);
      socket.off('message:delete', handleDelete);
      socket.off('conversation:update', handleConversationUpdate);
      socket.off('disconnect', handleDisconnect);
    };
  }, [socket, user, activeConversation, incrementUnread, clearUnread]);

  const value = {
    conversations,
    activeConversation,
    setActiveConversation,
    messages,
    setMessages,
    loading,
    messagesLoading,
    typingUsers,
    socketConnected,
    sendMessageError,
    unreadCounts,
    fetchConversations,
    fetchMessages,
    sendMessage,
    markAsRead,
    editMessage,
    deleteMessage,
    reactToMessage,
    archiveConversation,
    pinConversation,
    muteConversation,
    deleteConversation,
    incrementUnread,
    clearUnread
  };

  return (
    <MessageContext.Provider value={value}>
      {children}
    </MessageContext.Provider>
  );
};

export const useMessages = () => useContext(MessageContext);
