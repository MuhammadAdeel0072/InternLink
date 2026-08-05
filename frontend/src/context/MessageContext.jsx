import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
  const [unreadCounts, setUnreadCounts] = useState({});
  const [typingUsers, setTypingUsers] = useState({});
  const [socketConnected, setSocketConnected] = useState(false);
  const { socket } = useSocket();
  const { user } = useAuth();

  const fetchConversations = useCallback(async (filter = 'all', search = '') => {
    try {
      setLoading(true);
      const data = await messageService.getConversations(filter, search);
      setConversations(data);
      return data;
    } catch (error) {
      console.error('Failed to load conversations:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMessages = useCallback(async (conversationId) => {
    try {
      setMessagesLoading(true);
      const data = await messageService.getMessages(conversationId);
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
    try {
      const data = await messageService.sendMessage(conversationId, text, attachment, replyTo);
      setMessages((prev) => [...prev, data]);
      setConversations((prev) => {
        const updated = prev.map((c) =>
          c._id === conversationId
            ? {
                ...c,
                lastMessage: text || (data.messageType === 'image' ? '[Image]' : data.messageType === 'resume' ? '[Resume]' : '[Attachment]'),
                lastMessageAt: data.createdAt
              }
            : c
        );
        return updated.sort((a, b) => {
          if (a.isPinned !== b.isPinned) return b.isPinned - a.isPinned;
          return new Date(b.lastMessageAt) - new Date(a.lastMessageAt);
        });
      });
      return data;
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }, []);

  const markAsRead = useCallback(async (conversationId, messageIds) => {
    try {
      await messageService.markAsRead(conversationId, messageIds);
      setMessages((prev) =>
        prev.map((msg) =>
          messageIds.includes(msg._id) ? { ...msg, status: 'read' } : msg
        )
      );
      setUnreadCounts((prev) => ({ ...prev, [conversationId]: 0 }));
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
          msg._id === messageId ? { ...msg, deleted: true, deletedFor: [...msg.deletedFor, user._id] } : msg
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
        const updated = prev.map((c) => (c._id === conversationId ? { ...c, isPinned: data.isPinned } : c));
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
        prev.map((c) => (c._id === conversationId ? { ...c, isMuted: data.isMuted, mutedUntil: data.mutedUntil } : c))
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

  const incrementUnread = useCallback((conversationId) => {
    setUnreadCounts((prev) => ({
      ...prev,
      [conversationId]: (prev[conversationId] || 0) + 1
    }));
  }, []);

  const clearUnread = useCallback((conversationId) => {
    setUnreadCounts((prev) => ({ ...prev, [conversationId]: 0 }));
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
              ? { ...c, lastMessage: message.message || '[Attachment]', lastMessageAt: message.createdAt }
              : c
          );
        }
        return prev;
      });

      if (activeConversation && conversationId === activeConversation._id) {
        setUnreadCounts((prev) => ({ ...prev, [conversationId]: 0 }));
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
          msg.conversation?.toString() === conversationId?.toString() && msg.status !== 'read' ? { ...msg, status: 'read' } : msg
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
          c._id === conversationId ? { ...c, lastMessage, lastMessageAt } : c
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

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('message:typing', handleTyping);
      socket.off('message:stopTyping', handleStopTyping);
      socket.off('message:seen', handleSeen);
      socket.off('message:reaction', handleReaction);
      socket.off('message:edit', handleEdit);
      socket.off('message:delete', handleDelete);
      socket.off('conversation:update', handleConversationUpdate);
    };
  }, [socket, user, activeConversation, incrementUnread]);

  const value = {
    conversations,
    activeConversation,
    setActiveConversation,
    messages,
    loading,
    messagesLoading,
    unreadCounts,
    typingUsers,
    socketConnected,
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
    clearUnread,
    setMessages
  };

  return (
    <MessageContext.Provider value={value}>
      {children}
    </MessageContext.Provider>
  );
};

export const useMessages = () => useContext(MessageContext);
