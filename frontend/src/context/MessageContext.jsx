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
  const messageRequestRef = useRef(0);

  const [hasMore, setHasMore] = useState(false);
  const activeConversationRef = useRef(activeConversation);
  activeConversationRef.current = activeConversation;

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
      return data;
    } catch (error) {
      console.error('Failed to load conversations:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMessages = useCallback(async (conversationId, limit = 50, before = null) => {
    const requestId = ++messageRequestRef.current;
    try {
      setMessagesLoading(true);
      // Clear messages immediately when loading a new conversation (not pagination)
      // to prevent stale messages from a previous conversation flashing on screen.
      if (!before) {
        setMessages([]);
      }
      const response = await messageService.getMessages(conversationId, limit, before);
      const fetched = response.messages || (Array.isArray(response) ? response : []);
      // A slow response for a conversation that is no longer active must not
      // replace the newly selected thread.
      if (requestId !== messageRequestRef.current) return [];
      setHasMore(Boolean(response.hasMore));

      if (before) {
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m._id));
          const newMsgs = fetched.filter((m) => !existingIds.has(m._id));
          return [...newMsgs, ...prev];
        });
      } else {
        setMessages(fetched);
      }
      return fetched;
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      return [];
    } finally {
      if (requestId === messageRequestRef.current) {
        setMessagesLoading(false);
      }
    }
  }, []);

  const sendMessage = useCallback(async (conversationId, text, attachment = null, replyTo = null) => {
    const trimmedText = text?.trim();
    if (!trimmedText && !attachment) {
      throw new Error('Message cannot be empty');
    }

    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const clientMessageId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 14)}`;
    const optimisticMessage = {
      _id: tempId,
      clientMessageId,
      conversation: conversationId,
      sender: user._id,
      message: trimmedText || '',
      messageType: attachment ? (attachment.type.startsWith('image/') ? 'image' : 'document') : 'text',
      attachments: attachment ? [{ url: URL.createObjectURL(attachment), type: attachment.type, name: attachment.name, size: attachment.size }] : [],
      replyTo: replyTo ? {
        messageId: replyTo._id || replyTo.messageId,
        text: replyTo.message || replyTo.text || '',
        senderName: replyTo.sender?.name || replyTo.senderName || 'Unknown',
        senderId: replyTo.sender?._id || replyTo.senderId
      } : null,
      reactions: [],
      status: 'sending',
      edited: false,
      deleted: false,
      deletedFor: [],
      isMine: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    pendingMessagesRef.current.set(tempId, { ...optimisticMessage, _attachment: attachment });

    setMessages((prev) => [...prev, optimisticMessage]);
    setConversations((prev) => {
      const updated = prev.map((c) =>
        c._id === conversationId
          ? {
              ...c,
              lastMessage: trimmedText || (attachment ? '[Attachment]' : ''),
              lastMessageAt: new Date().toISOString()
            }
          : c
      );
      return updated.sort((a, b) => {
        if (a.isPinned !== b.isPinned) return (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0);
        return new Date(b.lastMessageAt) - new Date(a.lastMessageAt);
      });
    });

    try {
      const data = await messageService.sendMessage(
        conversationId,
        trimmedText,
        attachment,
        replyTo,
        clientMessageId
      );

      setMessages((prev) =>
        prev.map((msg) => (msg._id === tempId ? data : msg))
      );

      pendingMessagesRef.current.delete(tempId);
      setSendMessageError(null);
      return data;
    } catch (error) {
      setSendMessageError(error.response?.data?.message || 'Message could not be sent. Please try again.');
      const pending = pendingMessagesRef.current.get(tempId);
      if (pending) pending.status = 'failed';

      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === tempId
            ? { ...msg, status: 'failed', error: true }
            : msg
        )
      );

      throw error;
    }
  }, [user]);

  const retryMessage = useCallback(async (tempId) => {
    const pending = pendingMessagesRef.current.get(tempId);
    if (!pending || pending.status !== 'failed') return;

    setMessages((prev) => prev.map((message) => (
      message._id === tempId ? { ...message, status: 'sending', error: false } : message
    )));
    pending.status = 'sending';

    try {
      const data = await messageService.sendMessage(
        pending.conversation,
        pending.message,
        pending._attachment,
        pending.replyTo,
        pending.clientMessageId
      );
      setMessages((prev) => prev.map((message) => (message._id === tempId ? data : message)));
      pendingMessagesRef.current.delete(tempId);
      setSendMessageError(null);
    } catch (error) {
      pending.status = 'failed';
      setMessages((prev) => prev.map((message) => (
        message._id === tempId ? { ...message, status: 'failed', error: true } : message
      )));
      setSendMessageError(error.response?.data?.message || 'Message could not be sent. Please try again.');
      throw error;
    }
  }, []);

  const loadOlderMessages = useCallback(async () => {
    const conversationId = activeConversationRef.current?._id;
    const oldestMessage = messages[0];
    if (!conversationId || !oldestMessage?.createdAt || !hasMore) return [];
    return fetchMessages(conversationId, 50, oldestMessage.createdAt);
  }, [messages, hasMore, fetchMessages]);

  const clearUnread = useCallback((conversationId) => {
    setConversations((prev) =>
      prev.map((c) => (c._id === conversationId ? { ...c, unreadCount: 0 } : c))
    );
  }, []);

  const markAsRead = useCallback(async (conversationId, messageIds) => {
    try {
      await messageService.markAsRead(conversationId, messageIds);
      setMessages((prev) => prev.map((msg) => {
        const senderId = msg.sender?._id?.toString() || msg.sender?.toString();
        const isIncoming = senderId !== user?._id?.toString();
        const isTarget = !messageIds || messageIds.length === 0 || messageIds.includes(msg._id);
        return isIncoming && isTarget ? { ...msg, status: 'read' } : msg;
      }));
      clearUnread(conversationId);
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  }, [user, clearUnread]);

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
              : { ...msg, deletedFor: [...(msg.deletedFor || []), user._id] }
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
          if (a.isPinned !== b.isPinned) return (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0);
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

  useEffect(() => {
    if (!socket || !user) return;

    setSocketConnected(true);

    const handleNewMessage = ({ conversationId, message, senderId: payloadSenderId }) => {
      if (!conversationId || !message?._id) return;
      const currentActive = activeConversationRef.current;
      const senderId = payloadSenderId || message.sender?._id || message.sender;
      const isFromOther = senderId && user?._id && senderId.toString() !== user._id.toString();

      setMessages((prev) => {
        if (currentActive && conversationId === currentActive._id) {
          const exists = prev.some((m) => m._id === message._id);
          if (exists) return prev.map((m) => (m._id === message._id ? message : m));

          // Reconcile the server event with the exact optimistic send. Matching
          // on message text alone can replace the wrong message when text repeats.
          const tempIndex = prev.findIndex(
            (m) => typeof m._id === 'string' &&
              m._id.startsWith('temp_') &&
              m.clientMessageId &&
              m.clientMessageId === message.clientMessageId
          );
          if (tempIndex !== -1) {
            const updated = [...prev];
            updated[tempIndex] = message;
            return updated;
          }

          return [...prev, message];
        }
        return prev;
      });

      if (isFromOther) {
        // Receipt is deliberately separate from read: this only confirms that
        // this authenticated client received the persisted socket payload.
        socket.emit('message:received', { conversationId, messageId: message._id });
      }

      // NOTE: Do NOT emit message:delivered from the client.
      // The backend sendMessage controller handles delivered status when the
      // recipient is online (checks userSocketMap) — this is the authoritative source.
      // A client-side emit here would create a race condition and is a security risk.

      setConversations((prev) => {
        const existing = prev.find((c) => c._id === conversationId);
        if (existing) {
          return prev
            .map((c) =>
              c._id === conversationId
                ? {
                    ...c,
                    lastMessage: message.message || '[Attachment]',
                    lastMessageAt: message.createdAt || new Date().toISOString(),
                    unreadCount: currentActive?._id === conversationId
                      ? 0
                      : isFromOther
                      ? (c.unreadCount || 0) + 1
                      : c.unreadCount || 0
                  }
                : c
            )
            .sort((a, b) => {
              if (a.isPinned !== b.isPinned) return (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0);
              return new Date(b.lastMessageAt) - new Date(a.lastMessageAt);
            });
        } else {
          fetchConversations();
          return prev;
        }
      });

      if (currentActive && conversationId === currentActive._id) {
        clearUnread(conversationId);
      }
    };

    const handleDelivered = ({ conversationId, messageId, messageIds }) => {
      const ids = new Set();
      if (messageIds && Array.isArray(messageIds)) {
        messageIds.forEach((id) => ids.add(id));
      } else if (messageId) {
        ids.add(messageId);
      }

      setMessages((prev) =>
        prev.map((msg) => {
          if (ids.size > 0 && !ids.has(msg._id)) return msg;
          if (msg.conversation?.toString() === conversationId?.toString()) {
            if (msg.status !== 'read') {
              return { ...msg, status: 'delivered' };
            }
          }
          return msg;
        })
      );
    };

    const handleSeen = ({ conversationId, messageIds }) => {
      setMessages((prev) =>
        prev.map((msg) => {
          const senderId = msg.sender?._id?.toString() || msg.sender?.toString();
          const isTarget =
            (!messageIds || messageIds.length === 0 || messageIds.includes(msg._id)) &&
            msg.conversation?.toString() === conversationId?.toString() &&
            senderId === user?._id?.toString();
          if (isTarget) {
            return { ...msg, status: 'read' };
          }
          return msg;
        })
      );

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
        prev
          .map((c) =>
            c._id === conversationId
              ? { ...c, lastMessage, lastMessageAt }
              : c
          )
          .sort((a, b) => {
            if (a.isPinned !== b.isPinned) return (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0);
            return new Date(b.lastMessageAt) - new Date(a.lastMessageAt);
          })
      );
    };

    socket.on('message:new', handleNewMessage);
    socket.on('message:delivered', handleDelivered);
    socket.on('message:typing', handleTyping);
    socket.on('message:stopTyping', handleStopTyping);
    socket.on('message:seen', handleSeen);
    socket.on('message:reaction', handleReaction);
    socket.on('message:edit', handleEdit);
    socket.on('message:delete', handleDelete);
    socket.on('conversation:update', handleConversationUpdate);

    const handleConnect = () => {
      setSocketConnected(true);
      fetchConversations();
      const current = activeConversationRef.current;
      if (current?._id) fetchMessages(current._id);
    };

    const handleDisconnect = () => {
      setSocketConnected(false);
    };

    socket.on('disconnect', handleDisconnect);
    socket.on('connect', handleConnect);

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('message:delivered', handleDelivered);
      socket.off('message:typing', handleTyping);
      socket.off('message:stopTyping', handleStopTyping);
      socket.off('message:seen', handleSeen);
      socket.off('message:reaction', handleReaction);
      socket.off('message:edit', handleEdit);
      socket.off('message:delete', handleDelete);
      socket.off('conversation:update', handleConversationUpdate);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect', handleConnect);
    };
  }, [socket, user, clearUnread, fetchConversations, fetchMessages]);

  const value = {
    conversations,
    activeConversation,
    setActiveConversation,
    messages,
    setMessages,
    loading,
    messagesLoading,
    hasMore,
    typingUsers,
    socketConnected,
    sendMessageError,
    unreadCounts,
    fetchConversations,
    fetchMessages,
    loadOlderMessages,
    sendMessage,
    retryMessage,
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
