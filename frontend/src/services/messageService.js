import api from './api';

export const messageService = {
   async getConversations(filter = 'all', search = '') {
     const params = new URLSearchParams();
     if (filter && filter !== 'all') params.set('filter', filter);
     if (search) params.set('search', search);
     const { data } = await api.get(`/messages/conversations?${params.toString()}`);
     return data;
   },

  async startConversation(recipientId) {
    const { data } = await api.post(`/messages/conversation/${recipientId}`);
    return data;
  },

   async getMessages(conversationId, limit = 50, before = null) {
     const params = new URLSearchParams();
     if (limit) params.set('limit', limit);
     if (before) params.set('before', before);
     const { data } = await api.get(`/messages/${conversationId}?${params.toString()}`);
     if (data.messages) return data;
     return { messages: data, hasMore: false, unreadCount: 0 };
   },

  async sendMessage(conversationId, text, attachment = null, replyTo = null) {
    const formData = new FormData();
    // Only append text when it's a non-empty string.
    // If we blindly append null/undefined, FormData serializes it as the string "null"
    // which bypasses the backend's empty-message validation.
    if (text && typeof text === 'string' && text.trim().length > 0) {
      formData.append('text', text.trim());
    }
    if (attachment) formData.append('attachment', attachment);
    if (replyTo) formData.append('replyTo', JSON.stringify(replyTo));

    const { data } = await api.post(`/messages/${conversationId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data;
  },


  async markAsRead(conversationId, messageIds) {
    const { data } = await api.put(`/messages/${conversationId}/read`, { messageIds });
    return data;
  },

  async editMessage(messageId, newMessage) {
    const { data } = await api.put(`/messages/${messageId}`, { message: newMessage });
    return data;
  },

  async deleteMessage(messageId, deleteForEveryone = false) {
    const { data } = await api.delete(`/messages/${messageId}`, {
      data: { deleteForEveryone }
    });
    return data;
  },

  async reactToMessage(messageId, emoji) {
    const { data } = await api.put(`/messages/${messageId}/react`, { emoji });
    return data;
  },

  async replyToMessage(messageId, replyText) {
    const { data } = await api.put(`/messages/${messageId}/reply`, { message: replyText });
    return data;
  },

  async archiveConversation(conversationId) {
    const { data } = await api.put(`/messages/archive/${conversationId}`);
    return data;
  },

  async pinConversation(conversationId) {
    const { data } = await api.put(`/messages/pin/${conversationId}`);
    return data;
  },

  async muteConversation(conversationId, duration = 'forever') {
    const { data } = await api.put(`/messages/mute/${conversationId}`, { duration });
    return data;
  },

  async uploadFile(file) {
    const formData = new FormData();
    formData.append('attachment', file);
    const { data } = await api.post('/messages/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data;
  },

  async searchMessages(query, conversationId = null) {
    const params = new URLSearchParams();
    params.set('q', query);
    if (conversationId) params.set('conversationId', conversationId);
    const { data } = await api.get(`/messages?${params.toString()}`);
    return data;
  },

  async deleteConversation(conversationId) {
    const { data } = await api.delete(`/messages/${conversationId}/chat`);
    return data;
  }
};
