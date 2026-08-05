import api from './api';

export const notificationService = {
  async getNotifications({ status = 'all', category = 'all', search = '', sort = 'newest', limit = 20, page = 1 } = {}) {
    const params = new URLSearchParams();
    if (status !== 'all') params.set('status', status);
    if (category !== 'all') params.set('category', category);
    if (search) params.set('search', search);
    if (sort) params.set('sort', sort);
    params.set('limit', String(limit));
    params.set('page', String(page));

    const { data } = await api.get(`/notifications?${params.toString()}`);
    return data;
  },

  async getUnreadNotifications() {
    const { data } = await api.get('/notifications/unread');
    return data;
  },

  async getNotificationById(id) {
    const { data } = await api.get(`/notifications/${id}`);
    return data;
  },

  async getStats() {
    const { data } = await api.get('/notifications/stats');
    return data;
  },

  async getPreferences() {
    const { data } = await api.get('/notifications/preferences');
    return data;
  },

  async updatePreferences(preferences) {
    const { data } = await api.put('/notifications/preferences', preferences);
    return data;
  },

  async markAsRead(id) {
    const { data } = await api.put(`/notifications/${id}/read`);
    return data;
  },

  async markAllAsRead() {
    const { data } = await api.put('/notifications/read-all');
    return data;
  },

  async markBulkAsRead(ids) {
    const { data } = await api.put('/notifications/read-bulk', { ids });
    return data;
  },

  async deleteNotification(id) {
    const { data } = await api.delete(`/notifications/${id}`);
    return data;
  },

  async deleteReadNotifications() {
    const { data } = await api.delete('/notifications/read');
    return data;
  },

  async bulkDeleteNotifications(ids) {
    const { data } = await api.delete('/notifications/bulk', { data: { ids } });
    return data;
  }
};
